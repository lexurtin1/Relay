import type { User, UserRole, WorkstreamStage } from "@prisma/client";
import type {
  AgentRunningItem,
  NeedsActionItem,
  OverviewStats,
  WorkstreamRowRow,
} from "@/lib/overview";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
const daysAgo = (d: number) => new Date(now - d * 86_400_000);

export const DEMO_USERS: User[] = [
  {
    id: "demo-alex",
    name: "Alex Curtin",
    email: "alex.curtin@example-calastone.invalid",
    role: "engineer" as UserRole,
    team: "Innovation and Strategy",
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(1),
  },
  {
    id: "demo-owen",
    name: "Owen Blake",
    email: "owen.blake@example-calastone.invalid",
    role: "engineer" as UserRole,
    team: "Innovation and Strategy",
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(3),
  },
  {
    id: "demo-aisha",
    name: "Aisha Rahman",
    email: "aisha.rahman@example-calastone.invalid",
    role: "architect" as UserRole,
    team: "Innovation and Strategy",
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(2),
  },
  {
    id: "demo-leon",
    name: "Leon Okonkwo",
    email: "leon.okonkwo@example-calastone.invalid",
    role: "lead" as UserRole,
    team: "Innovation and Strategy",
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(5),
  },
  {
    id: "demo-vera",
    name: "Vera Nilsen",
    email: "vera.nilsen@example-calastone.invalid",
    role: "viewer" as UserRole,
    team: "Innovation and Strategy",
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(8),
  },
];

export const DEMO_WORKSTREAM_ROWS: WorkstreamRowRow[] = [
  {
    id: "demo-ws-isin",
    title: "Add ISIN validation tool to the Calastone MCP server",
    jiraKey: "INNO-214",
    ownerName: "Alex Curtin",
    ownerInitials: "AC",
    stage: "in_review" as WorkstreamStage,
    stepperIndex: 2,
    progressLabel: "Plan v2, 3 comments",
    progressTone: "waiting",
    updatedAt: hoursAgo(2).toISOString(),
  },
  {
    id: "demo-ws-nav",
    title: "NAV reconciliation exception classifier",
    jiraKey: "INNO-201",
    ownerName: "Owen Blake",
    ownerInitials: "OB",
    stage: "awaiting_input" as WorkstreamStage,
    stepperIndex: 3,
    progressLabel: "Paused, waiting on you",
    progressTone: "waiting",
    updatedAt: hoursAgo(1).toISOString(),
  },
  {
    id: "demo-ws-fx",
    title: "FX cut-off calendar sync for order routing",
    jiraKey: "INNO-188",
    ownerName: "Alex Curtin",
    ownerInitials: "AC",
    stage: "research" as WorkstreamStage,
    stepperIndex: 0,
    progressLabel: "Scout researching",
    progressTone: "active",
    updatedAt: hoursAgo(4).toISOString(),
  },
  {
    id: "demo-ws-audit",
    title: "Audit export for Relay plan approvals",
    jiraKey: "INNO-176",
    ownerName: "Aisha Rahman",
    ownerInitials: "AR",
    stage: "pr_open" as WorkstreamStage,
    stepperIndex: 4,
    progressLabel: "PR open, checks running",
    progressTone: "done",
    updatedAt: hoursAgo(6).toISOString(),
  },
  {
    id: "demo-ws-kill",
    title: "Legacy CSV settlement uploader",
    jiraKey: "INNO-155",
    ownerName: "Leon Okonkwo",
    ownerInitials: "LO",
    stage: "merged" as WorkstreamStage,
    stepperIndex: 4,
    progressLabel: "Merged",
    progressTone: "done",
    updatedAt: daysAgo(2).toISOString(),
  },
];

let DEMO_STATS: OverviewStats = {
  allActive: 4,
  research: 1,
  inReview: 1,
  building: 1,
  pullRequest: 1,
  mergedThisWeek: 1,
};

/** In-memory audit trail for demo / Vercel prototype mode. */
export const DEMO_AUDIT: Array<{
  id: string;
  action: string;
  workstreamId: string | null;
  detail: string | null;
  userId: string | null;
  at: string;
}> = [];

let DEMO_NEEDS: NeedsActionItem[] = [
  {
    id: "demo-ws-nav-q",
    jiraKey: "INNO-201",
    title: "NAV reconciliation exception classifier",
    kind: "question",
    summary: "Runner paused at step 2 of 4",
    detail:
      "Should threshold breaches use the existing Power BI semantic model labels, or a new enum in the MCP tool response?",
    options: ["Reuse Power BI labels", "New MCP enum", "Ask architect"],
    actionLabel: "Write an answer",
    createdAt: hoursAgo(1).toISOString(),
  },
  {
    id: "demo-ws-isin-c",
    jiraKey: "INNO-214",
    title: "Add ISIN validation tool to the Calastone MCP server",
    kind: "comments",
    summary: "Plan v2 · 3 open comments, architect approval needed",
    detail: null,
    options: [],
    actionLabel: "Review plan",
    createdAt: hoursAgo(2).toISOString(),
  },
];

let DEMO_AGENTS: AgentRunningItem[] = [
  {
    id: "demo-runner-nav",
    workstreamId: "demo-ws-nav",
    kind: "Runner",
    jiraKey: "INNO-201",
    title: "NAV reconciliation exception classifier",
    statusLine: "Paused for human input",
    stepsCompleted: 2,
    stepsTotal: 4,
    startedAt: hoursAgo(3).toISOString(),
  },
  {
    id: "demo-scout-fx",
    workstreamId: "demo-ws-fx",
    kind: "Scout",
    jiraKey: "INNO-188",
    title: "FX cut-off calendar sync for order routing",
    statusLine: "4 sources read: confluence, jira, github",
    stepsCompleted: 0,
    stepsTotal: 0,
    startedAt: hoursAgo(4).toISOString(),
  },
];

export function getDemoOverviewData() {
  return {
    stats: DEMO_STATS,
    needsAction: [...DEMO_NEEDS],
    agentsRunning: [...DEMO_AGENTS],
    rows: [...DEMO_WORKSTREAM_ROWS],
    agentsActive: DEMO_AGENTS.length,
    workstreamCount: DEMO_WORKSTREAM_ROWS.length,
    commandItems: DEMO_WORKSTREAM_ROWS.map((w) => ({
      id: w.id,
      title: w.title,
      jiraKey: w.jiraKey,
      stage: w.stage,
    })),
  };
}

function pushDemoAudit(
  action: string,
  workstreamId: string | null,
  detail: string,
  userId: string | null,
) {
  DEMO_AUDIT.unshift({
    id: `audit-${DEMO_AUDIT.length + 1}`,
    action,
    workstreamId,
    detail,
    userId,
    at: new Date().toISOString(),
  });
}

function refreshDemoStats() {
  DEMO_STATS = {
    allActive: DEMO_WORKSTREAM_ROWS.filter((w) => w.stage !== "merged" && w.stage !== "killed")
      .length,
    research: DEMO_WORKSTREAM_ROWS.filter((w) => w.stage === "research").length,
    inReview: DEMO_WORKSTREAM_ROWS.filter((w) => w.stage === "in_review").length,
    building: DEMO_WORKSTREAM_ROWS.filter(
      (w) => w.stage === "building" || w.stage === "awaiting_input",
    ).length,
    pullRequest: DEMO_WORKSTREAM_ROWS.filter((w) => w.stage === "pr_open").length,
    mergedThisWeek: DEMO_WORKSTREAM_ROWS.filter((w) => w.stage === "merged").length,
  };
}

/** Prototype mutators for demo fixtures (no Postgres). */
export function demoAnswerQuestion(
  needsId: string,
  option: string,
  userId: string,
): { ok: true } | { ok: false; error: string } {
  const idx = DEMO_NEEDS.findIndex((n) => n.id === needsId && n.kind === "question");
  if (idx < 0) return { ok: false, error: "Question not found." };
  const item = DEMO_NEEDS[idx]!;
  const wsId = needsId.replace(/-q$/, "");
  DEMO_NEEDS = DEMO_NEEDS.filter((_, i) => i !== idx);
  const row = DEMO_WORKSTREAM_ROWS.find((w) => w.id === wsId);
  if (row) {
    row.stage = "building" as WorkstreamStage;
    row.stepperIndex = 3;
    row.progressLabel = "Runner resumed";
    row.progressTone = "active";
    row.updatedAt = new Date().toISOString();
  }
  DEMO_AGENTS = DEMO_AGENTS.map((a) =>
    a.workstreamId === wsId
      ? { ...a, statusLine: `Answered: ${option}`, kind: "Runner" as const }
      : a,
  );
  pushDemoAudit("hand_off", wsId, `Answered question: ${option}`, userId);
  refreshDemoStats();
  void item;
  return { ok: true };
}

export function demoSetWorkstreamStage(
  workstreamId: string,
  stage: WorkstreamStage,
  userId: string,
  auditAction: string,
  detail: string,
  opts?: { resolveComments?: boolean },
): { ok: true } | { ok: false; error: string } {
  const row = DEMO_WORKSTREAM_ROWS.find((w) => w.id === workstreamId);
  if (!row) return { ok: false, error: "Workstream not found." };
  row.stage = stage;
  row.stepperIndex = mapStageIndex(stage);
  row.updatedAt = new Date().toISOString();
  if (stage === "planning") {
    row.progressLabel = "Revising plan";
    row.progressTone = "active";
  } else if (stage === "in_review") {
    row.progressLabel = opts?.resolveComments ? "Plan in review" : row.progressLabel;
    row.progressTone = "waiting";
  } else if (stage === "approved") {
    row.progressLabel = "Approved";
    row.progressTone = "done";
    DEMO_NEEDS = DEMO_NEEDS.filter((n) => n.id !== `${workstreamId}-c`);
  } else if (stage === "building") {
    row.progressLabel = "Runner starting";
    row.progressTone = "active";
  }
  if (opts?.resolveComments) {
    DEMO_NEEDS = DEMO_NEEDS.filter((n) => n.id !== `${workstreamId}-c`);
    const detailState = demoDetailState.get(workstreamId) ?? {
      commentsResolved: false,
      planVersion: 2,
    };
    detailState.commentsResolved = true;
    detailState.planVersion += 1;
    demoDetailState.set(workstreamId, detailState);
  }
  pushDemoAudit(auditAction, workstreamId, detail, userId);
  refreshDemoStats();
  return { ok: true };
}

const demoDetailState = new Map<string, { commentsResolved: boolean; planVersion: number }>();

function mapStageIndex(stage: WorkstreamStage): number {
  switch (stage) {
    case "idea":
    case "research":
      return 0;
    case "planning":
      return 1;
    case "in_review":
    case "approved":
      return 2;
    case "building":
    case "awaiting_input":
      return 3;
    default:
      return 4;
  }
}

export function getDemoUser(userId?: string | null): User {
  if (userId) {
    const match = DEMO_USERS.find((u) => u.id === userId);
    if (match) return match;
  }
  return DEMO_USERS[0]!;
}

export function listDemoFixtureUsers(): User[] {
  return [...DEMO_USERS].sort((a, b) => a.name.localeCompare(b.name));
}

export function getDemoWorkstreamDetail(id: string) {
  const row = DEMO_WORKSTREAM_ROWS.find((w) => w.id === id);
  if (!row) return null;

  const owner =
    DEMO_USERS.find((u) => u.name === row.ownerName) ?? DEMO_USERS[0]!;

  const planMarkdown = `# Plan: ISIN validation tool

## Goal
Expose a shared ISIN validation tool on the Calastone MCP server so engineers stop re-implementing checks.

## Steps
1. Add ISIN helper with ISO 6166 check digit
2. Register MCP tool with typed error codes
3. Add unit tests and a thin integration smoke test
4. Document usage in Confluence

## Risks
- **medium** - existing callers expect different error shapes
- **low** - check-digit edge cases for CUSIP-mapped ISINs
`;

  const state = demoDetailState.get(id) ?? {
    commentsResolved: false,
    planVersion: 2,
  };
  demoDetailState.set(id, state);

  const planStatus =
    row.stage === "approved" || row.stage === "building"
      ? ("approved" as const)
      : row.stage === "planning"
        ? ("draft" as const)
        : ("in_review" as const);

  const comments = state.commentsResolved
    ? []
    : [
        {
          id: "c1",
          body: "Please keep error codes stable for existing order-routing callers.",
          resolved: false,
          createdAt: hoursAgo(3).toISOString(),
          anchorText: "typed error codes",
          author: DEMO_USERS[2]!,
        },
        {
          id: "c2",
          body: "Add an explicit test for lowercase input normalisation.",
          resolved: false,
          createdAt: hoursAgo(2).toISOString(),
          anchorText: "unit tests",
          author: DEMO_USERS[2]!,
        },
        {
          id: "c3",
          body: "Link the Confluence page from the tool description.",
          resolved: false,
          createdAt: hoursAgo(2).toISOString(),
          anchorText: "Document usage",
          author: DEMO_USERS[3]!,
        },
      ];

  return {
    id: row.id,
    title: row.title,
    jiraKey: row.jiraKey,
    stage: row.stage,
    origin: "internal_friction" as const,
    priority: "high" as const,
    problemStatement:
      "Engineers repeatedly re-implement ISIN checks across tools. Expose a shared validation tool on the fictional Calastone MCP server with clear error codes.",
    owner,
    ownerId: owner.id,
    plan: {
      id: `${row.id}-plan-v${state.planVersion}`,
      versionNumber: state.planVersion,
      status: planStatus,
      markdownBody: planMarkdown,
      steps: [
        {
          id: "s1",
          order: 1,
          title: "Add ISIN helper",
          description: "Create a shared validator module with check-digit support.",
          filesLikelyTouched: ["packages/mcp/src/isin.ts"],
          testsToAdd: ["isin.test.ts"],
          riskLevel: "low" as const,
          completed: true,
        },
        {
          id: "s2",
          order: 2,
          title: "Register MCP tool",
          description: "Wire validate_isin with structured error codes.",
          filesLikelyTouched: ["packages/mcp/src/tools/isin.ts"],
          testsToAdd: ["tools.isin.test.ts"],
          riskLevel: "medium" as const,
          completed: false,
        },
        {
          id: "s3",
          order: 3,
          title: "Add tests and docs",
          description: "Cover edge cases and publish Confluence usage notes.",
          filesLikelyTouched: ["docs/isin-tool.md"],
          testsToAdd: [],
          riskLevel: "low" as const,
          completed: false,
        },
      ],
      comments,
    },
    sources: [
      {
        connector: "confluence",
        title: "ISIN handling in order routing",
        itemId: "conf-isin",
      },
      {
        connector: "confluence",
        title: "MCP server tool conventions",
        itemId: "conf-mcp",
      },
      { connector: "jira", title: "INNO-198 duplicate ISIN logic", itemId: "INNO-198" },
      { connector: "github", title: "packages/mcp/src/tools", itemId: "gh-tools" },
    ],
    history: [
      {
        id: "h1",
        label: "Research completed",
        at: hoursAgo(20).toISOString(),
      },
      {
        id: "h2",
        label: "Plan v1 generated",
        at: hoursAgo(12).toISOString(),
      },
      {
        id: "h3",
        label: "Plan v2 generated from comments",
        at: hoursAgo(4).toISOString(),
      },
    ],
    researchSummary:
      "Scout found duplicated ISIN regexes in three services and a Confluence convention for MCP tool error envelopes. Recommend a shared helper plus stable error codes.",
    openQuestion:
      row.id === "demo-ws-nav"
        ? "Should threshold breaches use the existing Power BI semantic model labels, or a new enum in the MCP tool response?"
        : null,
  };
}
