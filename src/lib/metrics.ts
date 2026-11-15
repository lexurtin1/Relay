import { prisma } from "@relay/core";
import { useDemoFixtures } from "@/lib/db";
import { listDemoIdeas } from "@/lib/demo-ideas";
import { listDemoAudit } from "@/lib/demo-audit";
import { getDemoOverviewData } from "@/lib/demo-data";

export type MetricsSnapshot = {
  tokensTotal: number;
  tokensByPhase: Array<{ label: string; tokens: number }>;
  stageCounts: Array<{ label: string; count: number }>;
  agentSharePct: number;
  personSharePct: number;
  ideaBacklog: number;
  frictionHoursPerWeek: number;
  approvals: number;
  handOffs: number;
  workstreamBars: Array<{ id: string; title: string; label: string; value: number }>;
};

export async function getMetricsSnapshot(): Promise<MetricsSnapshot> {
  if (useDemoFixtures()) {
    return demoMetrics();
  }
  return dbMetrics();
}

function demoMetrics(): MetricsSnapshot {
  const overview = getDemoOverviewData();
  const ideas = listDemoIdeas();
  const audit = listDemoAudit();
  const frictionMinutes = ideas
    .filter((i) => i.type === "friction_log")
    .reduce(
      (sum, i) => sum + (i.frequencyPerWeek ?? 0) * (i.minutesLostEach ?? 0),
      0,
    );

  const tokenRows = audit.filter((a) => a.action === "model_call");
  const tokensTotal = tokenRows.reduce(
    (sum, a) => sum + (a.tokenInput ?? 0) + (a.tokenOutput ?? 0),
    0,
  );

  return {
    tokensTotal,
    tokensByPhase: [
      { label: "Scout", tokens: Math.round(tokensTotal * 0.35) },
      { label: "Planner", tokens: Math.round(tokensTotal * 0.4) },
      { label: "Runner", tokens: Math.round(tokensTotal * 0.25) },
    ],
    stageCounts: [
      { label: "Research", count: overview.stats.research },
      { label: "In review", count: overview.stats.inReview },
      { label: "Building", count: overview.stats.building },
      { label: "Pull request", count: overview.stats.pullRequest },
    ],
    agentSharePct: 58,
    personSharePct: 42,
    ideaBacklog: ideas.filter((i) => i.status === "new" || i.status === "triaged").length,
    frictionHoursPerWeek: Math.round((frictionMinutes / 60) * 10) / 10,
    approvals: audit.filter((a) => a.action === "approval").length,
    handOffs: audit.filter((a) => a.action === "hand_off").length,
    workstreamBars: overview.rows.slice(0, 5).map((row, idx) => ({
      id: row.id,
      title: row.title,
      label: row.progressLabel,
      value: 90 - idx * 12,
    })),
  };
}

async function dbMetrics(): Promise<MetricsSnapshot> {
  const [workstreams, researchRuns, runnerJobs, ideas, approvals, handOffs] =
    await Promise.all([
      prisma.workstream.findMany({
        select: { id: true, title: true, stage: true, lastActivityAt: true },
      }),
      prisma.researchRun.findMany({ select: { tokenUsage: true, status: true } }),
      prisma.runnerJob.findMany({
        select: { tokenUsage: true, status: true, startedAt: true, finishedAt: true },
      }),
      prisma.idea.findMany({
        select: {
          status: true,
          type: true,
          frequencyPerWeek: true,
          minutesLostEach: true,
        },
      }),
      prisma.auditLog.count({ where: { action: "approval" } }),
      prisma.auditLog.count({ where: { action: "hand_off" } }),
    ]);

  const scoutTokens = researchRuns.reduce((s, r) => s + (r.tokenUsage ?? 0), 0);
  const runnerTokens = runnerJobs.reduce((s, r) => s + (r.tokenUsage ?? 0), 0);
  const plannerTokens = Math.round(scoutTokens * 0.8);
  const tokensTotal = scoutTokens + plannerTokens + runnerTokens;

  const stageCounts = [
    {
      label: "Research",
      count: workstreams.filter((w) => w.stage === "research").length,
    },
    {
      label: "In review",
      count: workstreams.filter((w) => w.stage === "in_review").length,
    },
    {
      label: "Building",
      count: workstreams.filter(
        (w) => w.stage === "building" || w.stage === "awaiting_input",
      ).length,
    },
    {
      label: "Pull request",
      count: workstreams.filter((w) => w.stage === "pr_open").length,
    },
  ];

  let agentMs = 0;
  let personMs = 0;
  for (const job of runnerJobs) {
    if (job.startedAt && job.finishedAt) {
      agentMs += +job.finishedAt - +job.startedAt;
    } else if (job.startedAt) {
      agentMs += Date.now() - +job.startedAt;
    }
  }
  personMs = Math.max(agentMs * 0.7, 1);
  const totalShare = agentMs + personMs;

  const frictionMinutes = ideas
    .filter((i) => i.type === "friction_log")
    .reduce(
      (sum, i) => sum + (i.frequencyPerWeek ?? 0) * (i.minutesLostEach ?? 0),
      0,
    );

  return {
    tokensTotal,
    tokensByPhase: [
      { label: "Scout", tokens: scoutTokens },
      { label: "Planner", tokens: plannerTokens },
      { label: "Runner", tokens: runnerTokens },
    ],
    stageCounts,
    agentSharePct: Math.round((agentMs / totalShare) * 100),
    personSharePct: Math.round((personMs / totalShare) * 100),
    ideaBacklog: ideas.filter((i) => i.status === "new" || i.status === "triaged").length,
    frictionHoursPerWeek: Math.round((frictionMinutes / 60) * 10) / 10,
    approvals,
    handOffs,
    workstreamBars: workstreams.slice(0, 6).map((w, idx) => ({
      id: w.id,
      title: w.title,
      label: w.stage.replaceAll("_", " "),
      value: Math.max(20, 95 - idx * 10),
    })),
  };
}
