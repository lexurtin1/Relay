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

/** Stages shown as full board columns when non-empty. */
export const ACTIVE_BOARD_STAGES: WorkstreamStage[] = [
  "research",
  "planning",
  "in_review",
  "building",
  "awaiting_input",
  "pr_open",
  "approved",
];

export const COMPLETED_BOARD_STAGES: WorkstreamStage[] = ["merged", "killed"];

export const DASHBOARD_STAGE_COLUMNS: WorkstreamStage[] = [
  ...ACTIVE_BOARD_STAGES,
  ...COMPLETED_BOARD_STAGES,
];

export const STEPPER_STAGES = [
  "research",
  "plan",
  "review",
  "build",
  "pr",
] as const;

export type StepperStage = (typeof STEPPER_STAGES)[number];

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
  color: string;
  ownerName: string;
  ownerInitials: string;
  lastActivityAt: string;
  lastAgentActivity: string | null;
  needsYou: boolean;
  needsYouReason: string | null;
  needsYouAction: string | null;
  openCommentCount: number;
  stepsCompleted: number;
  stepsTotal: number;
  agentActive: boolean;
  stageEnteredAt: string;
}

/** Stable palette for strategy workstreams. Linked ideas inherit these colours. */
export const WORKSTREAM_COLOURS = {
  context: "#2B6FD6",
  rail: "#0D9488",
  trust: "#D97706",
  collective: "#059669",
  standards: "#475569",
  neutral: "#94A3B8",
} as const;

export type WorkstreamColourKey = keyof typeof WORKSTREAM_COLOURS;

export const WORKSTREAM_COLOUR_LABELS: Record<
  Exclude<WorkstreamColourKey, "neutral">,
  string
> = {
  context: "Context layer MCP",
  rail: "Agent transaction rail",
  trust: "Trust and identity",
  collective: "Collective intelligence",
  standards: "Standards and industry",
};

export function resolveWorkstreamColour(
  color: string | null | undefined,
): string {
  if (!color) return WORKSTREAM_COLOURS.neutral;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  const key = trimmed.toLowerCase() as WorkstreamColourKey;
  return WORKSTREAM_COLOURS[key] ?? WORKSTREAM_COLOURS.neutral;
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

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function mapStageToStepper(stage: WorkstreamStage): StepperStage {
  switch (stage) {
    case "idea":
    case "research":
      return "research";
    case "planning":
      return "plan";
    case "in_review":
    case "approved":
      return "review";
    case "building":
    case "awaiting_input":
      return "build";
    case "pr_open":
    case "merged":
    case "killed":
      return "pr";
    default:
      return "research";
  }
}

export function stepperIndex(stage: WorkstreamStage): number {
  return STEPPER_STAGES.indexOf(mapStageToStepper(stage));
}
