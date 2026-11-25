"use server";

import { assertDatabase } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { prisma, WORKSTREAM_COLOURS } from "@relay/core";
import { writeAudit } from "@relay/core/audit";
import { handOffToRunnerJob } from "@relay/core/runner/hand-off";
import { enqueueRunnerJob } from "@/lib/runner-queue";
import {
  AgentEventType,
  IdeaStatus,
  IdeaType,
  ResearchRunStatus,
  WorkstreamOrigin,
  WorkstreamPriority,
  WorkstreamStage,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/session";

export async function createIdea(formData: FormData) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "friction_log") as IdeaType;
  if (!title || !description) throw new Error("Title and description are required.");

  await prisma.idea.create({
    data: {
      title,
      description,
      type: type === IdeaType.external_signal ? IdeaType.external_signal : IdeaType.friction_log,
      submittedById: user.id,
      status: IdeaStatus.new,
    },
  });

  revalidatePath("/ideas");
  revalidatePath("/");
}

export async function setIdeaStatus(formData: FormData) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  if (user.role === "viewer" || user.role === "engineer") {
    throw new Error("Only leads and architects can triage ideas.");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as IdeaStatus;
  if (!id || !Object.values(IdeaStatus).includes(status)) {
    throw new Error("Invalid idea status.");
  }
  if (status === IdeaStatus.promoted) {
    throw new Error("Use promote to link a workstream.");
  }

  await prisma.idea.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/ideas");
  revalidatePath("/");
}

export async function promoteIdea(formData: FormData) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  if (user.role === "viewer" || user.role === "engineer") {
    throw new Error("Only leads and architects can promote ideas.");
  }

  const id = String(formData.get("id") ?? "");
  const workstreamId = String(formData.get("workstreamId") ?? "").trim();
  const createNew = String(formData.get("createNew") ?? "") === "1";

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new Error("Idea not found.");

  let targetId = workstreamId || null;

  if (createNew || !targetId) {
    const created = await prisma.workstream.create({
      data: {
        title: idea.title,
        problemStatement: idea.description,
        stage: WorkstreamStage.idea,
        origin:
          idea.type === IdeaType.external_signal
            ? WorkstreamOrigin.external_opportunity
            : WorkstreamOrigin.internal_friction,
        priority: WorkstreamPriority.medium,
        color: WORKSTREAM_COLOURS.context,
        ownerId: user.id,
      },
    });
    targetId = created.id;
  } else {
    const ws = await prisma.workstream.findUnique({ where: { id: targetId } });
    if (!ws) throw new Error("Workstream not found.");
  }

  // Colour inherits from the linked workstream automatically in the UI.

  await prisma.idea.update({
    where: { id },
    data: {
      status: IdeaStatus.promoted,
      workstreamId: targetId,
    },
  });

  revalidatePath("/ideas");
  revalidatePath("/");
  revalidatePath(`/workstreams/${targetId}`);
}

export async function handOffToRunner(formData: FormData) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  const workstreamId = String(formData.get("workstreamId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const additional = String(formData.get("additionalContext") ?? "").trim();
  const modelId = String(formData.get("modelId") ?? "claude-opus-5-5");
  const profile = String(formData.get("profile") ?? "default");

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: {
        where: planId ? { id: planId } : undefined,
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { approvals: true },
      },
    },
  });
  const plan = workstream?.plans[0] ?? null;

  await handOffToRunnerJob(
    {
      user: { id: user.id, role: user.role },
      workstream: workstream ? { id: workstream.id, ownerId: workstream.ownerId } : null,
      plan: plan ? { id: plan.id, status: plan.status, approvalCount: plan.approvals.length } : null,
      additionalContext: additional,
      modelId,
      profile,
    },
    {
      createJob: async (input) =>
        prisma.runnerJob.create({
          data: {
            workstreamId: input.workstreamId,
            planId: input.planId,
            status: "queued",
            additionalInstructions: input.additionalInstructions,
          },
        }),
      markBuilding: async (id) => {
        await prisma.workstream.update({
          where: { id },
          data: { stage: "building", lastActivityAt: new Date() },
        });
      },
      audit: (row) => writeAudit(row).then(() => undefined),
      enqueue: (jobId) => enqueueRunnerJob(jobId),
    },
  );

  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
}

export async function continueResearch(formData: FormData) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  const workstreamId = String(formData.get("workstreamId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  if (!workstreamId || !question) throw new Error("Question required.");

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
  });
  if (!workstream) throw new Error("Workstream not found.");

  await prisma.researchRun.create({
    data: {
      workstreamId,
      status: ResearchRunStatus.running,
      sourcesConsulted: [
        { connector: "confluence", title: "Follow-up research", itemId: "follow-up" },
        { connector: "jira", title: "Related tickets", itemId: "jira-follow" },
        { connector: "datadog", title: "Ops signals", itemId: "dd-follow" },
      ],
      findings: null,
      startedAt: new Date(),
      events: {
        create: [
          {
            type: AgentEventType.status,
            payload: {
              text: `Researching: ${question}`,
              summary: question,
            },
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "confluence.search", query: question },
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "jira.search", query: question },
          },
        ],
      },
    },
  });

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: {
      stage:
        workstream.stage === "idea" || workstream.stage === "merged"
          ? "research"
          : workstream.stage,
      lastActivityAt: new Date(),
    },
  });

  revalidatePath(`/workstreams/${workstreamId}`);
}
