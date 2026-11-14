import { prisma } from "@relay/core";
import {
  computeDashboardCounts,
  type WorkstreamCardModel,
  type WorkstreamStage,
} from "@relay/core";

export async function getDashboardData(ownerId?: string) {
  const workstreams = await prisma.workstream.findMany({
    where: ownerId ? { ownerId } : undefined,
    include: {
      owner: true,
      plans: {
        where: { status: { in: ["in_review", "draft"] } },
        include: {
          comments: { where: { resolved: false, parentId: null } },
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
    const openComments = ws.plans[0]?.comments.length ?? 0;
    const activeJob = ws.runnerJobs[0];
    const awaiting =
      ws.stage === "awaiting_input" ||
      activeJob?.status === "awaiting_input" ||
      (activeJob?.questions.length ?? 0) > 0;
    const needsYou = awaiting || openComments > 0;
    let needsYouReason: string | null = null;
    if (awaiting) needsYouReason = "Runner waiting on input";
    else if (openComments > 0) needsYouReason = `${openComments} open comment${openComments === 1 ? "" : "s"}`;

    const lastEvent =
      activeJob?.events[0] ??
      ws.researchRuns[0]?.events[0] ??
      null;

    let lastAgentActivity: string | null = null;
    if (lastEvent) {
      const payload = lastEvent.payload as { summary?: string; message?: string; tool?: string };
      lastAgentActivity =
        payload.summary ??
        payload.message ??
        (payload.tool ? `Tool: ${payload.tool}` : lastEvent.type);
    }

    return {
      id: ws.id,
      title: ws.title,
      stage: ws.stage as WorkstreamStage,
      priority: ws.priority,
      origin: ws.origin,
      jiraKey: ws.jiraKey,
      ownerName: ws.owner.name,
      lastActivityAt: ws.lastActivityAt.toISOString(),
      lastAgentActivity,
      needsYou,
      needsYouReason,
    };
  });

  return {
    cards,
    counts: computeDashboardCounts(cards),
  };
}
