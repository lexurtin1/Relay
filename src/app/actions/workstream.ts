"use server";

import { revalidatePath } from "next/cache";
import {
  AuditAction,
  PlanStatus,
  WorkstreamStage,
} from "@prisma/client";
import {
  canTransition,
  getActionCapabilities,
  type UserRole,
} from "@relay/core";
import { prisma } from "@relay/core";
import { useDemoFixtures } from "@/lib/db";
import {
  demoAnswerQuestion,
  demoSetWorkstreamStage,
  getDemoWorkstreamDetail,
} from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function writeAudit(input: {
  action: AuditAction;
  userId: string;
  workstreamId: string;
  planId?: string;
  detail: string;
}) {
  if (useDemoFixtures()) return;
  await prisma.auditLog.create({
    data: {
      action: input.action,
      userId: input.userId,
      workstreamId: input.workstreamId,
      planId: input.planId,
      detail: input.detail,
    },
  });
}

function revalidateWorkstream(workstreamId: string) {
  revalidatePath("/");
  revalidatePath("/workstreams");
  revalidatePath(`/workstreams/${workstreamId}`);
}

export async function revisePlan(workstreamId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const role = user.role as UserRole;

  if (useDemoFixtures()) {
    const demo = getDemoWorkstreamDetail(workstreamId);
    if (!demo) return { ok: false, error: "Workstream not found." };
    const caps = getActionCapabilities({
      stage: demo.stage as WorkstreamStage,
      role,
      owns: demo.ownerId === user.id,
      openCommentCount: demo.plan.comments.filter((c) => !c.resolved).length,
      hasPlan: true,
      planStatus: demo.plan.status,
    });
    if (!caps.canRevise) {
      return { ok: false, error: caps.reviseReason ?? "Cannot revise." };
    }
    // Prototype: treat revise as addressing comments into a new draft.
    const result = demoSetWorkstreamStage(
      workstreamId,
      "planning" as WorkstreamStage,
      user.id,
      "model_call",
      "Revise plan queued (prototype no-op).",
      { resolveComments: true },
    );
    revalidateWorkstream(workstreamId);
    return result;
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: {
        include: { comments: { where: { resolved: false, parentId: null } } },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
  if (!workstream) return { ok: false, error: "Workstream not found." };
  const plan = workstream.plans[0];
  const caps = getActionCapabilities({
    stage: workstream.stage,
    role,
    owns: workstream.ownerId === user.id,
    openCommentCount: plan?.comments.length ?? 0,
    hasPlan: Boolean(plan),
    planStatus: plan?.status,
  });
  if (!caps.canRevise) {
    return { ok: false, error: caps.reviseReason ?? "Cannot revise." };
  }
  if (!canTransition(workstream.stage, "planning", role)) {
    return { ok: false, error: "Illegal stage transition." };
  }

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: {
      stage: WorkstreamStage.planning,
      lastActivityAt: new Date(),
    },
  });
  if (plan) {
    await prisma.plan.update({
      where: { id: plan.id },
      data: { status: PlanStatus.draft },
    });
  }
  await writeAudit({
    action: AuditAction.model_call,
    userId: user.id,
    workstreamId,
    planId: plan?.id,
    detail: "Revise plan requested (planner job not wired yet).",
  });
  revalidateWorkstream(workstreamId);
  return { ok: true };
}

export async function requestReview(workstreamId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const role = user.role as UserRole;

  if (useDemoFixtures()) {
    const demo = getDemoWorkstreamDetail(workstreamId);
    if (!demo) return { ok: false, error: "Workstream not found." };
    const caps = getActionCapabilities({
      stage: demo.stage as WorkstreamStage,
      role,
      owns: demo.ownerId === user.id,
      openCommentCount: demo.plan.comments.filter((c) => !c.resolved).length,
      hasPlan: true,
      planStatus: demo.plan.status,
    });
    if (!caps.canRequestReview) {
      return { ok: false, error: caps.reviewReason ?? "Cannot request review." };
    }
    const result = demoSetWorkstreamStage(
      workstreamId,
      "in_review" as WorkstreamStage,
      user.id,
      "model_call",
      "Requested plan review.",
    );
    revalidateWorkstream(workstreamId);
    return result;
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!workstream) return { ok: false, error: "Workstream not found." };
  const plan = workstream.plans[0];
  const caps = getActionCapabilities({
    stage: workstream.stage,
    role,
    owns: workstream.ownerId === user.id,
    openCommentCount: 0,
    hasPlan: Boolean(plan),
    planStatus: plan?.status,
  });
  if (!caps.canRequestReview) {
    return { ok: false, error: caps.reviewReason ?? "Cannot request review." };
  }
  if (!canTransition(workstream.stage, "in_review", role)) {
    return { ok: false, error: "Illegal stage transition." };
  }

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: {
      stage: WorkstreamStage.in_review,
      lastActivityAt: new Date(),
    },
  });
  if (plan) {
    await prisma.plan.update({
      where: { id: plan.id },
      data: { status: PlanStatus.in_review },
    });
  }
  await writeAudit({
    action: AuditAction.model_call,
    userId: user.id,
    workstreamId,
    planId: plan?.id,
    detail: "Requested plan review.",
  });
  revalidateWorkstream(workstreamId);
  return { ok: true };
}

export async function approvePlan(workstreamId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const role = user.role as UserRole;

  if (useDemoFixtures()) {
    const demo = getDemoWorkstreamDetail(workstreamId);
    if (!demo) return { ok: false, error: "Workstream not found." };
    const caps = getActionCapabilities({
      stage: demo.stage as WorkstreamStage,
      role,
      owns: demo.ownerId === user.id,
      openCommentCount: demo.plan.comments.filter((c) => !c.resolved).length,
      hasPlan: true,
      planStatus: demo.plan.status,
    });
    if (!caps.canApprove) {
      return { ok: false, error: caps.approveReason ?? "Cannot approve." };
    }
    const result = demoSetWorkstreamStage(
      workstreamId,
      "approved" as WorkstreamStage,
      user.id,
      "approval",
      "Plan approved.",
    );
    revalidateWorkstream(workstreamId);
    return result;
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: {
        include: {
          comments: { where: { resolved: false, parentId: null } },
          approvals: true,
        },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
  if (!workstream) return { ok: false, error: "Workstream not found." };
  const plan = workstream.plans[0];
  const caps = getActionCapabilities({
    stage: workstream.stage,
    role,
    owns: workstream.ownerId === user.id,
    openCommentCount: plan?.comments.length ?? 0,
    hasPlan: Boolean(plan),
    planStatus: plan?.status,
    hasArchitectApproval: (plan?.approvals.length ?? 0) > 0,
  });
  if (!caps.canApprove) {
    return { ok: false, error: caps.approveReason ?? "Cannot approve." };
  }
  if (!canTransition(workstream.stage, "approved", role)) {
    return { ok: false, error: "Illegal stage transition." };
  }
  if (!plan) return { ok: false, error: "No plan to approve." };

  await prisma.$transaction([
    prisma.approval.upsert({
      where: {
        planId_approverId: { planId: plan.id, approverId: user.id },
      },
      create: { planId: plan.id, approverId: user.id },
      update: {},
    }),
    prisma.plan.update({
      where: { id: plan.id },
      data: { status: PlanStatus.approved },
    }),
    prisma.workstream.update({
      where: { id: workstreamId },
      data: {
        stage: WorkstreamStage.approved,
        lastActivityAt: new Date(),
      },
    }),
  ]);
  await writeAudit({
    action: AuditAction.approval,
    userId: user.id,
    workstreamId,
    planId: plan.id,
    detail: "Plan approved.",
  });
  revalidateWorkstream(workstreamId);
  return { ok: true };
}

export async function handOff(workstreamId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const role = user.role as UserRole;

  if (useDemoFixtures()) {
    const demo = getDemoWorkstreamDetail(workstreamId);
    if (!demo) return { ok: false, error: "Workstream not found." };
    const caps = getActionCapabilities({
      stage: demo.stage as WorkstreamStage,
      role,
      owns: demo.ownerId === user.id,
      openCommentCount: demo.plan.comments.filter((c) => !c.resolved).length,
      hasPlan: true,
      planStatus: demo.plan.status,
    });
    if (!caps.canHandOff) {
      return { ok: false, error: caps.handOffReason ?? "Cannot hand off." };
    }
    const result = demoSetWorkstreamStage(
      workstreamId,
      "building" as WorkstreamStage,
      user.id,
      "hand_off",
      "Handed off to Runner (prototype no-op).",
    );
    revalidateWorkstream(workstreamId);
    return result;
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: {
        include: { approvals: true },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
  if (!workstream) return { ok: false, error: "Workstream not found." };
  const plan = workstream.plans[0];
  const caps = getActionCapabilities({
    stage: workstream.stage,
    role,
    owns: workstream.ownerId === user.id,
    openCommentCount: 0,
    hasPlan: Boolean(plan),
    planStatus: plan?.status,
    hasArchitectApproval: (plan?.approvals.length ?? 0) > 0,
  });
  if (!caps.canHandOff) {
    return { ok: false, error: caps.handOffReason ?? "Cannot hand off." };
  }
  if (!canTransition(workstream.stage, "building", role)) {
    return { ok: false, error: "Illegal stage transition." };
  }

  await prisma.workstream.update({
    where: { id: workstreamId },
    data: {
      stage: WorkstreamStage.building,
      lastActivityAt: new Date(),
    },
  });
  await writeAudit({
    action: AuditAction.hand_off,
    userId: user.id,
    workstreamId,
    planId: plan?.id,
    detail: "Handed off to Runner (job queue not wired yet).",
  });
  revalidateWorkstream(workstreamId);
  return { ok: true };
}

/**
 * Answer a Needs-you question. `questionRef` is either a real Question id
 * or a demo needs-card id like `demo-ws-nav-q`.
 */
export async function answerQuestion(
  questionRef: string,
  option: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const answer = option.trim();
  if (!answer) return { ok: false, error: "Answer required." };

  if (useDemoFixtures()) {
    const result = demoAnswerQuestion(questionRef, answer, user.id);
    const wsId = questionRef.replace(/-q$/, "");
    revalidateWorkstream(wsId);
    return result;
  }

  const question = await prisma.question.findFirst({
    where: {
      OR: [{ id: questionRef }, { runnerJob: { workstreamId: questionRef.replace(/-q$/, "") } }],
      answer: null,
    },
    include: { runnerJob: true },
    orderBy: { createdAt: "desc" },
  });
  if (!question) return { ok: false, error: "Question not found." };

  const workstreamId = question.runnerJob.workstreamId;
  await prisma.$transaction([
    prisma.question.update({
      where: { id: question.id },
      data: {
        answer,
        answeredById: user.id,
        answeredAt: new Date(),
      },
    }),
    prisma.workstream.update({
      where: { id: workstreamId },
      data: {
        stage: WorkstreamStage.building,
        lastActivityAt: new Date(),
      },
    }),
  ]);
  await writeAudit({
    action: AuditAction.hand_off,
    userId: user.id,
    workstreamId,
    detail: `Answered question: ${answer}`,
  });
  revalidateWorkstream(workstreamId);
  return { ok: true };
}
