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

export const USER_ROLES = ["engineer", "architect", "lead", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Allowed stage edges for the Orbit loop. Role gates live in canTransition. */
const TRANSITIONS: Record<WorkstreamStage, WorkstreamStage[]> = {
  idea: ["research", "killed"],
  research: ["planning", "killed"],
  planning: ["in_review", "research", "killed"],
  in_review: ["planning", "approved", "killed"],
  approved: ["building", "in_review", "killed"],
  building: ["awaiting_input", "pr_open", "killed"],
  awaiting_input: ["building", "killed"],
  pr_open: ["merged", "building", "killed"],
  merged: [],
  killed: [],
};

function canActOnStage(role: UserRole): boolean {
  return role === "engineer" || role === "architect" || role === "lead";
}

function isApprover(role: UserRole): boolean {
  return role === "architect" || role === "lead";
}

/**
 * Single source of truth for stage moves. Viewers cannot transition.
 * Approvals require architect or lead. Everything else needs an acting role.
 */
export function canTransition(
  from: WorkstreamStage,
  to: WorkstreamStage,
  role: UserRole,
): boolean {
  if (!TRANSITIONS[from]?.includes(to)) return false;
  if (role === "viewer") return false;
  if (to === "approved" || (from === "approved" && to === "in_review")) {
    return isApprover(role);
  }
  if (to === "killed") return isApprover(role) || role === "engineer";
  return canActOnStage(role);
}

export type ActionCapabilityInput = {
  stage: WorkstreamStage;
  role: UserRole;
  owns: boolean;
  openCommentCount: number;
  hasPlan: boolean;
  planStatus?: string | null;
  hasResearchFindings?: boolean;
  hasArchitectApproval?: boolean;
};

export type ActionCapabilities = {
  canGeneratePlan: boolean;
  canRequestReview: boolean;
  canRevise: boolean;
  canApprove: boolean;
  canHandOff: boolean;
  openCommentCount: number;
  generateReason?: string;
  reviewReason?: string;
  reviseReason?: string;
  approveReason?: string;
  handOffReason?: string;
};

/** Shared enablement for the Next step panel and server actions. */
export function getActionCapabilities(
  input: ActionCapabilityInput,
): ActionCapabilities {
  const {
    stage,
    role,
    owns,
    openCommentCount,
    hasPlan,
    planStatus,
    hasResearchFindings = false,
    hasArchitectApproval = false,
  } = input;

  const canGeneratePlan = hasResearchFindings || stage === "research";

  const canRequestReview =
    hasPlan &&
    canActOnStage(role) &&
    (planStatus === "draft" || stage === "planning") &&
    (stage === "planning"
      ? canTransition("planning", "in_review", role)
      : true);

  const canRevise =
    hasPlan &&
    openCommentCount > 0 &&
    (stage === "in_review" || stage === "planning") &&
    canActOnStage(role);

  const canApprove =
    hasPlan &&
    stage === "in_review" &&
    openCommentCount === 0 &&
    canTransition("in_review", "approved", role);

  const planApproved =
    stage === "approved" ||
    planStatus === "approved" ||
    hasArchitectApproval;

  const canHandOff =
    owns &&
    planApproved &&
    stage === "approved" &&
    canTransition("approved", "building", role);

  return {
    canGeneratePlan,
    canRequestReview,
    canRevise,
    canApprove,
    canHandOff,
    openCommentCount,
    generateReason: canGeneratePlan
      ? undefined
      : "Finish a research run before generating a plan.",
    reviewReason: canRequestReview
      ? undefined
      : hasPlan
        ? "Plan must be a draft in planning."
        : "Create a draft plan first.",
    reviseReason: canRevise
      ? undefined
      : "Open comments are required to revise.",
    approveReason: isApprover(role)
      ? openCommentCount > 0
        ? "Resolve or address open comments before approval."
        : stage === "in_review"
          ? undefined
          : "Plan must be in review."
      : "Only architects and leads can approve plans.",
    handOffReason: !owns
      ? "You can only hand off workstreams you own."
      : planApproved
        ? stage === "approved"
          ? undefined
          : "Workstream must be in the approved stage."
        : "Needs an architect-approved plan.",
  };
}

export function nextStepCopy(caps: ActionCapabilities): {
  message: string;
  primary:
    | "revise"
    | "requestReview"
    | "approve"
    | "handOff"
    | null;
} {
  if (caps.canRevise) {
    return {
      message: `${caps.openCommentCount} comment${caps.openCommentCount === 1 ? "" : "s"} must be resolved before an architect can approve.`,
      primary: "revise",
    };
  }
  if (caps.canApprove) {
    return {
      message: "All comments resolved. An architect or lead can approve this plan.",
      primary: "approve",
    };
  }
  if (caps.canHandOff) {
    return {
      message: "Plan approved. Hand it off to start the build.",
      primary: "handOff",
    };
  }
  if (caps.canRequestReview) {
    return {
      message: "Draft plan ready. Request review when you want architects looking.",
      primary: "requestReview",
    };
  }
  return {
    message: "No action required from you on this plan right now.",
    primary: null,
  };
}
