import { runPlanner } from "@relay/agents";
import { prisma } from "@relay/core";
import {
  AuditAction,
  PlanStatus,
  RunnerJobStatus,
  WorkstreamStage,
} from "@prisma/client";
import { useDemoFixtures } from "@/lib/db";
import {
  addDemoComment,
  applyDemoApproval,
  applyDemoHandOff,
  applyDemoRevision,
  ensureDemoComments,
  listDemoApprovals,
  listDemoComments,
  resolveDemoComment,
} from "@/lib/demo-review-store";
import { getDemoAgentState } from "@/lib/demo-agent-store";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";

export async function addPlanComment(input: {
  workstreamId: string;
  planId: string;
  authorId: string;
  authorName: string;
  body: string;
  anchorText?: string | null;
  stepId?: string | null;
  parentId?: string | null;
}): Promise<{ ok: true; commentId: string }> {
  const body = input.body.trim();
  if (!body) throw new Error("Comment body is required.");

  if (useDemoFixtures()) {
    const row = addDemoComment(input.workstreamId, {
      body,
      authorId: input.authorId,
      authorName: input.authorName,
      anchorText: input.anchorText,
      stepId: input.stepId,
      parentId: input.parentId,
    });
    return { ok: true, commentId: row.id };
  }

  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan || plan.workstreamId !== input.workstreamId) {
    throw new Error("Plan not found.");
  }

  const comment = await prisma.comment.create({
    data: {
      planId: input.planId,
      authorId: input.authorId,
      body,
      anchorText: input.anchorText?.trim() || null,
      stepId: input.stepId || null,
      parentId: input.parentId || null,
    },
  });

  await prisma.workstream.update({
    where: { id: input.workstreamId },
    data: { lastActivityAt: new Date() },
  });

  return { ok: true, commentId: comment.id };
}

export async function resolvePlanComment(input: {
  workstreamId: string;
  commentId: string;
}): Promise<{ ok: true }> {
  if (useDemoFixtures()) {
    resolveDemoComment(input.workstreamId, input.commentId);
    return { ok: true };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: input.commentId },
    include: { plan: true },
  });
  if (!comment || comment.plan.workstreamId !== input.workstreamId) {
    throw new Error("Comment not found.");
  }

  await prisma.comment.update({
    where: { id: input.commentId },
    data: { resolved: true },
  });
  await prisma.comment.updateMany({
    where: { parentId: input.commentId, resolved: false },
    data: { resolved: true },
  });

  return { ok: true };
}

export async function revisePlanFromComments(input: {
  workstreamId: string;
  actorUserId: string;
}): Promise<{ ok: true }> {
  if (useDemoFixtures()) {
    return reviseDemo(input.workstreamId);
  }
  return reviseDb(input);
}

export async function approvePlan(input: {
  workstreamId: string;
  planId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
}): Promise<{ ok: true }> {
  if (input.approverRole !== "architect" && input.approverRole !== "lead") {
    throw new Error("Only architects and leads can approve plans.");
  }

  if (useDemoFixtures()) {
    const open = listDemoComments(input.workstreamId).filter((c) => !c.resolved);
    if (open.length > 0) {
      throw new Error("Resolve open comments before approval.");
    }
    if (listDemoApprovals(input.workstreamId).length > 0) {
      throw new Error("Plan already approved.");
    }
    applyDemoApproval(input.workstreamId, {
      approverId: input.approverId,
      approverName: input.approverName,
      approverRole: input.approverRole,
    });
    return { ok: true };
  }

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId },
    include: {
      comments: { where: { resolved: false } },
      approvals: true,
    },
  });
  if (!plan || plan.workstreamId !== input.workstreamId) {
    throw new Error("Plan not found.");
  }
  if (plan.status !== PlanStatus.in_review) {
    throw new Error("Plan must be in review.");
  }
  if (plan.comments.length > 0) {
    throw new Error("Resolve open comments before approval.");
  }
  if (plan.approvals.some((a) => a.approverId === input.approverId)) {
    throw new Error("You already approved this plan.");
  }

  await prisma.approval.create({
    data: { planId: plan.id, approverId: input.approverId },
  });
  await prisma.plan.update({
    where: { id: plan.id },
    data: { status: PlanStatus.approved },
  });
  await prisma.workstream.update({
    where: { id: input.workstreamId },
    data: { stage: WorkstreamStage.approved, lastActivityAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      userId: input.approverId,
      action: AuditAction.approval,
      workstreamId: input.workstreamId,
      planId: plan.id,
      detail: `Plan v${plan.versionNumber} approved`,
    },
  });

  return { ok: true };
}

export async function handOffToRunner(input: {
  workstreamId: string;
  actorUserId: string;
}): Promise<{ ok: true; runnerJobId: string }> {
  if (useDemoFixtures()) {
    const detail = getDemoWorkstreamDetail(input.workstreamId);
    if (!detail) throw new Error("Workstream not found");
    if (detail.ownerId !== input.actorUserId) {
      throw new Error("Only the owner can hand off.");
    }
    const approvals = listDemoApprovals(input.workstreamId);
    const architectOk = approvals.some(
      (a) => a.approverRole === "architect" || a.approverRole === "lead",
    );
    if (!architectOk) throw new Error("Needs an architect or lead approval.");
    const jobId = applyDemoHandOff(input.workstreamId);
    const { startRunnerAfterHandOff } = await import("@/lib/runner/run");
    void startRunnerAfterHandOff({
      workstreamId: input.workstreamId,
      runnerJobId: jobId,
    });
    return { ok: true, runnerJobId: jobId };
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id: input.workstreamId },
    include: {
      plans: {
        include: {
          approvals: { include: { approver: true } },
        },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      runnerJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!workstream) throw new Error("Workstream not found");
  if (workstream.ownerId !== input.actorUserId) {
    throw new Error("Only the owner can hand off.");
  }

  const plan = workstream.plans[0];
  if (!plan) throw new Error("An approved plan is required.");

  const architectOk = plan.approvals.some(
    (a) => a.approver.role === "architect" || a.approver.role === "lead",
  );
  if (plan.status !== PlanStatus.approved && !architectOk) {
    throw new Error("Needs an architect or lead approval.");
  }
  if (!architectOk) {
    throw new Error("Needs an architect or lead approval.");
  }

  if (workstream.runnerJobs[0]?.status === RunnerJobStatus.queued ||
    workstream.runnerJobs[0]?.status === RunnerJobStatus.running ||
    workstream.runnerJobs[0]?.status === RunnerJobStatus.provisioning) {
    return { ok: true, runnerJobId: workstream.runnerJobs[0]!.id };
  }

  const job = await prisma.runnerJob.create({
    data: {
      workstreamId: input.workstreamId,
      planId: plan.id,
      status: RunnerJobStatus.queued,
    },
  });

  await prisma.workstream.update({
    where: { id: input.workstreamId },
    data: { stage: WorkstreamStage.building, lastActivityAt: new Date() },
  });

  if (plan.status !== PlanStatus.approved) {
    await prisma.plan.update({
      where: { id: plan.id },
      data: { status: PlanStatus.approved },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: input.actorUserId,
      action: AuditAction.hand_off,
      workstreamId: input.workstreamId,
      planId: plan.id,
      runnerJobId: job.id,
      detail: "Handed off to Runner (queued)",
    },
  });

  const { startRunnerAfterHandOff } = await import("@/lib/runner/run");
  void startRunnerAfterHandOff({
    workstreamId: input.workstreamId,
    runnerJobId: job.id,
  });

  return { ok: true, runnerJobId: job.id };
}

async function reviseDemo(workstreamId: string): Promise<{ ok: true }> {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) throw new Error("Workstream not found");
  const comments = ensureDemoComments(workstreamId).filter((c) => !c.resolved);
  if (comments.length === 0) throw new Error("Open comments are required to revise.");

  const agent = getDemoAgentState(workstreamId);
  const findings = agent.researchSummary ?? detail.researchSummary ?? detail.problemStatement;
  const version =
    Math.max(agent.planVersion ?? 0, detail.plan.versionNumber ?? 0) + 1;

  const result = await runPlanner({
    title: detail.title,
    problem: detail.problemStatement,
    findings,
    version,
    comments: comments.map((c) => ({
      body: c.body,
      anchorText: c.anchorText,
      authorName: c.authorName,
    })),
  });

  applyDemoRevision(workstreamId, {
    markdownBody: result.markdownBody,
    steps: result.steps,
    version,
  });

  return { ok: true };
}

async function reviseDb(input: {
  workstreamId: string;
  actorUserId: string;
}): Promise<{ ok: true }> {
  const workstream = await prisma.workstream.findUnique({
    where: { id: input.workstreamId },
    include: {
      researchRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      plans: {
        include: {
          comments: {
            where: { resolved: false, parentId: null },
            include: { author: true },
          },
        },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
  if (!workstream) throw new Error("Workstream not found");
  const current = workstream.plans[0];
  if (!current) throw new Error("No plan to revise.");
  if (current.comments.length === 0) {
    throw new Error("Open comments are required to revise.");
  }

  const findings =
    workstream.researchRuns[0]?.findings ?? workstream.problemStatement;
  const version = current.versionNumber + 1;

  await prisma.plan.update({
    where: { id: current.id },
    data: { status: PlanStatus.superseded },
  });

  const result = await runPlanner({
    title: workstream.title,
    problem: workstream.problemStatement,
    findings,
    version,
    comments: current.comments.map((c) => ({
      body: c.body,
      anchorText: c.anchorText,
      authorName: c.author.name,
    })),
  });

  const plan = await prisma.plan.create({
    data: {
      workstreamId: workstream.id,
      versionNumber: version,
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

  await prisma.comment.updateMany({
    where: { planId: current.id, resolved: false },
    data: { resolved: true },
  });

  await prisma.workstream.update({
    where: { id: workstream.id },
    data: { stage: WorkstreamStage.in_review, lastActivityAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.actorUserId,
      action: AuditAction.model_call,
      workstreamId: workstream.id,
      planId: plan.id,
      tokenInput: result.tokenUsage,
      detail: `Planner revised plan to v${version} from comments`,
    },
  });

  return { ok: true };
}
