export const WORKSTREAM_STAGES = [
  "idea",
  "research",
  "planning",
  "in_review",
  "approved",
  "building",
  "awaiting_input",
  "pr_open",
  "merged",
  "killed",
] as const;

export type WorkstreamStage = (typeof WORKSTREAM_STAGES)[number];

export const DASHBOARD_STAGE_COLUMNS: WorkstreamStage[] = [
  "research",
  "planning",
  "in_review",
  "building",
  "awaiting_input",
  "pr_open",
  "approved",
  "merged",
];

export interface DashboardCounts {
  inResearch: number;
  inReview: number;
  building: number;
  awaitingInput: number;
  prsOpen: number;
}

export interface WorkstreamCardModel {
  id: string;
  title: string;
  stage: WorkstreamStage;
  priority: string;
  origin: string;
  jiraKey: string | null;
  ownerName: string;
  lastActivityAt: string;
  lastAgentActivity: string | null;
  needsYou: boolean;
  needsYouReason: string | null;
}

export function computeDashboardCounts(
  workstreams: Array<{ stage: WorkstreamStage }>,
): DashboardCounts {
  return {
    inResearch: workstreams.filter((w) => w.stage === "research").length,
    inReview: workstreams.filter((w) => w.stage === "in_review").length,
    building: workstreams.filter((w) => w.stage === "building").length,
    awaitingInput: workstreams.filter((w) => w.stage === "awaiting_input").length,
    prsOpen: workstreams.filter((w) => w.stage === "pr_open").length,
  };
}

export function stageLabel(stage: WorkstreamStage): string {
  return stage.replaceAll("_", " ");
}
