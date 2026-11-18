import type { DemoState, DemoUser, PlanVersion, Workstream } from "./types";

export type Verb =
  | "create"
  | "start_research"
  | "ask_followup"
  | "generate_plan"
  | "request_review"
  | "comment"
  | "resolve_comment"
  | "revise_plan"
  | "approve_plan"
  | "hand_off"
  | "answer_question"
  | "merge_pr"
  | "triage_idea";

export type Permission = {
  ok: boolean;
  reason?: string;
  /** A user who could do this, so a presenter can switch and carry on. */
  switchTo?: DemoUser;
};

const OK: Permission = { ok: true };

export function latestPlan(ws: Workstream): PlanVersion | null {
  return ws.plans[ws.plans.length - 1] ?? null;
}

export function openComments(plan: PlanVersion | null): number {
  if (!plan) return 0;
  return plan.comments.filter((c) => !c.resolved && c.parentId === null).length;
}

function user(state: DemoState): DemoUser {
  return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]!;
}

function firstWithRole(state: DemoState, roles: DemoUser["role"][]): DemoUser | undefined {
  return state.users.find((u) => roles.includes(u.role) && u.id !== state.currentUserId);
}

function owner(state: DemoState, ws: Workstream): DemoUser | undefined {
  return state.users.find((u) => u.id === ws.ownerId);
}

function deny(reason: string, switchTo?: DemoUser): Permission {
  return { ok: false, reason, switchTo };
}

function needsOwner(state: DemoState, ws: Workstream, what: string): Permission | null {
  const me = user(state);
  if (me.id === ws.ownerId || me.role === "lead") return null;
  const o = owner(state, ws);
  return deny(`Only the owner${o ? `, ${o.name},` : ""} or a lead can ${what}.`, o);
}

/** Can the current user do `verb` on workstream `wsId` (when relevant)? */
export function can(state: DemoState, verb: Verb, wsId?: string): Permission {
  const me = user(state);
  if (me.role === "viewer") {
    const editor = state.users.find((u) => u.role === "engineer");
    return deny("Viewers have read-only access.", editor);
  }

  if (verb === "create") return OK;

  if (verb === "triage_idea") {
    if (me.role === "lead" || me.role === "architect") return OK;
    return deny("Only leads and architects triage ideas.", firstWithRole(state, ["lead"]));
  }

  const ws = wsId ? state.workstreams[wsId] : undefined;
  if (!ws) return deny("Workstream not found.");
  const plan = latestPlan(ws);

  switch (verb) {
    case "start_research": {
      if (ws.research.status === "running") return deny("Scout is already researching.");
      if (ws.stage !== "idea") return deny("Research has already started.");
      return OK;
    }
    case "ask_followup": {
      if (ws.research.status === "running") return deny("Scout is still working on the last ask.");
      if (ws.stage === "merged" || ws.stage === "killed") return deny("This workstream is closed.");
      return OK;
    }
    case "generate_plan": {
      if (ws.pendingPlan) return deny("The Planner is already drafting.");
      if (plan) return deny("A plan exists. Revise it from comments instead.");
      if (ws.research.status !== "succeeded") return deny("Finish research before generating a plan.");
      return needsOwner(state, ws, "generate the plan") ?? OK;
    }
    case "request_review": {
      if (!plan) return deny("Generate a plan first.");
      if (plan.status !== "draft") return deny(`Plan v${plan.version} is already ${plan.status.replace("_", " ")}.`);
      return needsOwner(state, ws, "request review") ?? OK;
    }
    case "comment": {
      if (!plan) return deny("There is no plan to comment on yet.");
      if (plan.status !== "draft" && plan.status !== "in_review") {
        return deny("Comments close once a plan is approved.");
      }
      return OK;
    }
    case "resolve_comment": {
      if (!plan) return deny("There is no plan.");
      if (me.id === ws.ownerId || me.role === "architect" || me.role === "lead") return OK;
      return deny("Only the owner, an architect or a lead can resolve comments.", owner(state, ws));
    }
    case "revise_plan": {
      if (ws.pendingPlan) return deny("The Planner is already drafting.");
      if (!plan || (plan.status !== "in_review" && plan.status !== "draft")) {
        return deny("Only a plan in draft or review can be revised.");
      }
      if (openComments(plan) === 0) return deny("Revising needs open comments to work from.");
      return needsOwner(state, ws, "revise the plan") ?? OK;
    }
    case "approve_plan": {
      if (!plan || plan.status !== "in_review") return deny("Only a plan in review can be approved.");
      if (me.role !== "architect" && me.role !== "lead") {
        return deny("Only architects and leads approve plans.", firstWithRole(state, ["architect", "lead"]));
      }
      const open = openComments(plan);
      if (open > 0) return deny(`Resolve ${open} open comment${open === 1 ? "" : "s"} or revise the plan first.`);
      return OK;
    }
    case "hand_off": {
      if (ws.runner) return deny("A Runner is already working on this plan.");
      if (!plan || plan.status !== "approved") {
        return deny("Needs an approved plan.", firstWithRole(state, ["architect"]));
      }
      if (me.id !== ws.ownerId) {
        return deny("Only the owner can hand off to the Runner.", owner(state, ws));
      }
      return OK;
    }
    case "answer_question": {
      if (!ws.runner?.question || ws.runner.question.answer) return deny("No open question.");
      return needsOwner(state, ws, "answer the Runner") ?? OK;
    }
    case "merge_pr": {
      if (!ws.runner?.pr || ws.runner.status !== "pr_open") return deny("No open pull request.");
      if (ws.runner.pr.checks !== "passed") return deny("Wait for checks to pass.");
      return needsOwner(state, ws, "merge") ?? OK;
    }
    default:
      return deny("Not allowed.");
  }
}
