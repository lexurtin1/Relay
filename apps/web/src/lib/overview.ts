import { prisma } from "@relay/core";
import {
  initialsFromName,
  mapStageToStepper,
  stepperIndex,
  type StepperStage,
  type WorkstreamStage,
} from "@relay/core";

export type OverviewStats = {
  allActive: number;
  research: number;
  inReview: number;
  building: number;
  pullRequest: number;
  mergedThisWeek: number;
};

export type NeedsActionItem = {
  id: string;
  jiraKey: string | null;
  title: string;
  kind: "question" | "comments";
  summary: string;
  detail: string | null;
  options: string[];
  actionLabel: string;
  createdAt: string;
};

export type AgentRunningItem = {
  id: string;
  workstreamId: string;
  kind: "Runner" | "Scout";
  jiraKey: string | null;
  title: string;
  statusLine: string;
  stepsCompleted: number;
  stepsTotal: number;
  startedAt: string;
};

export type WorkstreamRowRow = {
  id: string;
  title: string;
  jiraKey: string | null;
  ownerName: string;
  ownerInitials: string;
  stage: WorkstreamStage;
  stepperIndex: number;
  progressLabel: string;
  progressTone: "active" | "waiting" | "done" | "neutral";
  updatedAt: string;
};

function weekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

export async function getOverviewData() {
  const workstreams = await prisma.workstream.findMany({
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

  const activeStages: WorkstreamStage[] = [
    "idea",
    "research",
    "planning",
    "in_review",
    "approved",
    "building",
    "awaiting_input",
    "pr_open",
  ];

  const stats: OverviewStats = {
    allActive: workstreams.filter((w) => activeStages.includes(w.stage)).length,
    research: workstreams.filter((w) => w.stage === "research").length,
    inReview: workstreams.filter((w) => w.stage === "in_review").length,
    building: workstreams.filter(
      (w) => w.stage === "building" || w.stage === "awaiting_input",
    ).length,
    pullRequest: workstreams.filter((w) => w.stage === "pr_open").length,
    mergedThisWeek: workstreams.filter(
      (w) => w.stage === "merged" && w.updatedAt >= weekAgo(),
    ).length,
  };

  const needsAction: NeedsActionItem[] = [];
  const agentsRunning: AgentRunningItem[] = [];
  const rows: WorkstreamRowRow[] = [];

  for (const ws of workstreams) {
    const plan = ws.plans[0];
    const job = ws.runnerJobs[0];
    const research = ws.researchRuns[0];
    const openComments = plan?.comments.length ?? 0;
    const stepsTotal = plan?.steps.length ?? 0;
    const stepsCompleted = plan?.steps.filter((s) => s.completed).length ?? 0;
    const question = job?.questions[0];

    if (question) {
      needsAction.push({
        id: `${ws.id}-q`,
        jiraKey: ws.jiraKey,
        title: ws.title,
        kind: "question",
        summary: `Runner paused at step ${Math.min(stepsCompleted + 1, Math.max(stepsTotal, 1))} of ${Math.max(stepsTotal, 1)}`,
        detail: question.questionText,
        options: question.options,
        actionLabel: "Write an answer",
        createdAt: question.createdAt.toISOString(),
      });
    } else if (openComments > 0 && ws.stage === "in_review") {
      needsAction.push({
        id: `${ws.id}-c`,
        jiraKey: ws.jiraKey,
        title: ws.title,
        kind: "comments",
        summary: `Plan v${plan?.versionNumber ?? 1} · ${openComments} open comments, architect approval needed`,
        detail: null,
        options: [],
        actionLabel: "Review plan",
        createdAt: ws.lastActivityAt.toISOString(),
      });
    }

    if (job && ["running", "provisioning", "awaiting_input"].includes(job.status)) {
      agentsRunning.push({
        id: job.id,
        workstreamId: ws.id,
        kind: "Runner",
        jiraKey: ws.jiraKey,
        title: ws.title,
        statusLine:
          job.status === "awaiting_input"
            ? "Paused for human input"
            : `Step ${stepsCompleted} of ${Math.max(stepsTotal, 1)}`,
        stepsCompleted,
        stepsTotal: Math.max(stepsTotal, 1),
        startedAt: (job.startedAt ?? job.createdAt).toISOString(),
      });
    }

    if (research && research.status === "running") {
      const sources = Array.isArray(research.sourcesConsulted)
        ? (research.sourcesConsulted as Array<{ connector?: string }>)
        : [];
      const connectors = [
        ...new Set(sources.map((s) => s.connector).filter(Boolean)),
      ];
      agentsRunning.push({
        id: research.id,
        workstreamId: ws.id,
        kind: "Scout",
        jiraKey: ws.jiraKey,
        title: ws.title,
        statusLine:
          connectors.length > 0
            ? `${sources.length} sources read: ${connectors.join(", ")}`
            : "Researching sources",
        stepsCompleted: 0,
        stepsTotal: 0,
        startedAt: (research.startedAt ?? research.createdAt).toISOString(),
      });
    }

    let progressLabel = "Queued";
    let progressTone: WorkstreamRowRow["progressTone"] = "neutral";
    if (ws.stage === "awaiting_input" || question) {
      progressLabel = "Paused, waiting on you";
      progressTone = "waiting";
    } else if (job?.status === "running") {
      progressLabel = `Runner, step ${stepsCompleted} of ${Math.max(stepsTotal, 1)}`;
      progressTone = "active";
    } else if (research?.status === "running") {
      progressLabel = "Scout researching";
      progressTone = "active";
    } else if (ws.stage === "in_review") {
      progressLabel = `Plan v${plan?.versionNumber ?? 1}${openComments ? `, ${openComments} comments` : ""}`;
      progressTone = "waiting";
    } else if (ws.stage === "pr_open") {
      progressLabel = job?.prUrl ? "PR open, checks running" : "PR open";
      progressTone = "done";
    } else if (ws.stage === "merged") {
      progressLabel = "Merged";
      progressTone = "done";
    } else if (research?.findings) {
      progressLabel = "Findings ready";
      progressTone = "neutral";
    } else if (ws.stage === "research") {
      progressLabel = "In research";
      progressTone = "active";
    }

    rows.push({
      id: ws.id,
      title: ws.title,
      jiraKey: ws.jiraKey,
      ownerName: ws.owner.name,
      ownerInitials: initialsFromName(ws.owner.name),
      stage: ws.stage,
      stepperIndex: stepperIndex(ws.stage),
      progressLabel,
      progressTone,
      updatedAt: ws.lastActivityAt.toISOString(),
    });
  }

  const agentsActive = agentsRunning.length;

  return {
    stats,
    needsAction,
    agentsRunning,
    rows,
    agentsActive,
    workstreamCount: workstreams.length,
    commandItems: workstreams.map((w) => ({
      id: w.id,
      title: w.title,
      jiraKey: w.jiraKey,
      stage: w.stage as WorkstreamStage,
    })),
  };
}

export const PIPELINE_LABELS: Array<{ key: StepperStage; label: string }> = [
  { key: "research", label: "Research" },
  { key: "plan", label: "Plan" },
  { key: "review", label: "Review" },
  { key: "build", label: "Build" },
  { key: "pr", label: "Pull request" },
];

export function stageToPipelineIndex(stage: WorkstreamStage): number {
  return stepperIndex(stage);
}

export { mapStageToStepper };
