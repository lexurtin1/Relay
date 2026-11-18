import type { WorkstreamStage } from "@relay/core/domain";
import type { PlannedStep } from "@relay/core/agents/planner-template";

export type Role = "engineer" | "architect" | "lead" | "viewer";

export type DemoUser = {
  id: string;
  name: string;
  role: Role;
  team: string;
};

export type SourceRef = {
  connector: string;
  title: string;
  itemId?: string;
};

export type ResearchStep = {
  id: string;
  title: string;
  rationale?: string;
  disclosureLabel?: string;
  disclosureDetail?: string;
};

/**
 * Agent clock. Elapsed script time is (now or pausedAt) - startedAt - pausedMs,
 * multiplied by the store speed. Only timestamps are stored, so a reload
 * replays to the same point.
 */
export type SimClock = {
  startedAt: number;
  pausedMs: number;
  pausedAt: number | null;
  /** Number of script events already applied. */
  applied: number;
};

export type Research = {
  status: "idle" | "running" | "succeeded";
  ask: string;
  steps: ResearchStep[];
  sources: SourceRef[];
  findings: string | null;
  liveTools: string | null;
  script: "scout" | "followup" | null;
  followup: string | null;
  sim: SimClock | null;
};

export type PlanStep = PlannedStep & {
  id: string;
  completed: boolean;
};

export type PlanComment = {
  id: string;
  parentId: string | null;
  stepId: string | null;
  anchorText: string | null;
  body: string;
  authorId: string;
  resolved: boolean;
  resolvedById: string | null;
  resolution: string | null;
  createdAt: number;
};

export type PlanStatus = "draft" | "in_review" | "approved" | "superseded";

export type PlanVersion = {
  id: string;
  version: number;
  status: PlanStatus;
  markdown: string;
  steps: PlanStep[];
  comments: PlanComment[];
  approvals: Array<{ userId: string; at: number }>;
  createdAt: number;
  modelId: string | null;
};

/** A plan the Planner is still drafting; revealed when its clock completes. */
export type PendingPlan = {
  kind: "generate" | "revise";
  startedAt: number;
  draft: { markdown: string; steps: PlannedStep[] };
  modelId: string;
  usage: { inputTokens: number; outputTokens: number };
};

export type RunnerLogLine = {
  at: number;
  text: string;
  kind: "info" | "tool" | "test" | "question" | "answer" | "pr";
};

export type RunnerQuestion = {
  text: string;
  options: string[];
  askedAt: number;
  answer: string | null;
  answeredById: string | null;
  answeredAt: number | null;
};

export type RunnerStatus =
  | "provisioning"
  | "running"
  | "awaiting_input"
  | "pr_open"
  | "merged";

export type Runner = {
  id: string;
  status: RunnerStatus;
  model: string;
  profile: string;
  context: string;
  branch: string;
  startedAt: number;
  log: RunnerLogLine[];
  question: RunnerQuestion | null;
  questionOverride: { text: string; options: string[] } | null;
  pr: { number: number; checks: "running" | "passed"; openedAt: number } | null;
  sim: SimClock | null;
};

export type StageEvent = {
  stage: WorkstreamStage;
  at: number;
  actor: "person" | "agent";
};

export type Workstream = {
  id: string;
  title: string;
  problemStatement: string;
  stage: WorkstreamStage;
  ownerId: string;
  color: string;
  jiraKey: string | null;
  origin: "internal_friction" | "external_opportunity" | "roadmap";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: number;
  lastActivityAt: number;
  stageHistory: StageEvent[];
  research: Research;
  plans: PlanVersion[];
  pendingPlan: PendingPlan | null;
  runner: Runner | null;
  tokens: { input: number; output: number };
};

export type IdeaStatus = "new" | "triaged" | "promoted" | "parked";
export type IdeaType = "friction_log" | "external_signal";

export type Idea = {
  id: string;
  title: string;
  description: string;
  type: IdeaType;
  status: IdeaStatus;
  frequencyPerWeek: number | null;
  minutesLostEach: number | null;
  submittedById: string;
  workstreamId: string | null;
  createdAt: number;
};

export type AuditAction =
  | "model_call"
  | "approval"
  | "hand_off"
  | "connector_access"
  | "role_switch"
  | "seed"
  | "comment"
  | "resolve"
  | "revise"
  | "request_review"
  | "stage_change"
  | "question_answered"
  | "merge"
  | "workstream_created"
  | "idea_created"
  | "idea_status"
  | "idea_promoted"
  | "reset";

export type AuditEntry = {
  id: string;
  at: number;
  action: AuditAction;
  userId: string | null;
  /** Set when an agent, not a person, acted. */
  agent: "Scout" | "Planner" | "Runner" | null;
  workstreamId: string | null;
  modelId: string | null;
  tokenInput: number | null;
  tokenOutput: number | null;
  detail: string;
};

export type TourState = { active: boolean; step: number; wsId?: string | null };

export type DemoState = {
  schemaVersion: number;
  seededAt: number;
  /** Script speed multiplier. 1 is presenter pace. */
  speed: number;
  currentUserId: string;
  users: DemoUser[];
  workstreams: Record<string, Workstream>;
  order: string[];
  ideas: Idea[];
  audit: AuditEntry[];
  ui: {
    heroCollapsed: Record<string, boolean>;
    tour: TourState | null;
    tourPromptDismissed: boolean;
  };
};

export const DEMO_SCHEMA_VERSION = 1;
export const AUDIT_CAP = 1000;
export const LOG_CAP = 200;
