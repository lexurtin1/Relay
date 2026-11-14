import { prisma } from "@relay/core";
import {
  computeDashboardCounts,
  initialsFromName,
  type WorkstreamCardModel,
  type WorkstreamStage,
} from "@relay/core";
import { withDatabase } from "@/lib/db";
import { getDemoOverviewData } from "@/lib/demo-data";

function formatNeedsYouReason(opts: {
  awaiting: boolean;
  openComments: number;
  questionAskedAt: Date | null;
}): { reason: string; action: string } | null {
  if (opts.awaiting) {
    const ago = opts.questionAskedAt
      ? ` ${formatShortAgo(opts.questionAskedAt)}`
      : "";
    return {
      reason: `Runner asked a question${ago}`,
      action: "Answer",
    };
  }
  if (opts.openComments > 0) {
    return {
      reason: `${opts.openComments} open comment${opts.openComments === 1 ? "" : "s"} on plan`,
      action: "Review comments",
    };
  }
  return null;
}

function formatShortAgo(date: Date): string {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export async function getDashboardData(ownerId?: string) {
  const workstreams = await prisma.workstream.findMany({
    where: ownerId ? { ownerId } : undefined,
    include: {
      owner: true,
      plans: {
        include: {
          comments: { where: { resolved: false, parentId: null } },
          steps: true,
        },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      runnerJobs: {
        include: {
          questions: { where: { answer: null }, take: 1 },
          events: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      researchRuns: {
        include: { events: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const cards: WorkstreamCardModel[] = workstreams.map((ws) => {
    const plan = ws.plans[0];
    const openComments = plan?.comments.length ?? 0;
    const stepsTotal = plan?.steps.length ?? 0;
    const stepsCompleted = plan?.steps.filter((s) => s.completed).length ?? 0;
    const activeJob = ws.runnerJobs[0];
    const question = activeJob?.questions[0];
    const awaiting =
      ws.stage === "awaiting_input" ||
      activeJob?.status === "awaiting_input" ||
      Boolean(question);

    const needs = formatNeedsYouReason({
      awaiting,
      openComments,
      questionAskedAt: question?.createdAt ?? null,
    });

    const agentActive =
      activeJob?.status === "running" ||
      activeJob?.status === "provisioning" ||
      ws.researchRuns[0]?.status === "running";

    const lastEvent =
      activeJob?.events[0] ?? ws.researchRuns[0]?.events[0] ?? null;

    let lastAgentActivity: string | null = null;
    if (lastEvent) {
      const payload = lastEvent.payload as {
        summary?: string;
        message?: string;
        tool?: string;
      };
      lastAgentActivity =
        payload.summary ??
        payload.message ??
        (payload.tool ? `Tool: ${payload.tool}` : lastEvent.type);
    }

    const planForNeeds =
      plan && (plan.status === "in_review" || plan.status === "draft")
        ? plan
        : openComments > 0
          ? plan
          : null;

    const needsYou =
      awaiting ||
      (openComments > 0 &&
        (ws.stage === "in_review" || planForNeeds?.status === "in_review"));

    return {
      id: ws.id,
      title: ws.title,
      stage: ws.stage as WorkstreamStage,
      priority: ws.priority,
      origin: ws.origin,
      jiraKey: ws.jiraKey,
      ownerName: ws.owner.name,
      ownerInitials: initialsFromName(ws.owner.name),
      lastActivityAt: ws.lastActivityAt.toISOString(),
      lastAgentActivity,
      needsYou: Boolean(needsYou && needs),
      needsYouReason: needsYou && needs ? needs.reason : null,
      needsYouAction: needsYou && needs ? needs.action : null,
      openCommentCount: openComments,
      stepsCompleted,
      stepsTotal,
      agentActive,
      stageEnteredAt: ws.updatedAt.toISOString(),
    };
  });

  return {
    cards,
    counts: computeDashboardCounts(cards),
    needsYou: cards.filter((c) => c.needsYou),
    commandItems: cards.map((c) => ({
      id: c.id,
      title: c.title,
      jiraKey: c.jiraKey,
      stage: c.stage,
    })),
  };
}

export async function listWorkstreamCommandItems() {
  return withDatabase(
    () =>
      prisma.workstream.findMany({
        select: { id: true, title: true, jiraKey: true, stage: true },
        orderBy: { lastActivityAt: "desc" },
      }),
    () => getDemoOverviewData().commandItems,
  );
}
