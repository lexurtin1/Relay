import {
  appendDemoEvent,
  getDemoAgentState,
  patchDemoAgentState,
} from "@/lib/demo-agent-store";
import { getDemoReviewState, patchDemoReviewState } from "@/lib/demo-review-store";

export type DemoRunnerState = {
  jobId: string;
  status:
    | "queued"
    | "provisioning"
    | "running"
    | "awaiting_input"
    | "succeeded"
    | "failed";
  workspacePath?: string | null;
  branch?: string | null;
  prUrl?: string | null;
  openQuestion?: string | null;
  questionOptions?: string[];
  questionId?: string | null;
  paused?: boolean;
};

const globalStore = globalThis as typeof globalThis & {
  __relayDemoRunnerStore?: Map<string, DemoRunnerState>;
};

function store(): Map<string, DemoRunnerState> {
  if (!globalStore.__relayDemoRunnerStore) {
    globalStore.__relayDemoRunnerStore = new Map();
  }
  return globalStore.__relayDemoRunnerStore;
}

export function getDemoRunnerState(workstreamId: string): DemoRunnerState | null {
  return store().get(workstreamId) ?? null;
}

export function patchDemoRunnerState(
  workstreamId: string,
  patch: Partial<DemoRunnerState> & { jobId?: string },
): DemoRunnerState {
  const prev = getDemoRunnerState(workstreamId);
  const jobId = patch.jobId ?? prev?.jobId ?? `runner_${Date.now()}`;
  const next: DemoRunnerState = {
    jobId,
    status: patch.status ?? prev?.status ?? "queued",
    workspacePath: patch.workspacePath ?? prev?.workspacePath ?? null,
    branch: patch.branch ?? prev?.branch ?? null,
    prUrl: patch.prUrl ?? prev?.prUrl ?? null,
    openQuestion:
      patch.openQuestion === undefined ? prev?.openQuestion ?? null : patch.openQuestion,
    questionOptions: patch.questionOptions ?? prev?.questionOptions ?? [],
    questionId:
      patch.questionId === undefined ? prev?.questionId ?? null : patch.questionId,
    paused: patch.paused ?? prev?.paused ?? false,
  };
  store().set(workstreamId, next);
  return next;
}

export function seedDemoRunnerFromHandOff(workstreamId: string, jobId: string): void {
  patchDemoRunnerState(workstreamId, {
    jobId,
    status: "queued",
    workspacePath: "demo-repos/ops-tools",
    branch: `relay/${workstreamId.slice(0, 8)}`,
    openQuestion: null,
    questionOptions: [],
    paused: false,
  });
  patchDemoReviewState(workstreamId, { handedOff: true, runnerJobId: jobId });
  patchDemoAgentState(workstreamId, { stage: "building" });
  appendDemoEvent(workstreamId, {
    type: "status",
    summary: "Runner job queued",
  });
}

export function applyDemoRunnerPause(
  workstreamId: string,
  input: { questionText: string; options: string[] },
): void {
  const questionId = `q_${Date.now()}`;
  patchDemoRunnerState(workstreamId, {
    status: "awaiting_input",
    openQuestion: input.questionText,
    questionOptions: input.options,
    questionId,
    paused: true,
  });
  patchDemoAgentState(workstreamId, {
    stage: "awaiting_input",
    history: [
      {
        id: `h_q_${Date.now()}`,
        label: "Runner waiting on you",
        at: new Date().toISOString(),
      },
      ...(getDemoAgentState(workstreamId).history ?? []),
    ],
  });
}

export function clearDemoRunnerQuestion(workstreamId: string): void {
  patchDemoRunnerState(workstreamId, {
    openQuestion: null,
    questionOptions: [],
    questionId: null,
    paused: false,
    status: "running",
  });
  patchDemoAgentState(workstreamId, { stage: "building" });
}

export function finishDemoRunner(
  workstreamId: string,
  input: { prUrl: string },
): void {
  patchDemoRunnerState(workstreamId, {
    status: "succeeded",
    prUrl: input.prUrl,
    openQuestion: null,
    paused: false,
  });
  const now = new Date().toISOString();
  patchDemoAgentState(workstreamId, {
    stage: "pr_open",
    history: [
      { id: `h_pr_${Date.now()}`, label: "Draft PR opened", at: now },
      ...(getDemoAgentState(workstreamId).history ?? []),
    ],
  });
  appendDemoEvent(workstreamId, {
    type: "status",
    summary: `PR ready: ${input.prUrl}`,
  });
}

export function demoRunnerOpenQuestion(workstreamId: string): string | null {
  return (
    getDemoRunnerState(workstreamId)?.openQuestion ??
    (getDemoReviewState(workstreamId).handedOff ? null : null)
  );
}
