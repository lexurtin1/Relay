import {
  initialsFromName,
  mapStageToStepper,
  STEPPER_STAGES,
  stepperIndex,
  WORKSTREAM_COLOURS,
  type StepperStage,
  type WorkstreamStage,
} from "@relay/core/domain";
import { deriveProgress } from "@/lib/derive";
import type { NeedsActionItem, OverviewStats, WorkstreamRowRow } from "@/lib/overview";
import type { IdeaBoardItem, IdeaWorkstreamOption } from "@/lib/ideas";
import type {
  ActionGate,
  ActionVerb,
  CommentView,
  HistoryItem,
  NextMove,
  PersonRef,
  WorkstreamDetailModel,
} from "@/lib/view-models";
import { can, latestPlan, openComments, type Permission, type Verb } from "./permissions";
import type { AuditEntry, DemoState, DemoUser, PlanComment, Workstream } from "./types";

const DAY = 86_400_000;

export function currentUser(state: DemoState): DemoUser {
  return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]!;
}

export function userName(state: DemoState, id: string | null): string {
  if (!id) return "Unknown";
  return state.users.find((u) => u.id === id)?.name ?? "Unknown";
}

function person(u: DemoUser | undefined): PersonRef | undefined {
  return u ? { id: u.id, name: u.name, role: u.role } : undefined;
}

export function listWorkstreams(state: DemoState): Workstream[] {
  return state.order.map((id) => state.workstreams[id]).filter((w): w is Workstream => Boolean(w));
}

function stepsDone(ws: Workstream) {
  const plan = latestPlan(ws);
  return {
    completed: plan?.steps.filter((s) => s.completed).length ?? 0,
    total: plan?.steps.length ?? 0,
  };
}

function isAgentActive(ws: Workstream): boolean {
  return (
    ws.research.status === "running" ||
    ws.pendingPlan !== null ||
    ws.runner?.status === "provisioning" ||
    ws.runner?.status === "running" ||
    (ws.runner?.status === "pr_open" && ws.runner.pr?.checks === "running")
  );
}

export function progressOf(ws: Workstream) {
  const plan = latestPlan(ws);
  const { completed, total } = stepsDone(ws);
  return deriveProgress({
    stage: ws.stage,
    questionOpen: Boolean(ws.runner?.question && !ws.runner.question.answer),
    runnerActive: ws.runner?.status === "running" || ws.runner?.status === "provisioning",
    stepsCompleted: completed,
    stepsTotal: total,
    researchRunning: ws.research.status === "running",
    planDrafting: ws.pendingPlan !== null,
    planVersion: plan?.version ?? null,
    planStatus: plan?.status ?? null,
    openComments: openComments(plan),
    prChecks: ws.runner?.pr?.checks ?? null,
    findingsReady: Boolean(ws.research.findings),
  });
}

export function selectRows(state: DemoState): WorkstreamRowRow[] {
  return listWorkstreams(state)
    .map((ws) => {
      const owner = state.users.find((u) => u.id === ws.ownerId);
      const p = progressOf(ws);
      return {
        id: ws.id,
        title: ws.title,
        jiraKey: ws.jiraKey,
        ownerName: owner?.name ?? "Unknown",
        ownerInitials: initialsFromName(owner?.name ?? "?"),
        stage: ws.stage,
        stepperIndex: stepperIndex(ws.stage),
        progressLabel: p.label,
        progressTone: p.tone,
        updatedAt: new Date(ws.lastActivityAt).toISOString(),
        color: ws.color,
      };
    })
    .sort((a, b) => {
      const rank = (r: WorkstreamRowRow) =>
        r.progressTone === "waiting" ? 0 : r.progressTone === "active" ? 1 : r.progressTone === "neutral" ? 2 : 3;
      return rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt);
    });
}

export function selectNeedsAction(state: DemoState): NeedsActionItem[] {
  const items: NeedsActionItem[] = [];
  for (const ws of listWorkstreams(state)) {
    const plan = latestPlan(ws);
    const base = { jiraKey: ws.jiraKey, title: ws.title, color: ws.color, workstreamId: ws.id };
    const q = ws.runner?.question;
    if (q && !q.answer) {
      const { completed, total } = stepsDone(ws);
      items.push({
        ...base,
        id: `${ws.id}-q`,
        kind: "question",
        summary: `Runner paused at step ${Math.min(completed + 1, Math.max(total, 1))} of ${Math.max(total, 1)}`,
        detail: q.text,
        options: q.options,
        actionLabel: "Write an answer",
        createdAt: new Date(q.askedAt).toISOString(),
      });
      continue;
    }
    const open = openComments(plan);
    if (plan?.status === "in_review") {
      items.push({
        ...base,
        id: `${ws.id}-c`,
        kind: open > 0 ? "comments" : "approval",
        summary:
          open > 0
            ? `Plan v${plan.version}, ${open} open comment${open === 1 ? "" : "s"}`
            : `Plan v${plan.version} is ready for architect approval`,
        detail: null,
        options: [],
        actionLabel: open > 0 ? "Review comments" : "Review and approve",
        createdAt: new Date(ws.lastActivityAt).toISOString(),
      });
      continue;
    }
    if (ws.runner?.status === "pr_open" && ws.runner.pr?.checks === "passed") {
      items.push({
        ...base,
        id: `${ws.id}-m`,
        kind: "merge",
        summary: `Pull request #${ws.runner.pr.number}, checks passed`,
        detail: null,
        options: [],
        actionLabel: "Merge",
        createdAt: new Date(ws.lastActivityAt).toISOString(),
      });
      continue;
    }
    if (plan?.status === "approved" && !ws.runner) {
      items.push({
        ...base,
        id: `${ws.id}-h`,
        kind: "handoff",
        summary: `Plan v${plan.version} approved, ready for the Runner`,
        detail: null,
        options: [],
        actionLabel: "Hand off",
        createdAt: new Date(ws.lastActivityAt).toISOString(),
      });
    }
  }
  const rank: Record<NeedsActionItem["kind"], number> = { question: 0, merge: 1, approval: 2, comments: 3, handoff: 4 };
  return items.sort((a, b) => rank[a.kind] - rank[b.kind] || b.createdAt.localeCompare(a.createdAt));
}

export function selectAgentsActive(state: DemoState): number {
  return listWorkstreams(state).filter(isAgentActive).length;
}

export function selectStats(state: DemoState, now: number): OverviewStats {
  const all = listWorkstreams(state);
  return {
    allActive: all.filter((w) => w.stage !== "merged" && w.stage !== "killed").length,
    research: all.filter((w) => w.stage === "research" || w.stage === "idea").length,
    inReview: all.filter((w) => w.stage === "in_review").length,
    building: all.filter((w) => w.stage === "building" || w.stage === "awaiting_input").length,
    pullRequest: all.filter((w) => w.stage === "pr_open").length,
    mergedThisWeek: all.filter((w) => w.stage === "merged" && w.lastActivityAt >= now - 7 * DAY).length,
  };
}

export type StageCount = {
  key: StepperStage;
  label: string;
  count: number;
  blocked: number;
  agentActive: number;
  holder: "agent" | "person";
  holderLabel: string;
};

const STAGE_META: Record<StepperStage, { label: string; holder: "agent" | "person"; holderLabel: string }> = {
  research: { label: "Research", holder: "agent", holderLabel: "Scout" },
  plan: { label: "Plan", holder: "agent", holderLabel: "Planner" },
  review: { label: "Review", holder: "person", holderLabel: "Architect" },
  build: { label: "Build", holder: "agent", holderLabel: "Runner" },
  pr: { label: "Pull request", holder: "person", holderLabel: "Owner" },
};

export function selectStageCounts(state: DemoState): StageCount[] {
  const active = listWorkstreams(state).filter((w) => w.stage !== "merged" && w.stage !== "killed");
  return STEPPER_STAGES.map((key) => {
    const inStage = active.filter((w) => mapStageToStepper(w.stage) === key);
    return {
      key,
      ...STAGE_META[key],
      count: inStage.length,
      blocked: inStage.filter((w) => progressOf(w).tone === "waiting").length,
      agentActive: inStage.filter(isAgentActive).length,
    };
  });
}

/* ------------------------------------------------------------ detail view */

function threadComments(state: DemoState, comments: PlanComment[]): CommentView[] {
  const toView = (c: PlanComment): CommentView => ({
    id: c.id,
    stepId: c.stepId,
    anchorText: c.anchorText,
    body: c.body,
    authorName: userName(state, c.authorId),
    resolved: c.resolved,
    resolution: c.resolution,
    createdAt: new Date(c.createdAt).toISOString(),
    replies: comments.filter((r) => r.parentId === c.id).map(toView),
  });
  return comments.filter((c) => c.parentId === null).map(toView);
}

function gate(state: DemoState, verb: Verb, wsId: string): ActionGate {
  const p: Permission = can(state, verb, wsId);
  return { ok: p.ok, reason: p.reason, switchTo: person(p.switchTo) };
}

function historyFor(state: DemoState, ws: Workstream): HistoryItem[] {
  return state.audit
    .filter((a) => a.workstreamId === ws.id && a.action !== "connector_access")
    .slice(0, 40)
    .map((a) => ({
      id: a.id,
      label: a.agent ? `${a.agent}: ${a.detail}` : `${userName(state, a.userId)}: ${a.detail}`,
      at: new Date(a.at).toISOString(),
      actor: a.agent ? ("agent" as const) : ("person" as const),
    }));
}

function nextMoveFor(state: DemoState, ws: Workstream): NextMove {
  const owner = state.users.find((u) => u.id === ws.ownerId);
  const ownerName = owner?.name ?? "The owner";
  const plan = latestPlan(ws);
  const ownerHolder = { kind: "person" as const, name: ownerName, detail: "Owner" };

  if (ws.runner?.question && !ws.runner.question.answer) {
    return {
      holder: ownerHolder,
      headline: "The Runner needs a decision",
      body: ws.runner.question.text,
      primary: "answer_question",
    };
  }
  if (ws.pendingPlan) {
    return {
      holder: { kind: "agent", name: "Planner", detail: "Drafting" },
      headline: ws.pendingPlan.kind === "revise" ? "Revising the plan from comments" : "Drafting the plan",
      body: "The Planner turns findings and comments into ordered, testable steps.",
      primary: null,
    };
  }
  if (ws.research.status === "running") {
    return {
      holder: { kind: "agent", name: "Scout", detail: "Researching" },
      headline: "Scout is reading company sources",
      body: "Jira, Confluence, Datadog and GitHub, read only. Findings appear as each source is read.",
      primary: null,
    };
  }
  if (ws.runner && (ws.runner.status === "running" || ws.runner.status === "provisioning")) {
    const { completed, total } = stepsDone(ws);
    return {
      holder: { kind: "agent", name: "Runner", detail: `Step ${Math.min(completed + 1, total)} of ${total}` },
      headline: "The Runner is building in an isolated workspace",
      body: `Working on ${ws.runner.branch}. It will pause here if it needs you.`,
      primary: null,
    };
  }
  if (ws.runner?.status === "pr_open") {
    return ws.runner.pr?.checks === "passed"
      ? { holder: ownerHolder, headline: "Ready to merge", body: `Pull request #${ws.runner.pr.number} passed every check.`, primary: "merge_pr" }
      : { holder: { kind: "agent", name: "CI", detail: "Checks running" }, headline: "Checks are running", body: "Lint, unit and contract tests run on the pull request.", primary: null };
  }
  if (ws.stage === "merged") {
    return { holder: ownerHolder, headline: "Shipped", body: "Merged. Cycle time and token use now show in Metrics.", primary: null };
  }
  if (plan?.status === "approved") {
    return { holder: ownerHolder, headline: "Approved. Hand it to the Runner", body: "The Runner builds the approved plan in an isolated workspace with no production data.", primary: "hand_off" };
  }
  if (plan?.status === "in_review") {
    const open = openComments(plan);
    return open > 0
      ? { holder: ownerHolder, headline: `${open} comment${open === 1 ? "" : "s"} to address`, body: "Resolve each comment or let the Planner revise the plan from them.", primary: "revise_plan" }
      : { holder: { kind: "person", name: "Architect", detail: "Approval" }, headline: "Waiting for approval", body: "An architect or lead approves the plan before any code is written.", primary: "approve_plan" };
  }
  if (plan?.status === "draft") {
    return { holder: ownerHolder, headline: "Draft plan ready", body: "Read it, then send it for review so teammates can comment.", primary: "request_review" };
  }
  if (ws.research.status === "succeeded") {
    return { holder: ownerHolder, headline: "Findings are ready", body: "Ask the Planner to turn them into a plan.", primary: "generate_plan" };
  }
  return { holder: ownerHolder, headline: "Start with research", body: "Scout reads the same company sources as the chatbot and reports back.", primary: "start_research" };
}

const VERBS: ActionVerb[] = [
  "start_research",
  "generate_plan",
  "request_review",
  "revise_plan",
  "approve_plan",
  "hand_off",
  "answer_question",
  "merge_pr",
];

export function selectDetail(state: DemoState, id: string): WorkstreamDetailModel | null {
  const ws = state.workstreams[id];
  if (!ws) return null;
  const owner = state.users.find((u) => u.id === ws.ownerId);
  const plan = latestPlan(ws);
  const { completed, total } = stepsDone(ws);
  const gates = Object.fromEntries(VERBS.map((v) => [v, gate(state, v, ws.id)])) as Record<ActionVerb, ActionGate>;

  return {
    id: ws.id,
    title: ws.title,
    problemStatement: ws.problemStatement,
    stage: ws.stage,
    color: ws.color,
    jiraKey: ws.jiraKey,
    owner: person(owner) ?? { id: ws.ownerId, name: "Unknown", role: "engineer" },
    origin: ws.origin,
    priority: ws.priority,
    progress: progressOf(ws),
    research: {
      status: ws.research.status,
      ask: ws.research.ask,
      steps: ws.research.steps,
      sources: ws.research.sources,
      findings: ws.research.findings,
      liveTools: ws.research.liveTools,
    },
    plan: plan
      ? {
          id: plan.id,
          version: plan.version,
          totalVersions: ws.plans.length,
          status: plan.status,
          markdown: plan.markdown,
          steps: plan.steps.map((s) => ({
            id: s.id,
            order: s.order,
            title: s.title,
            description: s.description,
            filesLikelyTouched: s.filesLikelyTouched,
            testsToAdd: s.testsToAdd,
            riskLevel: s.riskLevel,
            completed: s.completed,
            needsConfirmation: s.needsConfirmation,
          })),
          comments: threadComments(state, plan.comments),
          openComments: openComments(plan),
          approvals: plan.approvals.map((a) => ({ name: userName(state, a.userId), at: new Date(a.at).toISOString() })),
        }
      : null,
    planDrafting: ws.pendingPlan?.kind ?? null,
    runner: ws.runner
      ? {
          status: ws.runner.status,
          model: ws.runner.model,
          profile: ws.runner.profile,
          branch: ws.runner.branch,
          context: ws.runner.context,
          log: ws.runner.log.map((l) => ({ ...l, at: new Date(l.at).toISOString() })),
          question: ws.runner.question
            ? {
                text: ws.runner.question.text,
                options: ws.runner.question.options,
                answer: ws.runner.question.answer,
                answeredBy: ws.runner.question.answeredById ? userName(state, ws.runner.question.answeredById) : null,
              }
            : null,
          pr: ws.runner.pr ? { number: ws.runner.pr.number, checks: ws.runner.pr.checks } : null,
          stepsCompleted: completed,
          stepsTotal: total,
        }
      : null,
    history: historyFor(state, ws),
    gates: {
      ...gates,
      comment: gate(state, "comment", ws.id),
      resolve: gate(state, "resolve_comment", ws.id),
      ask: gate(state, "ask_followup", ws.id),
    },
    nextMove: nextMoveFor(state, ws),
    tokens: ws.tokens,
    interactive: true,
  };
}

/* ------------------------------------------------------------------ ideas */

export function selectIdeas(state: DemoState): { items: IdeaBoardItem[]; workstreamOptions: IdeaWorkstreamOption[] } {
  const items = state.ideas.map((idea) => {
    const ws = idea.workstreamId ? state.workstreams[idea.workstreamId] : undefined;
    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      type: idea.type,
      status: idea.status,
      frequencyPerWeek: idea.frequencyPerWeek,
      minutesLostEach: idea.minutesLostEach,
      submittedByName: userName(state, idea.submittedById),
      workstreamId: ws?.id ?? null,
      workstreamTitle: ws?.title ?? null,
      color: ws?.color ?? WORKSTREAM_COLOURS.neutral,
      createdAt: new Date(idea.createdAt).toISOString(),
    };
  });
  const workstreamOptions = listWorkstreams(state)
    .map((w) => ({ id: w.id, title: w.title, color: w.color }))
    .sort((a, b) => a.title.localeCompare(b.title));
  return { items, workstreamOptions };
}

/* ---------------------------------------------------------------- metrics */

export type MetricsModel = {
  cycle: Array<{ id: string; title: string; color: string; days: number }>;
  share: Array<{ id: string; title: string; color: string; agentHours: number; personHours: number; waitingHours: number }>;
  tokensByDay: Array<{ day: string; label: string; tokens: number }>;
  totals: {
    merged: number;
    medianCycleDays: number | null;
    agentShare: number;
    tokensWeek: number;
    approvals: number;
    questionsAnswered: number;
  };
};

const AGENT_STAGES: WorkstreamStage[] = ["research", "planning", "building"];
const WAITING_STAGES: WorkstreamStage[] = ["awaiting_input"];

export function selectMetrics(state: DemoState, now: number): MetricsModel {
  const all = listWorkstreams(state);
  const merged = all.filter((w) => w.stage === "merged");

  const cycle = merged
    .map((w) => {
      const end = w.stageHistory.find((h) => h.stage === "merged")?.at ?? w.lastActivityAt;
      return { id: w.id, title: w.title, color: w.color, days: Math.max(0.1, (end - w.createdAt) / DAY) };
    })
    .sort((a, b) => a.days - b.days);

  const share = all
    .map((w) => {
      let agent = 0;
      let personMs = 0;
      let waiting = 0;
      w.stageHistory.forEach((h, i) => {
        const end = w.stageHistory[i + 1]?.at ?? (w.stage === "merged" || w.stage === "killed" ? h.at : now);
        const span = Math.max(0, end - h.at);
        if (AGENT_STAGES.includes(h.stage)) agent += span;
        else if (WAITING_STAGES.includes(h.stage)) waiting += span;
        else if (h.stage !== "merged" && h.stage !== "killed") personMs += span;
      });
      return {
        id: w.id,
        title: w.title,
        color: w.color,
        agentHours: agent / 3_600_000,
        personHours: personMs / 3_600_000,
        waitingHours: waiting / 3_600_000,
      };
    })
    .filter((r) => r.agentHours + r.personHours + r.waitingHours > 0.01)
    .sort((a, b) => b.agentHours + b.personHours + b.waitingHours - (a.agentHours + a.personHours + a.waitingHours))
    .slice(0, 8);

  const days: MetricsModel["tokensByDay"] = [];
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i -= 1) {
    const start = startOfToday.getTime() - i * DAY;
    const tokens = state.audit
      .filter((a) => a.action === "model_call" && a.at >= start && a.at < start + DAY)
      .reduce((sum, a) => sum + (a.tokenInput ?? 0) + (a.tokenOutput ?? 0), 0);
    const d = new Date(start);
    days.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      tokens,
    });
  }

  const sortedDays = cycle.map((c) => c.days).sort((a, b) => a - b);
  const mid = Math.floor(sortedDays.length / 2);
  const median =
    sortedDays.length === 0
      ? null
      : sortedDays.length % 2
        ? sortedDays[mid]!
        : (sortedDays[mid - 1]! + sortedDays[mid]!) / 2;
  const agentTotal = share.reduce((s, r) => s + r.agentHours, 0);
  const allTotal = share.reduce((s, r) => s + r.agentHours + r.personHours + r.waitingHours, 0);

  return {
    cycle,
    share,
    tokensByDay: days,
    totals: {
      merged: merged.length,
      medianCycleDays: median,
      agentShare: allTotal > 0 ? agentTotal / allTotal : 0,
      tokensWeek: days.slice(-7).reduce((s, d) => s + d.tokens, 0),
      approvals: state.audit.filter((a) => a.action === "approval").length,
      questionsAnswered: state.audit.filter((a) => a.action === "question_answered").length,
    },
  };
}

/* ------------------------------------------------------------------ audit */

export type AuditRow = AuditEntry & {
  actorName: string;
  workstreamTitle: string | null;
  workstreamColor: string | null;
};

export function selectAudit(state: DemoState): AuditRow[] {
  return state.audit.map((a) => {
    const ws = a.workstreamId ? state.workstreams[a.workstreamId] : undefined;
    return {
      ...a,
      actorName: a.agent ?? userName(state, a.userId),
      workstreamTitle: ws?.title ?? null,
      workstreamColor: ws?.color ?? null,
    };
  });
}

export function selectCommandItems(state: DemoState) {
  return listWorkstreams(state).map((w) => ({ id: w.id, title: w.title, jiraKey: w.jiraKey, stage: w.stage }));
}
