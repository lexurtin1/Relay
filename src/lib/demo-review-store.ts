import type { PlanStepDraft } from "@relay/agents";
import { getDemoAgentState, patchDemoAgentState } from "@/lib/demo-agent-store";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";

export type DemoComment = {
  id: string;
  planId: string;
  stepId: string | null;
  parentId: string | null;
  anchorText: string | null;
  body: string;
  authorId: string;
  authorName: string;
  resolved: boolean;
  createdAt: string;
};

export type DemoApproval = {
  id: string;
  planId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  createdAt: string;
};

export type DemoReviewState = {
  comments?: DemoComment[];
  approvals?: DemoApproval[];
  planLifecycle?: "draft" | "in_review" | "approved" | "superseded";
  handedOff?: boolean;
  runnerJobId?: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __relayDemoReviewStore?: Map<string, DemoReviewState>;
};

function store(): Map<string, DemoReviewState> {
  if (!globalStore.__relayDemoReviewStore) {
    globalStore.__relayDemoReviewStore = new Map();
  }
  return globalStore.__relayDemoReviewStore;
}

export function getDemoReviewState(workstreamId: string): DemoReviewState {
  return store().get(workstreamId) ?? {};
}

export function patchDemoReviewState(
  workstreamId: string,
  patch: Partial<DemoReviewState>,
): DemoReviewState {
  const next = { ...getDemoReviewState(workstreamId), ...patch };
  store().set(workstreamId, next);
  return next;
}

/** Seed fixture comments, overlaid with in-memory review mutations. */
export function listDemoComments(workstreamId: string): DemoComment[] {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) return [];
  const review = getDemoReviewState(workstreamId);
  if (review.comments) return review.comments;

  const planId = detail.plan.id;
  return detail.plan.comments.map((c) => ({
    id: c.id,
    planId,
    stepId: null,
    parentId: null,
    anchorText: c.anchorText,
    body: c.body,
    authorId: c.author.id,
    authorName: c.author.name,
    resolved: c.resolved,
    createdAt: c.createdAt,
  }));
}

export function ensureDemoComments(workstreamId: string): DemoComment[] {
  const existing = getDemoReviewState(workstreamId).comments;
  if (existing) return existing;
  const seeded = listDemoComments(workstreamId);
  patchDemoReviewState(workstreamId, {
    comments: seeded,
    planLifecycle: "in_review",
  });
  return seeded;
}

export function listDemoApprovals(workstreamId: string): DemoApproval[] {
  return getDemoReviewState(workstreamId).approvals ?? [];
}

export function addDemoComment(
  workstreamId: string,
  input: {
    body: string;
    authorId: string;
    authorName: string;
    anchorText?: string | null;
    stepId?: string | null;
    parentId?: string | null;
  },
): DemoComment {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) throw new Error("Workstream not found");
  const comments = ensureDemoComments(workstreamId);
  const row: DemoComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    planId: detail.plan.id,
    stepId: input.stepId ?? null,
    parentId: input.parentId ?? null,
    anchorText: input.anchorText?.trim() || null,
    body: input.body.trim(),
    authorId: input.authorId,
    authorName: input.authorName,
    resolved: false,
    createdAt: new Date().toISOString(),
  };
  patchDemoReviewState(workstreamId, { comments: [...comments, row] });
  return row;
}

export function resolveDemoComment(workstreamId: string, commentId: string): void {
  const comments = ensureDemoComments(workstreamId).map((c) =>
    c.id === commentId || c.parentId === commentId ? { ...c, resolved: true } : c,
  );
  patchDemoReviewState(workstreamId, { comments });
}

export function applyDemoRevision(
  workstreamId: string,
  input: {
    markdownBody: string;
    steps: PlanStepDraft[];
    version: number;
  },
): void {
  const now = new Date().toISOString();
  const comments = ensureDemoComments(workstreamId).map((c) =>
    c.resolved ? c : { ...c, resolved: true },
  );
  patchDemoReviewState(workstreamId, {
    comments,
    planLifecycle: "in_review",
    approvals: [],
  });
  const agent = getDemoAgentState(workstreamId);
  patchDemoAgentState(workstreamId, {
    planMarkdown: input.markdownBody,
    planSteps: input.steps,
    planVersion: input.version,
    planStatus: "succeeded",
    stage: "in_review",
    history: [
      {
        id: `h_revise_${Date.now()}`,
        label: `Plan v${input.version} generated from comments`,
        at: now,
      },
      ...(agent.history ?? getDemoWorkstreamDetail(workstreamId)?.history ?? []),
    ],
  });
}

export function applyDemoApproval(
  workstreamId: string,
  input: { approverId: string; approverName: string; approverRole: string },
): DemoApproval {
  const detail = getDemoWorkstreamDetail(workstreamId);
  if (!detail) throw new Error("Workstream not found");
  const approval: DemoApproval = {
    id: `ap_${Date.now()}`,
    planId: detail.plan.id,
    approverId: input.approverId,
    approverName: input.approverName,
    approverRole: input.approverRole,
    createdAt: new Date().toISOString(),
  };
  patchDemoReviewState(workstreamId, {
    approvals: [...listDemoApprovals(workstreamId), approval],
    planLifecycle: "approved",
  });
  patchDemoAgentState(workstreamId, {
    stage: "approved",
    history: [
      {
        id: `h_approve_${Date.now()}`,
        label: `Plan approved by ${input.approverName}`,
        at: approval.createdAt,
      },
      ...(getDemoAgentState(workstreamId).history ?? detail.history),
    ],
  });
  return approval;
}

export function applyDemoHandOff(workstreamId: string): string {
  const jobId = `runner_${Date.now()}`;
  const now = new Date().toISOString();
  patchDemoReviewState(workstreamId, { handedOff: true, runnerJobId: jobId });
  patchDemoAgentState(workstreamId, {
    stage: "building",
    history: [
      { id: `h_handoff_${Date.now()}`, label: "Handed off to Runner", at: now },
      ...(getDemoAgentState(workstreamId).history ??
        getDemoWorkstreamDetail(workstreamId)?.history ??
        []),
    ],
  });
  return jobId;
}
