import { describe, expect, it } from "vitest";
import { draftPlanFromTemplate } from "@relay/core/agents/planner-template";
import { buildDemoSeed } from "./seed";
import { reduce, isValidState, DemoActionError, type DemoAction } from "./reducer";
import { advance } from "./simulation";
import { can, latestPlan } from "./permissions";
import { selectDetail, selectMetrics, selectNeedsAction, selectStageCounts } from "./selectors";
import type { DemoState } from "./types";

const T0 = Date.UTC(2026, 10, 18, 9, 0, 0);
const ALEX = "demo-alex";
const AISHA = "demo-aisha";
const VERA = "demo-vera";

function step(state: DemoState, action: DemoAction, now: number): DemoState {
  return advance(reduce(state, action, now), now);
}

function payload(state: DemoState, wsId: string, revise = false) {
  const ws = state.workstreams[wsId]!;
  const plan = latestPlan(ws);
  return {
    draft: draftPlanFromTemplate({
      title: ws.title,
      problemStatement: ws.problemStatement,
      findings: ws.research.findings,
      version: (plan?.version ?? 0) + 1,
      feedback: revise ? plan?.comments.filter((c) => !c.resolved).map((c) => ({ body: c.body, anchorText: c.anchorText })) : undefined,
      previousSteps: revise ? plan?.steps : undefined,
    }),
    modelId: "claude-opus-5-5",
    usage: { inputTokens: 1000, outputTokens: 400 },
  };
}

describe("demo seed", () => {
  const seed = buildDemoSeed(T0);

  it("is a valid, serialisable state", () => {
    expect(isValidState(seed)).toBe(true);
    expect(isValidState(JSON.parse(JSON.stringify(seed)))).toBe(true);
  });

  it("starts with a paused Runner question and plans in review", () => {
    const rail = seed.workstreams["demo-ws-rail"]!;
    expect(rail.stage).toBe("awaiting_input");
    expect(rail.runner?.question?.answer).toBeNull();
    expect(rail.runner?.question?.text).toMatch(/regular savings/i);

    const context = seed.workstreams["demo-ws-context"]!;
    expect(latestPlan(context)?.status).toBe("in_review");
    expect(latestPlan(context)?.comments.filter((c) => !c.resolved)).toHaveLength(3);

    expect(selectNeedsAction(seed).map((n) => n.kind)).toContain("question");
  });

  it("has live agents and a fortnight of metrics", () => {
    const counts = selectStageCounts(seed);
    expect(counts.reduce((s, c) => s + c.agentActive, 0)).toBeGreaterThan(0);
    const metrics = selectMetrics(seed, T0);
    expect(metrics.totals.merged).toBeGreaterThanOrEqual(4);
    expect(metrics.tokensByDay).toHaveLength(14);
    expect(metrics.tokensByDay.some((d) => d.tokens > 0)).toBe(true);
  });
});

describe("full relay journey", () => {
  it("goes from a new problem to a merged pull request", () => {
    let s = buildDemoSeed(T0);
    let now = T0 + 1_000;

    s = step(s, { type: "CREATE_WORKSTREAM", id: "ws-test", title: "Faster exception triage", problemStatement: "Ops triage takes too long." }, now);
    expect(s.workstreams["ws-test"]!.stage).toBe("research");
    expect(s.workstreams["ws-test"]!.research.status).toBe("running");

    now += 30_000;
    s = advance(s, now);
    let ws = s.workstreams["ws-test"]!;
    expect(ws.research.status).toBe("succeeded");
    expect(ws.research.steps.length).toBe(4);
    expect(ws.stage).toBe("planning");

    s = step(s, { type: "GENERATE_PLAN", wsId: "ws-test", ...payload(s, "ws-test") }, now);
    expect(s.workstreams["ws-test"]!.pendingPlan).not.toBeNull();
    now += 5_000;
    s = advance(s, now);
    expect(latestPlan(s.workstreams["ws-test"]!)?.status).toBe("draft");

    s = step(s, { type: "REQUEST_REVIEW", wsId: "ws-test" }, now);
    expect(s.workstreams["ws-test"]!.stage).toBe("in_review");

    // Architect comments; approval is blocked while it is open.
    s = step(s, { type: "SWITCH_USER", userId: AISHA }, now);
    s = step(s, { type: "ADD_COMMENT", wsId: "ws-test", id: "c-1", body: "Name the flag service.", anchorText: "flag" }, now);
    expect(can(s, "approve_plan", "ws-test").ok).toBe(false);

    // Owner revises from the comment.
    s = step(s, { type: "SWITCH_USER", userId: ALEX }, now);
    s = step(s, { type: "REVISE_PLAN", wsId: "ws-test", ...payload(s, "ws-test", true) }, now);
    now += 5_000;
    s = advance(s, now);
    ws = s.workstreams["ws-test"]!;
    expect(ws.plans.map((p) => p.status)).toEqual(["superseded", "in_review"]);
    expect(ws.plans[0]!.comments.every((c) => c.resolved)).toBe(true);
    expect(latestPlan(ws)?.markdown).toContain("Changes in v2");

    s = step(s, { type: "SWITCH_USER", userId: AISHA }, now);
    s = step(s, { type: "APPROVE_PLAN", wsId: "ws-test" }, now);
    expect(s.workstreams["ws-test"]!.stage).toBe("approved");

    // Only the owner hands off.
    expect(can(s, "hand_off", "ws-test").ok).toBe(false);
    s = step(s, { type: "SWITCH_USER", userId: ALEX }, now);
    s = step(s, { type: "HAND_OFF", wsId: "ws-test", model: "claude-opus-5-5", profile: "default", context: "" }, now);

    now += 120_000;
    s = advance(s, now);
    ws = s.workstreams["ws-test"]!;
    expect(ws.stage).toBe("awaiting_input");
    expect(ws.runner?.question?.answer).toBeNull();

    // Paused time does not count: far later, still paused at the same place.
    const logLength = ws.runner!.log.length;
    s = advance(s, now + 600_000);
    expect(s.workstreams["ws-test"]!.runner!.log.length).toBe(logLength);
    now += 600_000;

    s = step(s, { type: "ANSWER_QUESTION", wsId: "ws-test", answer: "Smallest safe change" }, now);
    expect(s.workstreams["ws-test"]!.stage).toBe("awaiting_input");
    now += 120_000;
    s = advance(s, now);
    ws = s.workstreams["ws-test"]!;
    expect(ws.stage).toBe("pr_open");
    expect(ws.runner?.pr?.checks).toBe("passed");
    expect(latestPlan(ws)?.steps.every((x) => x.completed)).toBe(true);

    s = step(s, { type: "MERGE_PR", wsId: "ws-test" }, now);
    ws = s.workstreams["ws-test"]!;
    expect(ws.stage).toBe("merged");

    const actions = s.audit.filter((a) => a.workstreamId === "ws-test").map((a) => a.action);
    for (const expected of ["workstream_created", "model_call", "request_review", "comment", "revise", "approval", "hand_off", "question_answered", "merge"]) {
      expect(actions).toContain(expected);
    }
    expect(selectDetail(s, "ws-test")?.nextMove.headline).toBe("Shipped");
  });
});

describe("simulation", () => {
  it("is idempotent across many small ticks, one big tick, and a reload", () => {
    const base = step(buildDemoSeed(T0), { type: "CREATE_WORKSTREAM", id: "ws-sim", title: "Sim", problemStatement: "Sim" }, T0);
    let small = base;
    for (let t = T0; t <= T0 + 20_000; t += 333) small = advance(small, t);
    const big = advance(base, T0 + 20_000);
    const reloaded = advance(JSON.parse(JSON.stringify(base)) as DemoState, T0 + 20_000);
    for (const s of [big, reloaded]) {
      expect(s.workstreams["ws-sim"]!.research.steps).toEqual(small.workstreams["ws-sim"]!.research.steps);
      expect(s.workstreams["ws-sim"]!.stage).toBe(small.workstreams["ws-sim"]!.stage);
    }
  });

  it("keeps progress when speed changes", () => {
    let s = step(buildDemoSeed(T0), { type: "CREATE_WORKSTREAM", id: "ws-speed", title: "Speed", problemStatement: "Speed" }, T0);
    s = advance(s, T0 + 4_000);
    const before = s.workstreams["ws-speed"]!.research.steps.length;
    s = reduce(s, { type: "SET_SPEED", speed: 20 }, T0 + 4_000);
    expect(advance(s, T0 + 4_000).workstreams["ws-speed"]!.research.steps.length).toBe(before);
    expect(advance(s, T0 + 5_000).workstreams["ws-speed"]!.research.status).toBe("succeeded");
  });
});

describe("permissions", () => {
  it("keeps viewers read only", () => {
    let s = buildDemoSeed(T0);
    s = reduce(s, { type: "SWITCH_USER", userId: VERA }, T0);
    expect(() => reduce(s, { type: "CREATE_IDEA", id: "i", title: "x", description: "", ideaType: "friction_log" }, T0)).toThrow(DemoActionError);
    expect(can(s, "approve_plan", "demo-ws-weekly").ok).toBe(false);
  });

  it("lets only architects and leads approve, and offers someone who can", () => {
    const s = buildDemoSeed(T0);
    const gate = can(s, "approve_plan", "demo-ws-context");
    expect(gate.ok).toBe(false);
    expect(gate.reason).toMatch(/architects and leads/);
    expect(gate.switchTo?.role).toMatch(/architect|lead/);
  });

  it("lets leads promote ideas into new workstreams that inherit a colour", () => {
    let s = reduce(buildDemoSeed(T0), { type: "SWITCH_USER", userId: "demo-leon" }, T0);
    s = reduce(s, { type: "PROMOTE_IDEA", id: "demo-idea-15", workstreamId: null, newWorkstreamId: "ws-promoted" }, T0);
    const idea = s.ideas.find((i) => i.id === "demo-idea-15")!;
    expect(idea.status).toBe("promoted");
    expect(idea.workstreamId).toBe("ws-promoted");
    expect(s.workstreams["ws-promoted"]!.stage).toBe("idea");
  });
});
