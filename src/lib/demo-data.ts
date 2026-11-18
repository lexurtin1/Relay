import type { User, UserRole, WorkstreamStage } from "@prisma/client";
import {
  WORKSTREAM_COLOURS,
  resolveWorkstreamColour,
} from "@relay/core";
import type {
  AgentRunningItem,
  NeedsActionItem,
  OverviewStats,
  WorkstreamRowRow,
} from "@/lib/overview";
import type { IdeaBoardItem, IdeaWorkstreamOption } from "@/lib/ideas";
import type { ResearchStepView } from "@/components/research-activity";

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
    id: "demo-ws-context",
    title: "Ship read-side MCP tools for design partners",
    jiraKey: "INNO-310",
    ownerName: "Alex Curtin",
    ownerInitials: "AC",
    stage: "in_review" as WorkstreamStage,
    stepperIndex: 2,
    progressLabel: "Plan v2, 3 comments",
    progressTone: "waiting",
    updatedAt: hoursAgo(2).toISOString(),
    color: WORKSTREAM_COLOURS.context,
  },
  {
    id: "demo-ws-rail",
    title: "Run one human-approved agent order pilot",
    jiraKey: "INNO-311",
    ownerName: "Owen Blake",
    ownerInitials: "OB",
    stage: "awaiting_input" as WorkstreamStage,
    stepperIndex: 3,
    progressLabel: "Paused, waiting on you",
    progressTone: "waiting",
    updatedAt: hoursAgo(1).toISOString(),
    color: WORKSTREAM_COLOURS.rail,
  },
  {
    id: "demo-ws-trust",
    title: "Stand up agent registry with scopes and audit",
    jiraKey: "INNO-312",
    ownerName: "Alex Curtin",
    ownerInitials: "AC",
    stage: "research" as WorkstreamStage,
    stepperIndex: 0,
    progressLabel: "Scout researching",
    progressTone: "active",
    updatedAt: hoursAgo(4).toISOString(),
    color: WORKSTREAM_COLOURS.trust,
  },
  {
    id: "demo-ws-collective",
    title: "Predict settlement fails with partner consent",
    jiraKey: "INNO-313",
    ownerName: "Aisha Rahman",
    ownerInitials: "AR",
    stage: "planning" as WorkstreamStage,
    stepperIndex: 1,
    progressLabel: "Findings ready",
    progressTone: "neutral",
    updatedAt: hoursAgo(6).toISOString(),
    color: WORKSTREAM_COLOURS.collective,
  },
  {
    id: "demo-ws-standards",
    title: "Draft agent fields for UKFMPG change request",
    jiraKey: "INNO-314",
    ownerName: "Leon Okonkwo",
    ownerInitials: "LO",
    stage: "merged" as WorkstreamStage,
    stepperIndex: 4,
    progressLabel: "Merged",
    progressTone: "done",
    updatedAt: daysAgo(2).toISOString(),
    color: WORKSTREAM_COLOURS.standards,
  },
];

const DEMO_STATS: OverviewStats = {
  allActive: 4,
  research: 1,
  inReview: 1,
  building: 1,
  pullRequest: 0,
  mergedThisWeek: 1,
};

const DEMO_NEEDS: NeedsActionItem[] = [
  {
    id: "demo-ws-rail-q",
    jiraKey: "INNO-311",
    title: "Run one human-approved agent order pilot",
    kind: "question",
    summary: "Runner paused at step 2 of 3",
    detail:
      "Should the first write pilot be a regular savings run or a model portfolio rebalance?",
    options: ["Regular savings", "Model rebalance", "Ask architect"],
    actionLabel: "Write an answer",
    createdAt: hoursAgo(1).toISOString(),
    color: WORKSTREAM_COLOURS.rail,
  },
  {
    id: "demo-ws-context-c",
    jiraKey: "INNO-310",
    title: "Ship read-side MCP tools for design partners",
    kind: "comments",
    summary: "Plan v2 · 3 open comments, architect approval needed",
    detail: null,
    options: [],
    actionLabel: "Review plan",
    createdAt: hoursAgo(2).toISOString(),
    color: WORKSTREAM_COLOURS.context,
  },
];

const DEMO_AGENTS: AgentRunningItem[] = [
  {
    id: "demo-runner-rail",
    workstreamId: "demo-ws-rail",
    kind: "Runner",
    jiraKey: "INNO-311",
    title: "Run one human-approved agent order pilot",
    statusLine: "Paused for human input",
    stepsCompleted: 2,
    stepsTotal: 3,
    startedAt: hoursAgo(3).toISOString(),
  },
  {
    id: "demo-scout-trust",
    workstreamId: "demo-ws-trust",
    kind: "Scout",
    jiraKey: "INNO-312",
    title: "Stand up agent registry with scopes and audit",
    statusLine: "3 sources read: confluence, jira, datadog",
    stepsCompleted: 0,
    stepsTotal: 0,
    startedAt: hoursAgo(4).toISOString(),
  },
];

export function getDemoOverviewData() {
  return {
    stats: DEMO_STATS,
    needsAction: DEMO_NEEDS,
    agentsRunning: DEMO_AGENTS,
    rows: DEMO_WORKSTREAM_ROWS,
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

const DEMO_IDEA_WORKSTREAMS: IdeaWorkstreamOption[] = DEMO_WORKSTREAM_ROWS.map(
  (row) => ({
    id: row.id,
    title: row.title,
    color: row.color,
  }),
);

const DEMO_IDEAS: IdeaBoardItem[] = [
  {
    id: "demo-idea-1",
    title: "Publish dealing rules as MCP tools",
    description:
      "Orderability, cut-offs, frequency, minimums and settlement by link. Read-only first for design partners.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 12,
    minutesLostEach: 15,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Ship read-side MCP tools for design partners",
    color: WORKSTREAM_COLOURS.context,
    createdAt: daysAgo(5).toISOString(),
  },
  {
    id: "demo-idea-2",
    title: "Use Relay as first MCP client",
    description:
      "Point Scout and Knowledge at the same connectors as the company chatbot so the strategy is dogfooded internally.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Ship read-side MCP tools for design partners",
    color: WORKSTREAM_COLOURS.context,
    createdAt: daysAgo(4).toISOString(),
  },
  {
    id: "demo-idea-3",
    title: "Pilot regular savings with human approval",
    description:
      "Low-risk write path. Every order approved by a named person. Measure rejects avoided.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 5,
    minutesLostEach: 25,
    submittedByName: "Owen Blake",
    workstreamId: "demo-ws-rail",
    workstreamTitle: "Run one human-approved agent order pilot",
    color: WORKSTREAM_COLOURS.rail,
    createdAt: daysAgo(4).toISOString(),
  },
  {
    id: "demo-idea-4",
    title: "Register agents under participant identity",
    description:
      "Registry lists each agent, owner participant, endpoint and scopes. No consumer chatbot IDs.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-trust",
    workstreamTitle: "Stand up agent registry with scopes and audit",
    color: WORKSTREAM_COLOURS.trust,
    createdAt: daysAgo(3).toISOString(),
  },
  {
    id: "demo-idea-5",
    title: "Score orders for fail or late settlement",
    description:
      "Network model with partner consent. Ties to UK and EU T+1 pressure in 2027.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: "demo-ws-collective",
    workstreamTitle: "Predict settlement fails with partner consent",
    color: WORKSTREAM_COLOURS.collective,
    createdAt: daysAgo(3).toISOString(),
  },
  {
    id: "demo-idea-6",
    title: "Draft agent ID fields for UKFMPG",
    description:
      "Optional initiating agent ID and mandate reference in fund order messages.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-standards",
    workstreamTitle: "Draft agent fields for UKFMPG change request",
    color: WORKSTREAM_COLOURS.standards,
    createdAt: daysAgo(6).toISOString(),
  },
  {
    id: "demo-idea-7",
    title: "Join Agentic AI Foundation working item",
    description:
      "Propose a financial services item and contribute the fund dealing profile.",
    type: "external_signal",
    status: "triaged",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: daysAgo(2).toISOString(),
  },
  {
    id: "demo-idea-8",
    title: "Meet FCA AI Lab on fund dealing trust",
    description:
      "Extend Know Your Agent conversations from payments into fund dealing with Calastone as industry pilot.",
    type: "external_signal",
    status: "triaged",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Vera Nilsen",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: daysAgo(2).toISOString(),
  },
  {
    id: "demo-idea-9",
    title: "Segment views instead of named distributors",
    description:
      "Safer Data Insights design until distributors opt in. Avoid green-space leaks.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: 3,
    minutesLostEach: 30,
    submittedByName: "Alex Curtin",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: daysAgo(1).toISOString(),
  },
  {
    id: "demo-idea-10",
    title: "Scope FE fundinfo for peer comparison",
    description:
      "Layer 2 needs licensed fund data Calastone does not hold. Pitch flows plus FE, not against data vendors.",
    type: "external_signal",
    status: "new",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: hoursAgo(20).toISOString(),
  },
  {
    id: "demo-idea-11",
    title: "Show managers repair cost avoided",
    description:
      "Counter higher agent message volume with a clear saving report per fund manager.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: 1,
    minutesLostEach: 60,
    submittedByName: "Leon Okonkwo",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: hoursAgo(12).toISOString(),
  },
  {
    id: "demo-idea-12",
    title: "Park named-distributor wallet share",
    description:
      "Needs distributor opt-in. Park until legal review of green space and consent is done.",
    type: "external_signal",
    status: "parked",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: null,
    workstreamTitle: null,
    color: WORKSTREAM_COLOURS.neutral,
    createdAt: daysAgo(7).toISOString(),
  },
];

export function getDemoIdeasData() {
  return {
    items: DEMO_IDEAS,
    workstreamOptions: DEMO_IDEA_WORKSTREAMS,
  };
}

function demoResearchSteps(id: string): {
  steps: ResearchStepView[];
  liveToolsLine: string | null;
} {
  if (id === "demo-ws-trust" || id === "demo-ws-context") {
    return {
      steps: [
        {
          id: `${id}-r1`,
          title:
            id === "demo-ws-trust"
              ? "Researching agent registry patterns and fund dealing scopes"
              : "Researching dealing rules across Confluence and Jira",
          rationale: "Pulling shared MCP connectors used by the company chatbot.",
          disclosureLabel: "Searching connectors",
          disclosureDetail: "confluence.search · jira.search",
        },
        {
          id: `${id}-r2`,
          title:
            id === "demo-ws-trust"
              ? "Interpreting mandate and kill-switch requirements"
              : "Interpreting order status and exception tools for partner pilots",
          rationale: "Mapping findings into a buildable plan for the workstream.",
          disclosureLabel: "Read files",
          disclosureDetail:
            id === "demo-ws-trust"
              ? "Agent registry and scopes (draft)"
              : "Dealing rules MCP tools (draft)",
        },
      ],
      liveToolsLine:
        id === "demo-ws-trust"
          ? "confluence.search… jira.search"
          : "confluence.search… datadog.get_dashboard",
    };
  }
  return { steps: [], liveToolsLine: null };
}

export function getDemoWorkstreamDetail(id: string) {
  const row = DEMO_WORKSTREAM_ROWS.find((w) => w.id === id);
  if (!row) return null;

  const owner =
    DEMO_USERS.find((u) => u.name === row.ownerName) ?? DEMO_USERS[0]!;
  const color = resolveWorkstreamColour(row.color);
  const { steps: researchSteps, liveToolsLine } = demoResearchSteps(id);

  const planMarkdown =
    id === "demo-ws-rail"
      ? `# Plan: Human-approved write pilot

## Goal
Start with ops agents and one low-risk write flow.

## Steps
1. Pick regular savings or model rebalance
2. Require human approval on every order
3. Measure pre-trade rejects avoided and repair time saved
`
      : `# Plan: Context layer MCP for design partners

## Goal
Give platforms and ops agents trustworthy read tools before any write pilot.

## Steps
1. Publish dealing-rules, order-status and exception tools on the shared MCP server
2. Point Relay Scout at the same connectors as the chatbot
3. Agree fair-use limits and a free flow statement for two fund managers
4. Document coverage definition before any client demo
`;

  const planStatus =
    id === "demo-ws-rail" || id === "demo-ws-standards"
      ? ("approved" as const)
      : ("in_review" as const);

  return {
    id: row.id,
    title: row.title,
    jiraKey: row.jiraKey,
    stage: row.stage,
    origin: "roadmap" as const,
    priority: "high" as const,
    color,
    canHandOff: planStatus === "approved",
    problemStatement:
      id === "demo-ws-rail"
        ? "Start with ops agents and one low-risk write flow. Every order needs human approval, throttles and a kill switch."
        : "Agents cannot act on data they cannot read. Expose dealing rules, order status and exceptions through the same MCP surface the company chatbot already uses, with Relay as a first internal client.",
    owner,
    ownerId: owner.id,
    plan: {
      id: `${row.id}-plan-v2`,
      versionNumber: 2,
      status: planStatus,
      markdownBody: planMarkdown,
      steps: [
        {
          id: "s1",
          order: 1,
          title: id === "demo-ws-rail" ? "Choose pilot flow" : "Publish core read tools",
          description:
            id === "demo-ws-rail"
              ? "Regular savings or model rebalance with design partners."
              : "Dealing rules, status, exceptions, coverage queries.",
          filesLikelyTouched: ["packages/mcp/tools"],
          testsToAdd: ["tool contract tests"],
          riskLevel: "medium" as const,
          completed: true,
        },
        {
          id: "s2",
          order: 2,
          title: id === "demo-ws-rail" ? "Wire approval gate" : "Connect Relay as internal client",
          description:
            id === "demo-ws-rail"
              ? "No agent order leaves without a named person."
              : "Scout uses the shared connector set for company context.",
          filesLikelyTouched: [],
          testsToAdd: [],
          riskLevel: "high" as const,
          completed: id === "demo-ws-rail",
        },
        {
          id: "s3",
          order: 3,
          title: id === "demo-ws-rail" ? "Measure outcomes" : "Pilot free flow statement",
          description:
            id === "demo-ws-rail"
              ? "Track rejects avoided and repair time saved."
              : "Two managers who raised cost concerns.",
          filesLikelyTouched: [],
          testsToAdd: [],
          riskLevel: "low" as const,
          completed: false,
        },
      ],
      comments:
        planStatus === "in_review"
          ? [
              {
                id: "c1",
                body: "Confirm entitlements sit in the data layer, not in prompts.",
                resolved: false,
                createdAt: hoursAgo(3).toISOString(),
                anchorText: "entitlements",
                author: DEMO_USERS[2]!,
              },
              {
                id: "c2",
                body: "Add Datadog latency dashboard to the pilot checklist.",
                resolved: false,
                createdAt: hoursAgo(2).toISOString(),
                anchorText: "Datadog",
                author: DEMO_USERS[3]!,
              },
              {
                id: "c3",
                body: "Coverage wording must match Fund Flow Index language.",
                resolved: false,
                createdAt: hoursAgo(2).toISOString(),
                anchorText: "coverage",
                author: DEMO_USERS[1]!,
              },
            ]
          : [],
    },
    sources: [
      {
        connector: "confluence",
        title:
          id === "demo-ws-trust"
            ? "Agent registry and scopes (draft)"
            : "Dealing rules MCP tools (draft)",
        itemId: "conf-1",
      },
      {
        connector: "datadog",
        title: "MCP tool latency dashboard",
        itemId: "dd-1",
      },
      { connector: "jira", title: row.jiraKey ?? "INNO ticket", itemId: row.jiraKey ?? "jira" },
      { connector: "github", title: "packages/mcp/src/tools", itemId: "gh-tools" },
    ],
    researchSteps,
    liveToolsLine,
    history: [
      {
        id: "h1",
        label: "Scout researching",
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
      "Dealing-rules draft exists in Confluence. Datadog demo dashboard covers MCP latency. Relay listed as first internal MCP client in the 90-day plan.",
    openQuestion:
      row.id === "demo-ws-rail"
        ? "Should the first write pilot be a regular savings run or a model portfolio rebalance?"
        : null,
  };
}
