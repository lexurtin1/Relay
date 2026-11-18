import type { WorkstreamStage } from "@relay/core/domain";
import { WORKSTREAM_COLOURS } from "@relay/core/domain";
import {
  draftPlanFromTemplate,
  type PlannedStep,
} from "@relay/core/agents/planner-template";
import {
  DEMO_USERS,
  DEMO_WORKSTREAM_ROWS,
  getDemoIdeasData,
  getDemoWorkstreamDetail,
} from "@/lib/demo-data";
import { blankWorkstream } from "./reducer";
import { newClock, simulateWorkstream } from "./simulation";
import {
  DEMO_SCHEMA_VERSION,
  type AuditEntry,
  type DemoState,
  type DemoUser,
  type Idea,
  type PlanComment,
  type PlanVersion,
  type Runner,
  type StageEvent,
  type Workstream,
} from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const PATH: WorkstreamStage[] = [
  "idea",
  "research",
  "planning",
  "in_review",
  "approved",
  "building",
  "pr_open",
  "merged",
];

const AGENT_STAGES = new Set<WorkstreamStage>(["research", "planning", "building", "pr_open"]);

type AuditDraft = Omit<AuditEntry, "id">;

function history(stage: WorkstreamStage, start: number, end: number): StageEvent[] {
  const target = stage === "awaiting_input" ? "building" : stage;
  const idx = Math.max(0, PATH.indexOf(target));
  const stages = PATH.slice(0, idx + 1);
  if (stage === "awaiting_input") stages.push("awaiting_input");
  const span = Math.max(1, end - start);
  // Agent stages are quick; people stages take longer. Weight the spacing.
  const weights = stages.map((s) => (AGENT_STAGES.has(s) ? 1 : 2.4));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return stages.map((s, i) => {
    const at = Math.round(t);
    t += (span * weights[i]!) / total;
    return { stage: s, at, actor: AGENT_STAGES.has(s) ? "agent" : "person" };
  });
}

function planVersion(
  wsId: string,
  version: number,
  status: PlanVersion["status"],
  markdown: string,
  steps: PlannedStep[],
  createdAt: number,
  extra?: Partial<PlanVersion>,
): PlanVersion {
  const id = `${wsId}-plan-v${version}`;
  return {
    id,
    version,
    status,
    markdown,
    steps: steps.map((s) => ({ ...s, id: `${id}-s${s.order}`, completed: false })),
    comments: [],
    approvals: [],
    createdAt,
    modelId: "claude-opus-5-5",
    ...extra,
  };
}

function comment(id: string, authorId: string, body: string, anchorText: string | null, at: number): PlanComment {
  return {
    id,
    parentId: null,
    stepId: null,
    anchorText,
    body,
    authorId,
    resolved: false,
    resolvedById: null,
    resolution: null,
    createdAt: at,
  };
}

/** Fast-forward Scout so the workstream carries real findings and audit rows. */
function withFinishedResearch(ws: Workstream, at: number, audit: AuditDraft[]): Workstream {
  const running: Workstream = {
    ...ws,
    stage: "research",
    research: { ...ws.research, status: "running", script: "scout", sim: newClock(at) },
  };
  const result = simulateWorkstream(running, at + 60_000);
  audit.push(...result.audit);
  return result.ws;
}

function modelCall(
  ws: Workstream,
  at: number,
  agent: AuditEntry["agent"],
  detail: string,
  input: number,
  output: number,
  modelId = "claude-opus-5-5",
): AuditDraft {
  return { at, action: "model_call", userId: null, agent, workstreamId: ws.id, modelId, tokenInput: input, tokenOutput: output, detail };
}

function personEvent(
  ws: Workstream,
  at: number,
  userId: string,
  action: AuditEntry["action"],
  detail: string,
): AuditDraft {
  return { at, action, userId, agent: null, workstreamId: ws.id, modelId: null, tokenInput: null, tokenOutput: null, detail };
}

function runnerLog(ws: Workstream, start: number, steps: number): Runner["log"] {
  const branch = `relay/${(ws.jiraKey ?? "ws").toLowerCase()}`;
  const lines: Runner["log"] = [
    { at: start, text: `Creating an isolated workspace on ${branch}`, kind: "info" },
    { at: start + 60_000, text: "git worktree add (demo repo, no production data)", kind: "tool" },
  ];
  for (let i = 0; i < steps; i += 1) {
    lines.push({ at: start + (i + 1) * 20 * 60_000, text: `Step ${i + 1} complete`, kind: "info" });
    lines.push({ at: start + (i + 1) * 20 * 60_000 + 30_000, text: `vitest: ${6 + i * 4} passed, 0 failed`, kind: "test" });
  }
  return lines;
}

/** Historical shipped work so Metrics has a fortnight of data. Fictional and internal. */
const HISTORICAL = [
  {
    id: "demo-ws-hist-labels",
    title: "Tidy exception codes in the ops runbook",
    jiraKey: "INNO-301",
    owner: "demo-owen",
    color: WORKSTREAM_COLOURS.collective,
    createdDaysAgo: 13,
    mergedDaysAgo: 10,
  },
  {
    id: "demo-ws-hist-digest",
    title: "Weekly pipeline digest for the team",
    jiraKey: "INNO-304",
    owner: "demo-alex",
    color: WORKSTREAM_COLOURS.context,
    createdDaysAgo: 11,
    mergedDaysAgo: 6,
  },
  {
    id: "demo-ws-hist-isin",
    title: "Shared ISIN check in the demo MCP server",
    jiraKey: "INNO-306",
    owner: "demo-aisha",
    color: WORKSTREAM_COLOURS.standards,
    createdDaysAgo: 8,
    mergedDaysAgo: 4,
  },
];

export function buildDemoSeed(now: number): DemoState {
  const users: DemoUser[] = DEMO_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role as DemoUser["role"],
    team: u.team ?? "Innovation and Strategy",
  }));
  const byName = new Map(users.map((u) => [u.name, u]));
  const audit: AuditDraft[] = [];
  const workstreams: Record<string, Workstream> = {};
  const order: string[] = [];

  const add = (ws: Workstream) => {
    workstreams[ws.id] = ws;
    order.push(ws.id);
  };

  DEMO_WORKSTREAM_ROWS.forEach((row, index) => {
    const owner = byName.get(row.ownerName) ?? users[0]!;
    const updatedAt = new Date(row.updatedAt).getTime();
    const createdAt = updatedAt - (2 + (index % 4)) * DAY;
    const fixture = getDemoWorkstreamDetail(row.id);
    const problem =
      fixture && (row.id === "demo-ws-rail" || row.id === "demo-ws-context")
        ? fixture.problemStatement
        : `${row.title}. Today this takes manual effort across teams; the aim is a small, safe change the team can measure.`;

    let ws = blankWorkstream({
      id: row.id,
      title: row.title,
      problemStatement: problem,
      ownerId: owner.id,
      now: createdAt,
      jiraKey: row.jiraKey,
      color: row.color,
      origin: "roadmap",
    });
    ws = { ...ws, priority: index < 4 ? "high" : "medium" };
    audit.push(personEvent(ws, createdAt, owner.id, "workstream_created", `Created "${ws.title}"`));

    const researchAt = createdAt + 2 * HOUR;
    const planAt = researchAt + 6 * HOUR;
    const reviewAt = planAt + 2 * HOUR;
    const architect = users.find((u) => u.role === "architect")!;
    const lead = users.find((u) => u.role === "lead")!;

    switch (row.id) {
      case "demo-ws-invite":
        break;

      case "demo-ws-trust":
      case "demo-ws-open": {
        // Scout is live: started a few seconds before the page loads.
        ws = {
          ...ws,
          stage: "research",
          research: { ...ws.research, status: "running", script: "scout", sim: newClock(now - (row.id === "demo-ws-trust" ? 3_000 : 7_500)) },
        };
        ws = simulateWorkstream(ws, now).ws;
        break;
      }

      case "demo-ws-collective": {
        ws = withFinishedResearch(ws, researchAt, audit);
        break;
      }

      case "demo-ws-coverage": {
        ws = withFinishedResearch(ws, researchAt, audit);
        const draft = draftPlanFromTemplate({ title: ws.title, problemStatement: ws.problemStatement, findings: ws.research.findings });
        ws = { ...ws, plans: [planVersion(ws.id, 1, "draft", draft.markdown, draft.steps, planAt)] };
        audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 4_200, 1_350));
        break;
      }

      case "demo-ws-weekly": {
        ws = withFinishedResearch(ws, researchAt, audit);
        const draft = draftPlanFromTemplate({ title: ws.title, problemStatement: ws.problemStatement, findings: ws.research.findings });
        const plan = planVersion(ws.id, 1, "in_review", draft.markdown, draft.steps, planAt, {
          comments: [
            comment(`${ws.id}-c1`, lead.id, "Keep the note to two numbers and one sentence.", "Measure and report", reviewAt + HOUR),
            comment(`${ws.id}-c2`, architect.id, "Which flag service does step 2 use? Name it in the plan.", "flag", reviewAt + 2 * HOUR),
          ],
        });
        ws = { ...ws, plans: [plan] };
        audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 4_100, 1_300));
        audit.push(personEvent(ws, reviewAt, owner.id, "request_review", "Requested review of plan v1"));
        audit.push(personEvent(ws, reviewAt + HOUR, lead.id, "comment", "Commented: Keep the note to two numbers and one sentence."));
        audit.push(personEvent(ws, reviewAt + 2 * HOUR, architect.id, "comment", "Commented: Which flag service does step 2 use?"));
        break;
      }

      case "demo-ws-context": {
        ws = withFinishedResearch(ws, researchAt, audit);
        if (fixture) {
          ws = {
            ...ws,
            research: {
              ...ws.research,
              steps: [...fixture.researchSteps, ...ws.research.steps].slice(0, 5),
              sources: fixture.sources,
              findings: fixture.researchSummary,
            },
          };
          const steps: PlannedStep[] = fixture.plan.steps.map((s) => ({
            order: s.order,
            title: s.title,
            description: s.description,
            filesLikelyTouched: s.filesLikelyTouched,
            testsToAdd: s.testsToAdd,
            riskLevel: s.riskLevel,
            needsConfirmation: false,
          }));
          const v1 = planVersion(ws.id, 1, "superseded", fixture.plan.markdownBody, steps, planAt);
          const v2 = planVersion(ws.id, 2, "in_review", fixture.plan.markdownBody, steps, planAt + 8 * HOUR, {
            comments: fixture.plan.comments.map((c) =>
              comment(`${ws.id}-${c.id}`, c.author.id, c.body, c.anchorText, new Date(c.createdAt).getTime()),
            ),
          });
          ws = { ...ws, plans: [v1, v2] };
          audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 4_400, 1_420));
          audit.push(modelCall(ws, planAt + 8 * HOUR, "Planner", "Drafted plan v2 from review comments", 5_600, 1_510));
          for (const c of fixture.plan.comments) {
            audit.push(personEvent(ws, new Date(c.createdAt).getTime(), c.author.id, "comment", `Commented: ${c.body}`));
          }
        }
        break;
      }

      case "demo-ws-rail":
      case "demo-ws-repair": {
        ws = withFinishedResearch(ws, researchAt, audit);
        const draft = fixture && row.id === "demo-ws-rail"
          ? {
              markdown: fixture.plan.markdownBody,
              steps: fixture.plan.steps.map((s) => ({
                order: s.order,
                title: s.title,
                description: s.description,
                filesLikelyTouched: s.filesLikelyTouched.length ? s.filesLikelyTouched : ["packages/mcp/src/tools/index.ts"],
                testsToAdd: s.testsToAdd,
                riskLevel: s.riskLevel,
                needsConfirmation: false,
              })),
            }
          : draftPlanFromTemplate({ title: ws.title, problemStatement: ws.problemStatement, findings: ws.research.findings });
        const approvedAt = reviewAt + 5 * HOUR;
        const plan = planVersion(ws.id, 1, "approved", draft.markdown, draft.steps, planAt, {
          approvals: [{ userId: architect.id, at: approvedAt }],
        });
        ws = { ...ws, plans: [plan], stage: "approved" };
        audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 4_000, 1_280));
        audit.push(personEvent(ws, reviewAt, owner.id, "request_review", "Requested review of plan v1"));
        audit.push(personEvent(ws, approvedAt, architect.id, "approval", "Approved plan v1"));

        const handOffAt = row.id === "demo-ws-rail" ? approvedAt + HOUR : now - 5_000;
        audit.push({ ...personEvent(ws, handOffAt, owner.id, "hand_off", "Handed off to the Runner (default profile)"), modelId: "claude-opus-5-5" });
        ws = {
          ...ws,
          stage: "building",
          runner: {
            id: `${ws.id}-runner`,
            status: "provisioning",
            model: "claude-opus-5-5",
            profile: "default",
            context: "",
            branch: `relay/${(ws.jiraKey ?? "ws").toLowerCase()}-pilot`,
            startedAt: handOffAt,
            log: [],
            question: null,
            questionOverride:
              row.id === "demo-ws-rail" && fixture?.openQuestion
                ? { text: fixture.openQuestion, options: ["Regular savings", "Model rebalance", "Ask the architect"] }
                : null,
            pr: null,
            sim: newClock(handOffAt),
          },
        };
        // Rail replays to its question and pauses; Repair is mid step 1 and keeps going live.
        const result = simulateWorkstream(ws, row.id === "demo-ws-rail" ? handOffAt + 30 * 60_000 : now);
        ws = result.ws;
        audit.push(...result.audit);
        break;
      }

      case "demo-ws-standards": {
        ws = withFinishedResearch(ws, researchAt, audit);
        const draft = draftPlanFromTemplate({ title: ws.title, problemStatement: ws.problemStatement, findings: ws.research.findings });
        const plan = planVersion(ws.id, 1, "approved", draft.markdown, draft.steps, planAt, {
          approvals: [{ userId: architect.id, at: reviewAt + 3 * HOUR }],
        });
        const buildAt = reviewAt + 4 * HOUR;
        ws = {
          ...ws,
          plans: [{ ...plan, steps: plan.steps.map((s) => ({ ...s, completed: true })) }],
          runner: {
            id: `${ws.id}-runner`,
            status: "merged",
            model: "claude-opus-5-5",
            profile: "careful",
            context: "",
            branch: "relay/inno-314-agent-fields",
            startedAt: buildAt,
            log: [...runnerLog(ws, buildAt, plan.steps.length), { at: updatedAt, text: "Merged pull request #212", kind: "pr" }],
            question: null,
            questionOverride: null,
            pr: { number: 212, checks: "passed", openedAt: buildAt + 2 * HOUR },
            sim: null,
          },
        };
        audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 3_900, 1_200));
        audit.push(personEvent(ws, reviewAt + 3 * HOUR, architect.id, "approval", "Approved plan v1"));
        audit.push(personEvent(ws, buildAt, owner.id, "hand_off", "Handed off to the Runner (careful profile)"));
        plan.steps.forEach((s, i) => audit.push(modelCall(ws, buildAt + (i + 1) * 20 * 60_000, "Runner", `Completed step ${i + 1}: ${s.title}`, 2_600, 950)));
        audit.push(personEvent(ws, updatedAt, owner.id, "merge", "Merged pull request #212"));
        break;
      }

      default:
        ws = withFinishedResearch(ws, researchAt, audit);
    }

    if (row.id !== "demo-ws-trust" && row.id !== "demo-ws-open" && row.id !== "demo-ws-repair" && row.id !== "demo-ws-rail") {
      ws = { ...ws, stage: row.stage, stageHistory: history(row.stage, createdAt, updatedAt) };
    } else {
      ws = { ...ws, stageHistory: history(ws.stage, createdAt, Math.min(updatedAt, now)) };
    }
    ws = { ...ws, lastActivityAt: Math.max(ws.lastActivityAt, updatedAt) };
    add(ws);
  });

  for (const h of HISTORICAL) {
    const created = now - h.createdDaysAgo * DAY;
    const merged = now - h.mergedDaysAgo * DAY;
    let ws = blankWorkstream({
      id: h.id,
      title: h.title,
      problemStatement: `${h.title}. Small internal improvement shipped through Relay.`,
      ownerId: h.owner,
      now: created,
      jiraKey: h.jiraKey,
      color: h.color,
    });
    ws = withFinishedResearch(ws, created + 3 * HOUR, audit);
    const draft = draftPlanFromTemplate({ title: ws.title, problemStatement: ws.problemStatement, findings: ws.research.findings });
    const planAt = created + 10 * HOUR;
    const approvedAt = created + (merged - created) * 0.45;
    const buildAt = approvedAt + 2 * HOUR;
    const architect = users.find((u) => u.role === "architect")!;
    const prNumber = 180 + h.createdDaysAgo;
    ws = {
      ...ws,
      plans: [
        planVersion(ws.id, 1, "approved", draft.markdown, draft.steps, planAt, {
          approvals: [{ userId: architect.id, at: approvedAt }],
        }),
      ].map((p) => ({ ...p, steps: p.steps.map((s) => ({ ...s, completed: true })) })),
      runner: {
        id: `${ws.id}-runner`,
        status: "merged",
        model: "claude-opus-5-5",
        profile: "default",
        context: "",
        branch: `relay/${h.jiraKey.toLowerCase()}`,
        startedAt: buildAt,
        log: [...runnerLog(ws, buildAt, draft.steps.length), { at: merged, text: `Merged pull request #${prNumber}`, kind: "pr" }],
        question: null,
        questionOverride: null,
        pr: { number: prNumber, checks: "passed", openedAt: buildAt + 3 * HOUR },
        sim: null,
      },
      stage: "merged",
      stageHistory: history("merged", created, merged),
      lastActivityAt: merged,
      tokens: { input: ws.tokens.input + 16_000, output: ws.tokens.output + 5_200 },
    };
    audit.push(personEvent(ws, created, h.owner, "workstream_created", `Created "${ws.title}"`));
    audit.push(modelCall(ws, planAt, "Planner", "Drafted plan v1", 4_000, 1_250));
    audit.push(personEvent(ws, approvedAt, architect.id, "approval", "Approved plan v1"));
    audit.push(personEvent(ws, buildAt, h.owner, "hand_off", "Handed off to the Runner (default profile)"));
    draft.steps.forEach((s, i) =>
      audit.push(modelCall(ws, buildAt + (i + 1) * 40 * 60_000, "Runner", `Completed step ${i + 1}: ${s.title}`, 2_500 + i * 400, 880)),
    );
    audit.push(personEvent(ws, merged, h.owner, "merge", `Merged pull request #${prNumber}`));
    add(ws);
  }

  const ideasData = getDemoIdeasData();
  const ideas: Idea[] = ideasData.items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    status: i.status,
    frequencyPerWeek: i.frequencyPerWeek,
    minutesLostEach: i.minutesLostEach,
    submittedById: byName.get(i.submittedByName)?.id ?? users[0]!.id,
    workstreamId: i.workstreamId,
    createdAt: new Date(i.createdAt).getTime(),
  }));

  const rows = audit
    .filter((a) => a.at <= now)
    .sort((a, b) => b.at - a.at)
    .map((a, i) => ({ ...a, id: `seed-${i}` }));

  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    seededAt: now,
    speed: 1,
    currentUserId: users[0]!.id,
    users,
    workstreams,
    order,
    ideas,
    audit: rows,
    ui: { heroCollapsed: {}, tour: null, tourPromptDismissed: false },
  };
}
