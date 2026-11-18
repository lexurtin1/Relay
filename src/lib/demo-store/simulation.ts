import type {
  AuditEntry,
  DemoState,
  PlanVersion,
  Research,
  ResearchStep,
  Runner,
  SimClock,
  SourceRef,
  Workstream,
} from "./types";
import { LOG_CAP } from "./types";
import { latestPlan } from "./permissions";

/** Script timings are in milliseconds at speed 1. */
export const PLANNER_MS = 3_200;
export const SCOUT_STEP_MS = 2_600;
export const RUNNER_STEP_MS = 5_000;
export const PR_CHECKS_MS = 6_000;

export const DEFAULT_QUESTION = {
  text: "Step 2 changes behaviour other teams rely on. How should the Runner proceed?",
  options: [
    "Smallest safe change",
    "Full change behind a flag",
    "Pause for the architect",
  ],
};

type AuditDraft = Omit<AuditEntry, "id">;
type Applied = { ws: Workstream; audit?: AuditDraft[] };
type ScriptEvent = { atMs: number; apply: (ws: Workstream, at: number) => Applied };

export function newClock(now: number): SimClock {
  return { startedAt: now, pausedMs: 0, pausedAt: null, applied: 0 };
}

export function elapsed(clock: SimClock, now: number, speed: number): number {
  const end = clock.pausedAt ?? now;
  return Math.max(0, (end - clock.startedAt - clock.pausedMs) * speed);
}

/** Wall-clock time at which a script offset happens. */
function eventTime(clock: SimClock, atMs: number, speed: number): number {
  return Math.round(clock.startedAt + clock.pausedMs + atMs / speed);
}

/** Keep script progress unchanged when the speed changes. */
export function rebaseClock(clock: SimClock, now: number, from: number, to: number): SimClock {
  const done = elapsed(clock, now, from);
  const end = clock.pausedAt ?? now;
  return { ...clock, startedAt: Math.round(end - clock.pausedMs - done / to) };
}

function agentAudit(
  ws: Workstream,
  at: number,
  agent: AuditEntry["agent"],
  action: AuditEntry["action"],
  detail: string,
  usage?: { modelId: string; input: number; output: number },
): AuditDraft {
  return {
    at,
    action,
    userId: null,
    agent,
    workstreamId: ws.id,
    modelId: usage?.modelId ?? null,
    tokenInput: usage?.input ?? null,
    tokenOutput: usage?.output ?? null,
    detail,
  };
}

function withStage(ws: Workstream, stage: Workstream["stage"], at: number): Workstream {
  if (ws.stage === stage) return { ...ws, lastActivityAt: at };
  return {
    ...ws,
    stage,
    lastActivityAt: at,
    stageHistory: [...ws.stageHistory, { stage, at, actor: "agent" }],
  };
}

function shortTitle(title: string): string {
  return title.length > 48 ? `${title.slice(0, 47).trimEnd()}...` : title;
}

/* ------------------------------------------------------------------ Scout */

type ScoutStep = ResearchStep & { source: SourceRef; tools: string };

function scoutSteps(ws: Workstream): ScoutStep[] {
  const t = shortTitle(ws.title);
  return [
    {
      id: `${ws.id}-scout-1`,
      title: "Reading the ask and linked tickets",
      rationale: "Starting from the problem statement and any Jira history.",
      disclosureLabel: "Searched Jira",
      disclosureDetail: "jira.search",
      tools: "jira.search",
      source: { connector: "jira", title: ws.jiraKey ?? "Related INNO tickets", itemId: ws.jiraKey ?? undefined },
    },
    {
      id: `${ws.id}-scout-2`,
      title: "Looking for prior designs and decisions",
      rationale: "Checking Confluence so the plan builds on what the team already agreed.",
      disclosureLabel: "Read pages",
      disclosureDetail: "confluence.search · confluence.get_page",
      tools: "confluence.search… confluence.get_page",
      source: { connector: "confluence", title: `Design notes: ${t}` },
    },
    {
      id: `${ws.id}-scout-3`,
      title: "Checking how often this hurts today",
      rationale: "Datadog shows the live volume of exceptions this would touch.",
      disclosureLabel: "Read dashboard",
      disclosureDetail: "datadog.get_dashboard",
      tools: "datadog.get_dashboard",
      source: { connector: "datadog", title: "Ops exceptions dashboard (demo)" },
    },
    {
      id: `${ws.id}-scout-4`,
      title: "Finding the code that would change",
      rationale: "GitHub search narrows the files the Runner will touch.",
      disclosureLabel: "Searched code",
      disclosureDetail: "github.search_code",
      tools: "github.search_code",
      source: { connector: "github", title: "packages/mcp/src/tools" },
    },
  ];
}

function addStep(research: Research, step: ScoutStep): Research {
  const { source, tools, ...view } = step;
  const hasSource = research.sources.some(
    (s) => s.connector === source.connector && s.title === source.title,
  );
  return {
    ...research,
    steps: [...research.steps, view],
    sources: hasSource ? research.sources : [...research.sources, source],
    liveTools: tools,
  };
}

function scoutScript(ws: Workstream): ScriptEvent[] {
  const steps = scoutSteps(ws);
  const events: ScriptEvent[] = steps.map((step, i) => ({
    atMs: 1_200 + i * SCOUT_STEP_MS,
    apply: (w, at) => ({
      ws: { ...w, lastActivityAt: at, research: addStep(w.research, step) },
      audit: [agentAudit(w, at, "Scout", "connector_access", `Read ${step.source.connector}: ${step.source.title}`)],
    }),
  }));
  events.push({
    atMs: 1_200 + steps.length * SCOUT_STEP_MS,
    apply: (w, at) => {
      const connectors = [...new Set(w.research.sources.map((s) => s.connector))];
      const findings = `Scout read ${w.research.sources.length} sources across ${connectors.join(", ")}. Prior design notes exist and can be reused. Live exception volume supports doing this now. The change is contained to the MCP tools package and one ops service.`;
      const input = 1_800 + w.problemStatement.length;
      return {
        ws: withStage(
          {
            ...w,
            research: { ...w.research, status: "succeeded", findings, liveTools: null, sim: null },
            tokens: { input: w.tokens.input + input, output: w.tokens.output + 640 },
          },
          "planning",
          at,
        ),
        audit: [
          agentAudit(w, at, "Scout", "model_call", "Summarised research findings", {
            modelId: "claude-sonnet-5-5",
            input,
            output: 640,
          }),
        ],
      };
    },
  });
  return events;
}

function followupScript(ws: Workstream): ScriptEvent[] {
  const question = ws.research.followup ?? "Follow-up";
  const step: ScoutStep = {
    id: `${ws.id}-follow-${ws.research.steps.length + 1}`,
    title: `Answering: ${shortTitle(question)}`,
    rationale: "Searching the same sources again with your follow-up.",
    disclosureLabel: "Searched connectors",
    disclosureDetail: "confluence.search · jira.search",
    tools: "confluence.search… jira.search",
    source: { connector: "confluence", title: "Team decisions log (demo)" },
  };
  return [
    {
      atMs: 800,
      apply: (w, at) => ({ ws: { ...w, lastActivityAt: at, research: addStep(w.research, step) } }),
    },
    {
      atMs: 800 + SCOUT_STEP_MS,
      apply: (w, at) => {
        const note = `Follow-up "${shortTitle(question)}": the decisions log covers this and suggests keeping the first version read-only.`;
        const findings = w.research.findings ? `${w.research.findings}\n\n${note}` : note;
        const next = {
          ...w,
          research: { ...w.research, status: "succeeded" as const, findings, liveTools: null, sim: null },
          tokens: { input: w.tokens.input + 900, output: w.tokens.output + 220 },
        };
        return {
          ws: w.stage === "idea" || w.stage === "research" ? withStage(next, "planning", at) : { ...next, lastActivityAt: at },
          audit: [
            agentAudit(w, at, "Scout", "model_call", "Answered a follow-up question", {
              modelId: "claude-sonnet-5-5",
              input: 900,
              output: 220,
            }),
          ],
        };
      },
    },
  ];
}

/* ---------------------------------------------------------------- Planner */

function revealPlan(ws: Workstream, at: number): Applied {
  const pending = ws.pendingPlan!;
  const previous = latestPlan(ws);
  const version = (previous?.version ?? 0) + 1;
  const id = `${ws.id}-plan-v${version}`;
  const plan: PlanVersion = {
    id,
    version,
    status: pending.kind === "revise" ? "in_review" : "draft",
    markdown: pending.draft.markdown,
    steps: pending.draft.steps.map((s) => ({ ...s, id: `${id}-s${s.order}`, completed: false })),
    comments: [],
    approvals: [],
    createdAt: at,
    modelId: pending.modelId,
  };
  const plans = ws.plans.map((p) => {
    if (p !== previous || pending.kind !== "revise") return p;
    return {
      ...p,
      status: "superseded" as const,
      comments: p.comments.map((c) =>
        c.resolved ? c : { ...c, resolved: true, resolution: `Addressed in v${version}` },
      ),
    };
  });
  const next: Workstream = {
    ...ws,
    plans: [...plans, plan],
    pendingPlan: null,
    tokens: {
      input: ws.tokens.input + pending.usage.inputTokens,
      output: ws.tokens.output + pending.usage.outputTokens,
    },
  };
  return {
    ws: withStage(next, pending.kind === "revise" ? "in_review" : "planning", at),
    audit: [
      agentAudit(
        ws,
        at,
        "Planner",
        "model_call",
        pending.kind === "revise" ? `Drafted plan v${version} from review comments` : `Drafted plan v${version}`,
        { modelId: pending.modelId, input: pending.usage.inputTokens, output: pending.usage.outputTokens },
      ),
    ],
  };
}

/* ----------------------------------------------------------------- Runner */

function log(runner: Runner, at: number, text: string, kind: Runner["log"][number]["kind"]): Runner {
  const lines = [...runner.log, { at, text, kind }];
  return { ...runner, log: lines.length > LOG_CAP ? lines.slice(-LOG_CAP) : lines };
}

function updateRunner(ws: Workstream, fn: (r: Runner) => Runner): Workstream {
  return ws.runner ? { ...ws, runner: fn(ws.runner) } : ws;
}

function completeStep(ws: Workstream, index: number): Workstream {
  const plan = latestPlan(ws);
  if (!plan) return ws;
  return {
    ...ws,
    plans: ws.plans.map((p) =>
      p === plan
        ? { ...p, steps: p.steps.map((s, i) => (i === index ? { ...s, completed: true } : s)) }
        : p,
    ),
  };
}

function prNumber(ws: Workstream): number {
  let h = 0;
  for (const ch of ws.id) h = (h * 31 + ch.charCodeAt(0)) % 900;
  return 100 + h;
}

export function runnerScript(ws: Workstream): ScriptEvent[] {
  const plan = latestPlan(ws);
  const steps = plan?.steps ?? [];
  const askIndex = Math.min(1, Math.max(steps.length - 1, 0));
  const events: ScriptEvent[] = [
    {
      atMs: 0,
      apply: (w, at) => ({
        ws: updateRunner(w, (r) => log({ ...r, status: "provisioning" }, at, `Creating an isolated workspace on ${r.branch}`, "info")),
      }),
    },
    {
      atMs: 1_200,
      apply: (w, at) => ({
        ws: updateRunner(w, (r) =>
          log({ ...r, status: "running" }, at, `git worktree add ../${r.branch.replace("/", "-")} (demo repo, no production data)`, "tool"),
        ),
      }),
    },
    {
      atMs: 2_400,
      apply: (w, at) => ({
        ws: updateRunner(w, (r) => log(r, at, `Read approved plan v${plan?.version ?? 1} with ${steps.length} steps`, "info")),
      }),
    },
  ];

  let t = 3_600;
  steps.forEach((step, i) => {
    if (i === askIndex) {
      events.push({
        atMs: t,
        apply: (w, at) => {
          const q = w.runner?.questionOverride ?? DEFAULT_QUESTION;
          const next = updateRunner(w, (r) => {
            const paused: Runner = {
              ...r,
              status: "awaiting_input",
              question: { text: q.text, options: q.options, askedAt: at, answer: null, answeredById: null, answeredAt: null },
              sim: r.sim ? { ...r.sim, pausedAt: at } : null,
            };
            return log(paused, at, `Paused: ${q.text}`, "question");
          });
          return {
            ws: withStage(next, "awaiting_input", at),
            audit: [agentAudit(w, at, "Runner", "stage_change", "Paused with a question for the owner")],
          };
        },
      });
      t += 800;
    }
    const start = t;
    events.push({
      atMs: start,
      apply: (w, at) => ({
        ws: updateRunner(
          w.stage === "awaiting_input" ? withStage(w, "building", at) : { ...w, lastActivityAt: at },
          (r) => log({ ...r, status: "running" }, at, `Step ${i + 1}: ${step.title}`, "info"),
        ),
      }),
    });
    events.push({
      atMs: start + RUNNER_STEP_MS / 2,
      apply: (w, at) => ({
        ws: updateRunner(w, (r) =>
          log(r, at, `edit ${step.filesLikelyTouched[0] ?? "src/index.ts"}`, "tool"),
        ),
      }),
    });
    events.push({
      atMs: start + RUNNER_STEP_MS,
      apply: (w, at) => {
        const tests = 6 + i * 4;
        const done = completeStep(w, i);
        const input = 2_400 + i * 300;
        return {
          ws: {
            ...updateRunner(done, (r) => log(r, at, `vitest: ${tests} passed, 0 failed`, "test")),
            lastActivityAt: at,
            tokens: { input: w.tokens.input + input, output: w.tokens.output + 900 },
          },
          audit: [
            agentAudit(w, at, "Runner", "model_call", `Completed step ${i + 1}: ${step.title}`, {
              modelId: w.runner?.model ?? "claude-opus-5-5",
              input,
              output: 900,
            }),
          ],
        };
      },
    });
    t = start + RUNNER_STEP_MS + 600;
  });

  events.push({
    atMs: t + 900,
    apply: (w, at) => {
      const number = prNumber(w);
      const next = updateRunner(w, (r) =>
        log({ ...r, status: "pr_open", pr: { number, checks: "running", openedAt: at } }, at, `Opened pull request #${number} from ${r.branch}`, "pr"),
      );
      return {
        ws: withStage(next, "pr_open", at),
        audit: [agentAudit(w, at, "Runner", "stage_change", `Opened pull request #${number}`)],
      };
    },
  });
  events.push({
    atMs: t + 900 + PR_CHECKS_MS,
    apply: (w, at) => ({
      ws: updateRunner(w, (r) =>
        log({ ...r, pr: r.pr ? { ...r.pr, checks: "passed" } : null, sim: null }, at, "Checks passed: lint, unit tests, contract tests", "test"),
      ),
    }),
  });
  return events;
}

/* ---------------------------------------------------------------- advance */

function runClock(
  ws: Workstream,
  clock: SimClock,
  script: ScriptEvent[],
  now: number,
  speed: number,
  getClock: (w: Workstream) => SimClock | null,
  setClock: (w: Workstream, c: SimClock) => Workstream,
  audit: AuditDraft[],
): Workstream {
  let current = ws;
  let c = clock;
  while (c.applied < script.length) {
    const event = script[c.applied]!;
    if (elapsed(c, now, speed) < event.atMs) break;
    const at = eventTime(c, event.atMs, speed);
    const result = event.apply(current, at);
    current = result.ws;
    if (result.audit) audit.push(...result.audit);
    const after = getClock(current);
    if (!after) return current; // script cleared its own clock (finished)
    c = { ...after, applied: c.applied + 1 };
    current = setClock(current, c);
  }
  return current;
}

function advanceWorkstream(ws: Workstream, now: number, speed: number, audit: AuditDraft[]): Workstream {
  let current = ws;

  const rClock = current.research.sim;
  if (current.research.status === "running" && rClock) {
    const script = current.research.script === "followup" ? followupScript(current) : scoutScript(current);
    current = runClock(
      current,
      rClock,
      script,
      now,
      speed,
      (w) => w.research.sim,
      (w, c) => ({ ...w, research: { ...w.research, sim: c } }),
      audit,
    );
  }

  const pending = current.pendingPlan;
  if (pending) {
    const readyAt = pending.startedAt + PLANNER_MS / speed;
    if (now >= readyAt) {
      const result = revealPlan(current, Math.round(readyAt));
      current = result.ws;
      if (result.audit) audit.push(...result.audit);
    }
  }

  const runner = current.runner;
  if (runner?.sim) {
    current = runClock(
      current,
      runner.sim,
      runnerScript(current),
      now,
      speed,
      (w) => w.runner?.sim ?? null,
      (w, c) => (w.runner ? { ...w, runner: { ...w.runner, sim: c } } : w),
      audit,
    );
  }

  return current;
}

/** Run one workstream's agents up to `now`. Used by the seed to fast-forward fixtures. */
export function simulateWorkstream(
  ws: Workstream,
  now: number,
  speed = 1,
): { ws: Workstream; audit: AuditDraft[] } {
  const audit: AuditDraft[] = [];
  return { ws: advanceWorkstream(ws, now, speed, audit), audit };
}

export function isSimulating(state: DemoState): boolean {
  return state.order.some((id) => {
    const ws = state.workstreams[id];
    if (!ws) return false;
    return (
      (ws.research.status === "running" && ws.research.sim !== null) ||
      ws.pendingPlan !== null ||
      (ws.runner?.sim != null && ws.runner.sim.pausedAt === null)
    );
  });
}

/** Apply every scripted agent event due by `now`. Pure and idempotent. */
export function advance(state: DemoState, now: number): DemoState {
  if (!isSimulating(state)) return state;
  const drafts: AuditDraft[] = [];
  let changed = false;
  const workstreams = { ...state.workstreams };
  for (const id of state.order) {
    const ws = workstreams[id];
    if (!ws) continue;
    const next = advanceWorkstream(ws, now, state.speed, drafts);
    if (next !== ws) {
      workstreams[id] = next;
      changed = true;
    }
  }
  if (!changed) return state;
  const audit = drafts.length
    ? [
        ...drafts.map((d, i) => ({ ...d, id: `sim-${d.workstreamId}-${d.at}-${i}-${d.action}` })),
        ...state.audit,
      ]
    : state.audit;
  return { ...state, workstreams, audit };
}

/** Keep every running clock at the same script position when speed changes. */
export function rebaseAll(state: DemoState, now: number, to: number): DemoState {
  const from = state.speed;
  if (from === to) return state;
  const workstreams: DemoState["workstreams"] = {};
  for (const [id, ws] of Object.entries(state.workstreams)) {
    let next = ws;
    if (ws.research.sim) {
      next = { ...next, research: { ...next.research, sim: rebaseClock(ws.research.sim, now, from, to) } };
    }
    if (ws.pendingPlan) {
      const done = (now - ws.pendingPlan.startedAt) * from;
      next = { ...next, pendingPlan: { ...ws.pendingPlan, startedAt: Math.round(now - done / to) } };
    }
    if (ws.runner?.sim) {
      next = { ...next, runner: { ...ws.runner, sim: rebaseClock(ws.runner.sim, now, from, to) } };
    }
    workstreams[id] = next;
  }
  return { ...state, speed: to, workstreams };
}
