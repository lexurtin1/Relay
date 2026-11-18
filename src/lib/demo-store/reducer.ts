import type { PlannedStep } from "@relay/core/agents/planner-template";
import { WORKSTREAM_COLOURS } from "@relay/core/domain";
import { can, latestPlan, type Verb } from "./permissions";
import { advance, newClock, rebaseAll } from "./simulation";
import {
  AUDIT_CAP,
  DEMO_SCHEMA_VERSION,
  type AuditEntry,
  type DemoState,
  type IdeaStatus,
  type IdeaType,
  type PlanVersion,
  type Workstream,
} from "./types";

export type PlanDraftPayload = {
  draft: { markdown: string; steps: PlannedStep[] };
  modelId: string;
  usage: { inputTokens: number; outputTokens: number };
};

export type DemoAction =
  | { type: "SWITCH_USER"; userId: string }
  | {
      type: "CREATE_WORKSTREAM";
      id: string;
      title: string;
      problemStatement: string;
      jiraKey?: string | null;
      origin?: Workstream["origin"];
      color?: string;
      startResearch?: boolean;
    }
  | { type: "START_RESEARCH"; wsId: string }
  | { type: "ASK_FOLLOWUP"; wsId: string; question: string }
  | ({ type: "GENERATE_PLAN"; wsId: string } & PlanDraftPayload)
  | { type: "REQUEST_REVIEW"; wsId: string }
  | {
      type: "ADD_COMMENT";
      wsId: string;
      id: string;
      body: string;
      anchorText?: string | null;
      stepId?: string | null;
      parentId?: string | null;
    }
  | { type: "RESOLVE_COMMENT"; wsId: string; commentId: string }
  | ({ type: "REVISE_PLAN"; wsId: string } & PlanDraftPayload)
  | { type: "APPROVE_PLAN"; wsId: string }
  | { type: "HAND_OFF"; wsId: string; model: string; profile: string; context: string }
  | { type: "ANSWER_QUESTION"; wsId: string; answer: string }
  | { type: "MERGE_PR"; wsId: string }
  | { type: "CREATE_IDEA"; id: string; title: string; description: string; ideaType: IdeaType }
  | { type: "SET_IDEA_STATUS"; id: string; status: IdeaStatus }
  | { type: "PROMOTE_IDEA"; id: string; workstreamId: string | null; newWorkstreamId: string }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_HERO"; page: string; collapsed: boolean }
  | { type: "TICK" }
  | { type: "RESET"; seed: DemoState };

export class DemoActionError extends Error {}

function me(state: DemoState) {
  return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]!;
}

function ensure(state: DemoState, verb: Verb, wsId?: string) {
  const p = can(state, verb, wsId);
  if (!p.ok) throw new DemoActionError(p.reason ?? "Not allowed.");
}

function audit(
  state: DemoState,
  now: number,
  entry: Omit<AuditEntry, "id" | "at" | "userId" | "agent" | "modelId" | "tokenInput" | "tokenOutput"> &
    Partial<Pick<AuditEntry, "modelId" | "tokenInput" | "tokenOutput">>,
): DemoState {
  const row: AuditEntry = {
    id: `a-${now}-${state.audit.length}`,
    at: now,
    userId: state.currentUserId,
    agent: null,
    modelId: entry.modelId ?? null,
    tokenInput: entry.tokenInput ?? null,
    tokenOutput: entry.tokenOutput ?? null,
    action: entry.action,
    workstreamId: entry.workstreamId,
    detail: entry.detail,
  };
  const rows = [row, ...state.audit];
  return { ...state, audit: rows.length > AUDIT_CAP ? rows.slice(0, AUDIT_CAP) : rows };
}

function putWs(state: DemoState, ws: Workstream): DemoState {
  return { ...state, workstreams: { ...state.workstreams, [ws.id]: ws } };
}

function getWs(state: DemoState, id: string): Workstream {
  const ws = state.workstreams[id];
  if (!ws) throw new DemoActionError("Workstream not found.");
  return ws;
}

function setStage(ws: Workstream, stage: Workstream["stage"], now: number): Workstream {
  if (ws.stage === stage) return { ...ws, lastActivityAt: now };
  return {
    ...ws,
    stage,
    lastActivityAt: now,
    stageHistory: [...ws.stageHistory, { stage, at: now, actor: "person" }],
  };
}

function updatePlan(ws: Workstream, fn: (p: PlanVersion) => PlanVersion): Workstream {
  const plan = latestPlan(ws);
  if (!plan) return ws;
  return { ...ws, plans: ws.plans.map((p) => (p === plan ? fn(p) : p)) };
}

function startScout(ws: Workstream, now: number, script: "scout" | "followup", followup: string | null): Workstream {
  return {
    ...ws,
    research: {
      ...ws.research,
      status: "running",
      script,
      followup,
      ask: script === "scout" ? ws.problemStatement : ws.research.ask,
      sim: newClock(now),
    },
  };
}

function branchFor(ws: Workstream): string {
  const slug = ws.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
  return `relay/${(ws.jiraKey ?? "ws").toLowerCase()}-${slug}`;
}

function nextJiraKey(state: DemoState): string {
  const nums = Object.values(state.workstreams)
    .map((w) => Number(w.jiraKey?.replace(/^INNO-/, "")))
    .filter((n) => Number.isFinite(n));
  return `INNO-${Math.max(320, ...nums) + 1}`;
}

const PALETTE = [
  WORKSTREAM_COLOURS.context,
  WORKSTREAM_COLOURS.rail,
  WORKSTREAM_COLOURS.trust,
  WORKSTREAM_COLOURS.collective,
  WORKSTREAM_COLOURS.standards,
];

export function blankWorkstream(input: {
  id: string;
  title: string;
  problemStatement: string;
  ownerId: string;
  now: number;
  jiraKey: string | null;
  color: string;
  origin?: Workstream["origin"];
}): Workstream {
  return {
    id: input.id,
    title: input.title,
    problemStatement: input.problemStatement,
    stage: "idea",
    ownerId: input.ownerId,
    color: input.color,
    jiraKey: input.jiraKey,
    origin: input.origin ?? "internal_friction",
    priority: "medium",
    createdAt: input.now,
    lastActivityAt: input.now,
    stageHistory: [{ stage: "idea", at: input.now, actor: "person" }],
    research: {
      status: "idle",
      ask: input.problemStatement,
      steps: [],
      sources: [],
      findings: null,
      liveTools: null,
      script: null,
      followup: null,
      sim: null,
    },
    plans: [],
    pendingPlan: null,
    runner: null,
    tokens: { input: 0, output: 0 },
  };
}

function createWorkstream(
  state: DemoState,
  now: number,
  input: { id: string; title: string; problemStatement: string; jiraKey?: string | null; origin?: Workstream["origin"]; color?: string; startResearch?: boolean },
): DemoState {
  ensure(state, "create");
  const title = input.title.trim();
  if (!title) throw new DemoActionError("A title is required.");
  let ws = blankWorkstream({
    id: input.id,
    title,
    problemStatement: input.problemStatement.trim() || title,
    ownerId: state.currentUserId,
    now,
    jiraKey: input.jiraKey?.trim() || nextJiraKey(state),
    color: input.color ?? PALETTE[state.order.length % PALETTE.length]!,
    origin: input.origin,
  });
  if (input.startResearch !== false) {
    ws = setStage(startScout(ws, now, "scout", null), "research", now);
  }
  let next: DemoState = { ...putWs(state, ws), order: [ws.id, ...state.order] };
  next = audit(next, now, { action: "workstream_created", workstreamId: ws.id, detail: `Created "${ws.title}"` });
  return next;
}

/** Pure reducer. Person actions are permission-checked and audited. */
export function reduce(state: DemoState, action: DemoAction, now: number): DemoState {
  switch (action.type) {
    case "TICK":
      return advance(state, now);

    case "RESET":
      return action.seed;

    case "SET_SPEED":
      return rebaseAll(state, now, Math.max(1, action.speed));

    case "SET_HERO":
      return { ...state, ui: { ...state.ui, heroCollapsed: { ...state.ui.heroCollapsed, [action.page]: action.collapsed } } };

    case "SWITCH_USER": {
      const target = state.users.find((u) => u.id === action.userId);
      if (!target || target.id === state.currentUserId) return state;
      const next = { ...state, currentUserId: target.id };
      return audit(next, now, { action: "role_switch", workstreamId: null, detail: `Switched to ${target.name} (${target.role})` });
    }

    case "CREATE_WORKSTREAM":
      return createWorkstream(state, now, action);

    case "START_RESEARCH": {
      ensure(state, "start_research", action.wsId);
      const ws = getWs(state, action.wsId);
      const next = putWs(state, setStage(startScout(ws, now, "scout", null), "research", now));
      return audit(next, now, { action: "stage_change", workstreamId: ws.id, detail: "Started Scout research" });
    }

    case "ASK_FOLLOWUP": {
      ensure(state, "ask_followup", action.wsId);
      const question = action.question.trim();
      if (!question) throw new DemoActionError("Type a question for Scout.");
      const ws = getWs(state, action.wsId);
      let updated = startScout(ws, now, "followup", question);
      if (ws.stage === "idea") updated = setStage(updated, "research", now);
      return audit(putWs(state, { ...updated, lastActivityAt: now }), now, {
        action: "stage_change",
        workstreamId: ws.id,
        detail: `Asked Scout: ${question}`,
      });
    }

    case "GENERATE_PLAN":
    case "REVISE_PLAN": {
      const revise = action.type === "REVISE_PLAN";
      ensure(state, revise ? "revise_plan" : "generate_plan", action.wsId);
      const ws = getWs(state, action.wsId);
      const updated: Workstream = {
        ...ws,
        lastActivityAt: now,
        pendingPlan: {
          kind: revise ? "revise" : "generate",
          startedAt: now,
          draft: action.draft,
          modelId: action.modelId,
          usage: action.usage,
        },
      };
      return audit(putWs(state, updated), now, {
        action: revise ? "revise" : "stage_change",
        workstreamId: ws.id,
        detail: revise ? "Asked the Planner to revise from comments" : "Asked the Planner for a plan",
      });
    }

    case "REQUEST_REVIEW": {
      ensure(state, "request_review", action.wsId);
      const ws = getWs(state, action.wsId);
      const plan = latestPlan(ws)!;
      const updated = setStage(updatePlan(ws, (p) => ({ ...p, status: "in_review" })), "in_review", now);
      return audit(putWs(state, updated), now, {
        action: "request_review",
        workstreamId: ws.id,
        detail: `Requested review of plan v${plan.version}`,
      });
    }

    case "ADD_COMMENT": {
      ensure(state, "comment", action.wsId);
      const body = action.body.trim();
      if (!body) throw new DemoActionError("Write a comment first.");
      const ws = getWs(state, action.wsId);
      const updated = updatePlan(ws, (p) => ({
        ...p,
        comments: [
          ...p.comments,
          {
            id: action.id,
            parentId: action.parentId ?? null,
            stepId: action.stepId ?? null,
            anchorText: action.anchorText?.trim() || null,
            body,
            authorId: state.currentUserId,
            resolved: false,
            resolvedById: null,
            resolution: null,
            createdAt: now,
          },
        ],
      }));
      return audit(putWs(state, { ...updated, lastActivityAt: now }), now, {
        action: "comment",
        workstreamId: ws.id,
        detail: action.parentId ? `Replied: ${body}` : `Commented: ${body}`,
      });
    }

    case "RESOLVE_COMMENT": {
      ensure(state, "resolve_comment", action.wsId);
      const ws = getWs(state, action.wsId);
      const updated = updatePlan(ws, (p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id === action.commentId || c.parentId === action.commentId
            ? { ...c, resolved: true, resolvedById: state.currentUserId, resolution: `Resolved by ${me(state).name}` }
            : c,
        ),
      }));
      return audit(putWs(state, { ...updated, lastActivityAt: now }), now, {
        action: "resolve",
        workstreamId: ws.id,
        detail: "Resolved a comment",
      });
    }

    case "APPROVE_PLAN": {
      ensure(state, "approve_plan", action.wsId);
      const ws = getWs(state, action.wsId);
      const plan = latestPlan(ws)!;
      const updated = setStage(
        updatePlan(ws, (p) => ({
          ...p,
          status: "approved",
          approvals: [...p.approvals, { userId: state.currentUserId, at: now }],
        })),
        "approved",
        now,
      );
      return audit(putWs(state, updated), now, {
        action: "approval",
        workstreamId: ws.id,
        detail: `Approved plan v${plan.version}`,
      });
    }

    case "HAND_OFF": {
      ensure(state, "hand_off", action.wsId);
      const ws = getWs(state, action.wsId);
      const updated = setStage(
        {
          ...ws,
          runner: {
            id: `${ws.id}-runner-${now}`,
            status: "provisioning",
            model: action.model,
            profile: action.profile,
            context: action.context.trim(),
            branch: branchFor(ws),
            startedAt: now,
            log: [],
            question: null,
            questionOverride: null,
            pr: null,
            sim: newClock(now),
          },
        },
        "building",
        now,
      );
      return audit(putWs(state, updated), now, {
        action: "hand_off",
        workstreamId: ws.id,
        modelId: action.model,
        detail: `Handed off to the Runner (${action.profile} profile)`,
      });
    }

    case "ANSWER_QUESTION": {
      ensure(state, "answer_question", action.wsId);
      const answer = action.answer.trim();
      if (!answer) throw new DemoActionError("Choose or write an answer.");
      const ws = getWs(state, action.wsId);
      const runner = ws.runner!;
      const sim = runner.sim
        ? {
            ...runner.sim,
            pausedMs: runner.sim.pausedMs + (runner.sim.pausedAt !== null ? now - runner.sim.pausedAt : 0),
            pausedAt: null,
          }
        : null;
      const updated: Workstream = {
        ...ws,
        lastActivityAt: now,
        runner: {
          ...runner,
          status: "running",
          sim,
          question: { ...runner.question!, answer, answeredById: state.currentUserId, answeredAt: now },
          log: [...runner.log, { at: now, text: `${me(state).name} answered: ${answer}`, kind: "answer" }],
        },
      };
      return audit(putWs(state, updated), now, {
        action: "question_answered",
        workstreamId: ws.id,
        detail: `Answered the Runner: ${answer}`,
      });
    }

    case "MERGE_PR": {
      ensure(state, "merge_pr", action.wsId);
      const ws = getWs(state, action.wsId);
      const runner = ws.runner!;
      const updated = setStage(
        {
          ...ws,
          runner: {
            ...runner,
            status: "merged",
            sim: null,
            log: [...runner.log, { at: now, text: `Merged pull request #${runner.pr?.number ?? ""}`, kind: "pr" }],
          },
        },
        "merged",
        now,
      );
      return audit(putWs(state, updated), now, {
        action: "merge",
        workstreamId: ws.id,
        detail: `Merged pull request #${runner.pr?.number ?? ""}`,
      });
    }

    case "CREATE_IDEA": {
      ensure(state, "create");
      const title = action.title.trim();
      if (!title) throw new DemoActionError("An idea needs a title.");
      const next = {
        ...state,
        ideas: [
          {
            id: action.id,
            title,
            description: action.description.trim(),
            type: action.ideaType,
            status: "new" as const,
            frequencyPerWeek: null,
            minutesLostEach: null,
            submittedById: state.currentUserId,
            workstreamId: null,
            createdAt: now,
          },
          ...state.ideas,
        ],
      };
      return audit(next, now, { action: "idea_created", workstreamId: null, detail: `Logged idea "${title}"` });
    }

    case "SET_IDEA_STATUS": {
      ensure(state, "triage_idea");
      const idea = state.ideas.find((i) => i.id === action.id);
      if (!idea) throw new DemoActionError("Idea not found.");
      const next = { ...state, ideas: state.ideas.map((i) => (i.id === action.id ? { ...i, status: action.status } : i)) };
      return audit(next, now, { action: "idea_status", workstreamId: idea.workstreamId, detail: `Moved "${idea.title}" to ${action.status}` });
    }

    case "PROMOTE_IDEA": {
      ensure(state, "triage_idea");
      const idea = state.ideas.find((i) => i.id === action.id);
      if (!idea) throw new DemoActionError("Idea not found.");
      let next = state;
      let wsId = action.workstreamId;
      if (!wsId) {
        next = createWorkstream(next, now, {
          id: action.newWorkstreamId,
          title: idea.title,
          problemStatement: idea.description || idea.title,
          origin: idea.type === "external_signal" ? "external_opportunity" : "internal_friction",
          startResearch: false,
        });
        wsId = action.newWorkstreamId;
      }
      const ws = getWs(next, wsId);
      next = {
        ...next,
        ideas: next.ideas.map((i) => (i.id === idea.id ? { ...i, status: "promoted" as const, workstreamId: ws.id } : i)),
      };
      return audit(next, now, { action: "idea_promoted", workstreamId: ws.id, detail: `Promoted "${idea.title}" into "${ws.title}"` });
    }

    default:
      return state;
  }
}

export function isValidState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<DemoState>;
  return (
    s.schemaVersion === DEMO_SCHEMA_VERSION &&
    Array.isArray(s.users) &&
    Array.isArray(s.order) &&
    typeof s.workstreams === "object" &&
    Array.isArray(s.ideas) &&
    Array.isArray(s.audit)
  );
}
