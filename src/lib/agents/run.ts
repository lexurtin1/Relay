import { runPlanner, runScout } from "@relay/agents";
import { prisma } from "@relay/core";
import { AgentEventType, AuditAction, PlanStatus, ResearchRunStatus, WorkstreamStage } from "@prisma/client";
import { useDemoFixtures } from "@/lib/db";
import {
  appendDemoEvent,
  applyScoutToDemo,
  patchDemoAgentState,
} from "@/lib/demo-agent-store";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";

export async function startScoutResearch(workstreamId: string): Promise<{ ok: true }> {
  if (useDemoFixtures()) {
    return startScoutDemo(workstreamId);
  }
  return startScoutDb(workstreamId);
}

export async function startPlannerDraft(workstreamId: string): Promise<{ ok: true }> {
  if (useDemoFixtures()) {
    return startPlannerDemo(workstreamId);
  }
  return startPlannerDb(workstreamId);
}

async function startScoutDemo(workstreamId: string): Promise<{ ok: true }> {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) throw new Error("Workstream not found");

  patchDemoAgentState(workstreamId, { researchStatus: "running", stage: "research" });
  appendDemoEvent(workstreamId, { type: "status", summary: "Scout queued research" });

  // Fire-and-forget so the UI can subscribe to SSE while Scout runs.
  void (async () => {
    try {
      const result = await runScout({
        title: detail.title,
        problem: detail.problemStatement,
        onEvent: async (event) => {
          appendDemoEvent(workstreamId, {
            type: event.type,
            summary: event.summary,
          });
        },
      });
      applyScoutToDemo(workstreamId, result);
    } catch (error) {
      patchDemoAgentState(workstreamId, { researchStatus: "failed" });
      appendDemoEvent(workstreamId, {
        type: "status",
        summary: error instanceof Error ? error.message : "Scout failed",
      });
    }
  })();

  return { ok: true };
}

async function startPlannerDemo(workstreamId: string): Promise<{ ok: true }> {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) throw new Error("Workstream not found");
  const state = (await import("@/lib/demo-agent-store")).getDemoAgentState(workstreamId);
  const findings = state.researchSummary ?? detail.researchSummary ?? detail.problemStatement;

  patchDemoAgentState(workstreamId, { planStatus: "running", stage: "planning" });
  appendDemoEvent(workstreamId, { type: "status", summary: "Planner drafting plan v1" });

  void (async () => {
    try {
      const result = await runPlanner({
        title: detail.title,
        problem: detail.problemStatement,
        findings,
        onEvent: async (event) => {
          appendDemoEvent(workstreamId, {
            type: event.type,
            summary: event.summary,
          });
        },
      });
      const version = (state.planVersion ?? 0) + 1;
      patchDemoAgentState(workstreamId, {
        planStatus: "succeeded",
        planMarkdown: result.markdownBody,
        planSteps: result.steps,
        planVersion: version,
        stage: "in_review",
        history: [
          {
            id: `h_plan_${Date.now()}`,
            label: `Plan v${version} generated`,
            at: new Date().toISOString(),
          },
          ...(state.history ?? detail.history),
        ],
      });
    } catch (error) {
      patchDemoAgentState(workstreamId, { planStatus: "failed" });
      appendDemoEvent(workstreamId, {
        type: "status",
        summary: error instanceof Error ? error.message : "Planner failed",
      });
    }
  })();

  return { ok: true };
}

async function startScoutDb(workstreamId: string): Promise<{ ok: true }> {
  const workstream = await prisma.workstream.findUnique({ where: { id: workstreamId } });
  if (!workstream) throw new Error("Workstream not found");

  const run = await prisma.researchRun.create({
    data: {
      workstreamId,
      status: ResearchRunStatus.running,
      startedAt: new Date(),
    },
  });

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: { stage: WorkstreamStage.research, lastActivityAt: new Date() },
  });

  void (async () => {
    try {
      const result = await runScout({
        title: workstream.title,
        problem: workstream.problemStatement,
        onEvent: async (event) => {
          await prisma.agentEvent.create({
            data: {
              researchRunId: run.id,
              type: mapEventType(event.type),
              payload: { summary: event.summary, ...(event.payload ?? {}) },
            },
          });
        },
      });

      await prisma.researchRun.update({
        where: { id: run.id },
        data: {
          status: ResearchRunStatus.succeeded,
          findings: result.findings,
          sourcesConsulted: result.sources,
          tokenUsage: result.tokenUsage,
          finishedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: workstream.ownerId,
          action: AuditAction.model_call,
          workstreamId,
          tokenInput: result.tokenUsage,
          detail: `Scout research completed (${run.id})`,
        },
      });
    } catch (error) {
      await prisma.researchRun.update({
        where: { id: run.id },
        data: {
          status: ResearchRunStatus.failed,
          finishedAt: new Date(),
          findings: error instanceof Error ? error.message : "Scout failed",
        },
      });
    }
  })();

  return { ok: true };
}

async function startPlannerDb(workstreamId: string): Promise<{ ok: true }> {
  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      researchRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      plans: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!workstream) throw new Error("Workstream not found");

  const findings =
    workstream.researchRuns[0]?.findings ?? workstream.problemStatement;
  const nextVersion = (workstream.plans[0]?.versionNumber ?? 0) + 1;

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: { stage: WorkstreamStage.planning, lastActivityAt: new Date() },
  });

  void (async () => {
    try {
      const result = await runPlanner({
        title: workstream.title,
        problem: workstream.problemStatement,
        findings,
        onEvent: async (event) => {
          const researchRunId = workstream.researchRuns[0]?.id;
          if (!researchRunId) return;
          await prisma.agentEvent.create({
            data: {
              researchRunId,
              type: mapEventType(event.type),
              payload: { summary: event.summary, ...(event.payload ?? {}) },
            },
          });
        },
      });

      const plan = await prisma.plan.create({
        data: {
          workstreamId,
          versionNumber: nextVersion,
          status: PlanStatus.in_review,
          markdownBody: result.markdownBody,
          steps: {
            create: result.steps.map((step) => ({
              order: step.order,
              title: step.title,
              description: step.description,
              filesLikelyTouched: step.filesLikelyTouched,
              testsToAdd: step.testsToAdd,
              riskLevel: step.riskLevel,
            })),
          },
        },
      });

      await prisma.workstream.update({
        where: { id: workstreamId },
        data: { stage: WorkstreamStage.in_review, lastActivityAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          userId: workstream.ownerId,
          action: AuditAction.model_call,
          workstreamId,
          planId: plan.id,
          tokenInput: result.tokenUsage,
          detail: `Planner created plan v${nextVersion}`,
        },
      });
    } catch {
      await prisma.workstream.update({
        where: { id: workstreamId },
        data: { stage: WorkstreamStage.research, lastActivityAt: new Date() },
      });
    }
  })();

  return { ok: true };
}

function mapEventType(type: string): AgentEventType {
  switch (type) {
    case "tool_call":
      return AgentEventType.tool_call;
    case "tool_result":
      return AgentEventType.tool_result;
    case "thought_summary":
      return AgentEventType.thought_summary;
    default:
      return AgentEventType.status;
  }
}
