import type { WorkstreamStage } from "@relay/core/domain";
import type { ProgressTone } from "@/lib/derive";

/** View models shared by the demo store and the database pages. */

export type PersonRef = { id: string; name: string; role: string };

export type ResearchStepView = {
  id: string;
  title: string;
  rationale?: string;
  disclosureLabel?: string;
  disclosureDetail?: string;
};

export type SourceView = { connector: string; title: string; itemId?: string };

export type PlanStepView = {
  id: string;
  order: number;
  title: string;
  description: string;
  filesLikelyTouched: string[];
  testsToAdd: string[];
  riskLevel: "low" | "medium" | "high";
  completed: boolean;
  needsConfirmation: boolean;
};

export type CommentView = {
  id: string;
  stepId: string | null;
  anchorText: string | null;
  body: string;
  authorName: string;
  resolved: boolean;
  resolution: string | null;
  createdAt: string;
  replies: CommentView[];
};

export type PlanView = {
  id: string;
  version: number;
  totalVersions: number;
  status: "draft" | "in_review" | "approved" | "superseded";
  markdown: string;
  steps: PlanStepView[];
  comments: CommentView[];
  openComments: number;
  approvals: Array<{ name: string; at: string }>;
};

export type RunnerView = {
  status: "provisioning" | "running" | "awaiting_input" | "pr_open" | "merged";
  model: string;
  profile: string;
  branch: string;
  context: string;
  log: Array<{ at: string; text: string; kind: "info" | "tool" | "test" | "question" | "answer" | "pr" }>;
  question: { text: string; options: string[]; answer: string | null; answeredBy: string | null } | null;
  pr: { number: number; checks: "running" | "passed" } | null;
  stepsCompleted: number;
  stepsTotal: number;
};

export type ActionVerb =
  | "start_research"
  | "generate_plan"
  | "request_review"
  | "revise_plan"
  | "approve_plan"
  | "hand_off"
  | "answer_question"
  | "merge_pr";

export type ActionGate = {
  ok: boolean;
  reason?: string;
  switchTo?: PersonRef;
};

export type NextMove = {
  /** Who is responsible for the current step. */
  holder: { kind: "agent" | "person"; name: string; detail: string };
  headline: string;
  body: string;
  primary: ActionVerb | null;
};

export type HistoryItem = {
  id: string;
  label: string;
  at: string;
  actor: "person" | "agent";
};

export type WorkstreamDetailModel = {
  id: string;
  title: string;
  problemStatement: string;
  stage: WorkstreamStage;
  color: string;
  jiraKey: string | null;
  owner: PersonRef;
  origin: string;
  priority: string;
  progress: { label: string; tone: ProgressTone };
  research: {
    status: "idle" | "running" | "succeeded";
    ask: string;
    steps: ResearchStepView[];
    sources: SourceView[];
    findings: string | null;
    liveTools: string | null;
  };
  plan: PlanView | null;
  planDrafting: "generate" | "revise" | null;
  runner: RunnerView | null;
  history: HistoryItem[];
  gates: Record<ActionVerb, ActionGate> & { comment: ActionGate; resolve: ActionGate; ask: ActionGate };
  nextMove: NextMove;
  tokens: { input: number; output: number };
  /** False when the server has no writable store (database mode, read only actions). */
  interactive: boolean;
};
