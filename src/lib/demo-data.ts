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

/** Sample tickets aligned to the Calastone AI technical roadmap (five layers, five goals). */
export const DEMO_WORKSTREAM_ROWS: WorkstreamRowRow[] = [
  {
    id: "demo-ws-context",
    title: "Ship client key, governed metrics and private MCP",
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
    title: "Pilot transfer completion with two platforms",
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
    title: "Stand up consent records and identity federation",
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
    title: "Train transfer rejection prediction on history",
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
    title: "Draft agent ID and mandate fields for UKFMPG",
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
  {
    id: "demo-ws-coverage",
    title: "Pilot free flow statement with five UK managers",
    jiraKey: "INNO-315",
    ownerName: "Leon Okonkwo",
    ownerInitials: "LO",
    stage: "planning" as WorkstreamStage,
    stepperIndex: 1,
    progressLabel: "Drafting plan",
    progressTone: "neutral",
    updatedAt: hoursAgo(8).toISOString(),
    color: WORKSTREAM_COLOURS.context,
  },
  {
    id: "demo-ws-repair",
    title: "Build transfer repair suggestions for ops",
    jiraKey: "INNO-316",
    ownerName: "Alex Curtin",
    ownerInitials: "AC",
    stage: "building" as WorkstreamStage,
    stepperIndex: 3,
    progressLabel: "Runner, step 1 of 3",
    progressTone: "active",
    updatedAt: hoursAgo(3).toISOString(),
    color: WORKSTREAM_COLOURS.rail,
  },
  {
    id: "demo-ws-invite",
    title: "Design AI intake pilot with one transfer agent",
    jiraKey: "INNO-317",
    ownerName: "Aisha Rahman",
    ownerInitials: "AR",
    stage: "idea" as WorkstreamStage,
    stepperIndex: 0,
    progressLabel: "Queued",
    progressTone: "neutral",
    updatedAt: hoursAgo(10).toISOString(),
    color: WORKSTREAM_COLOURS.trust,
  },
  {
    id: "demo-ws-open",
    title: "Publish open fund-dealing agent profile",
    jiraKey: "INNO-318",
    ownerName: "Owen Blake",
    ownerInitials: "OB",
    stage: "research" as WorkstreamStage,
    stepperIndex: 0,
    progressLabel: "In research",
    progressTone: "active",
    updatedAt: hoursAgo(12).toISOString(),
    color: WORKSTREAM_COLOURS.standards,
  },
  {
    id: "demo-ws-weekly",
    title: "Ship Data Insights own-book and segment demand",
    jiraKey: "INNO-319",
    ownerName: "Leon Okonkwo",
    ownerInitials: "LO",
    stage: "in_review" as WorkstreamStage,
    stepperIndex: 2,
    progressLabel: "Plan v1, 2 comments",
    progressTone: "waiting",
    updatedAt: hoursAgo(5).toISOString(),
    color: WORKSTREAM_COLOURS.collective,
  },
];

const DEMO_STATS: OverviewStats = {
  allActive: 9,
  research: 2,
  inReview: 2,
  building: 2,
  pullRequest: 0,
  mergedThisWeek: 1,
};

const DEMO_NEEDS: NeedsActionItem[] = [
  {
    id: "demo-ws-rail-q",
    jiraKey: "INNO-311",
    title: "Pilot transfer completion with two platforms",
    kind: "question",
    summary: "Runner paused at step 2 of 3",
    detail:
      "Should the transfer completion pilot start with rejection prediction only, or full orchestration with chasing?",
    options: [
      "Rejection prediction only",
      "Full orchestration with chasing",
      "Ask architect",
    ],
    actionLabel: "Write an answer",
    createdAt: hoursAgo(1).toISOString(),
    color: WORKSTREAM_COLOURS.rail,
  },
  {
    id: "demo-ws-context-c",
    jiraKey: "INNO-310",
    title: "Ship client key, governed metrics and private MCP",
    kind: "comments",
    summary: "Plan v2 · 3 open comments, architect approval needed",
    detail: null,
    options: [],
    actionLabel: "Review plan",
    createdAt: hoursAgo(2).toISOString(),
    color: WORKSTREAM_COLOURS.context,
  },
  {
    id: "demo-ws-weekly-c",
    jiraKey: "INNO-319",
    title: "Ship Data Insights own-book and segment demand",
    kind: "comments",
    summary: "Plan v1 · 2 open comments, lead review needed",
    detail: "Keep segment cells to five firms minimum and no single firm dominant.",
    options: [],
    actionLabel: "Review plan",
    createdAt: hoursAgo(5).toISOString(),
    color: WORKSTREAM_COLOURS.collective,
  },
];

const DEMO_AGENTS: AgentRunningItem[] = [
  {
    id: "demo-runner-rail",
    workstreamId: "demo-ws-rail",
    kind: "Runner",
    jiraKey: "INNO-311",
    title: "Pilot transfer completion with two platforms",
    statusLine: "Paused for human input",
    stepsCompleted: 2,
    stepsTotal: 3,
    startedAt: hoursAgo(3).toISOString(),
  },
  {
    id: "demo-runner-repair",
    workstreamId: "demo-ws-repair",
    kind: "Runner",
    jiraKey: "INNO-316",
    title: "Build transfer repair suggestions for ops",
    statusLine: "Step 1 of 3",
    stepsCompleted: 1,
    stepsTotal: 3,
    startedAt: hoursAgo(3).toISOString(),
  },
  {
    id: "demo-scout-trust",
    workstreamId: "demo-ws-trust",
    kind: "Scout",
    jiraKey: "INNO-312",
    title: "Stand up consent records and identity federation",
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

function idea(
  partial: Omit<IdeaBoardItem, "color"> & { color?: string },
): IdeaBoardItem {
  return {
    ...partial,
    color:
      partial.color ??
      (partial.workstreamId
        ? DEMO_WORKSTREAM_ROWS.find((w) => w.id === partial.workstreamId)?.color ??
          WORKSTREAM_COLOURS.neutral
        : WORKSTREAM_COLOURS.neutral),
  };
}

const DEMO_IDEAS: IdeaBoardItem[] = [
  idea({
    id: "demo-idea-1",
    title: "One Calastone client key with LEI and Salesforce maps",
    description:
      "Canonical calastone_client_id from client_client.Id, plus mapping to LEI, BIC, Salesforce and SS&C IDs. Resolve the 274 unmapped clients.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 12,
    minutesLostEach: 15,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Ship client key, governed metrics and private MCP",
    createdAt: daysAgo(5).toISOString(),
  }),
  idea({
    id: "demo-idea-2",
    title: "Use Relay as first internal MCP client",
    description:
      "Point Scout and Knowledge at private MCP tools (order_status, flows_summary, dealing_rules) so the team dogfoods the context layer.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Ship client key, governed metrics and private MCP",
    createdAt: daysAgo(4).toISOString(),
  }),
  idea({
    id: "demo-idea-3",
    title: "Transfer orchestration with timers and chasing",
    description:
      "Workflow over Calastone Transfers: pre-submission check, repair, submission, chase, complete. Success-based pricing on completion.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 5,
    minutesLostEach: 25,
    submittedByName: "Owen Blake",
    workstreamId: "demo-ws-rail",
    workstreamTitle: "Pilot transfer completion with two platforms",
    createdAt: daysAgo(4).toISOString(),
  }),
  idea({
    id: "demo-idea-4",
    title: "Consent service for benchmark pools and matching",
    description:
      "Versioned records per client for benchmarking contribution, opt-in distributor matching and GIDS data use, read by the policy service.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-trust",
    workstreamTitle: "Stand up consent records and identity federation",
    createdAt: daysAgo(3).toISOString(),
  }),
  idea({
    id: "demo-idea-5",
    title: "Gradient-boosted transfer rejection classifier",
    description:
      "Train on transfers history with reject reasons and data completeness. Output rejection probability and likely cause per request.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: "demo-ws-collective",
    workstreamTitle: "Train transfer rejection prediction on history",
    createdAt: daysAgo(3).toISOString(),
  }),
  idea({
    id: "demo-idea-6",
    title: "ISO 20022 agent ID and mandate reference fields",
    description:
      "Optional initiating agent ID and mandate reference on setr messages via UKFMPG, carried in supplementary data until a standard field exists.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-standards",
    workstreamTitle: "Draft agent ID and mandate fields for UKFMPG",
    createdAt: daysAgo(6).toISOString(),
  }),
  idea({
    id: "demo-idea-7",
    title: "Monthly flow statement gold table and narrative",
    description:
      "flow_statement_monthly per manager: gross and net by distributor already dealing its funds, cost per pound from rate cards, verifier-checked narrative.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-coverage",
    workstreamTitle: "Pilot free flow statement with five UK managers",
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-8",
    title: "Human-reviewed transfer repair suggestions",
    description:
      "Rules first, language model for free-text fields. Suggested corrections for a person to approve until accuracy justifies removing review.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 4,
    minutesLostEach: 45,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-repair",
    workstreamTitle: "Build transfer repair suggestions for ops",
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-9",
    title: "AI intake inbox for one TA long tail",
    description:
      "Email, upload and fax-to-email into extract, validate, confirm with sender, then emit ISO 20022 from a managed intake connection.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: "demo-ws-invite",
    workstreamTitle: "Design AI intake pilot with one transfer agent",
    createdAt: daysAgo(1).toISOString(),
  }),
  idea({
    id: "demo-idea-10",
    title: "Data Insights module 1 own book",
    description:
      "Share of category within each distributor already dealing the manager's funds. Enforce the data rule via the relationship table.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-weekly",
    workstreamTitle: "Ship Data Insights own-book and segment demand",
    createdAt: daysAgo(1).toISOString(),
  }),
  idea({
    id: "demo-idea-11",
    title: "Contribute open dealing profile to Agentic AI Foundation",
    description:
      "MCP tools and A2A agent card for fund dealing, contributed as an open profile for partners and neo-brokers.",
    type: "external_signal",
    status: "triaged",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-12",
    title: "Pilot agent ordering inside FCA AI Live Testing",
    description:
      "Human approval on every order during pilots; seek FCA AI Lab coverage for the agent ordering path.",
    type: "external_signal",
    status: "triaged",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Vera Nilsen",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-13",
    title: "Silver cleaning rules for placeholder dates and IDs",
    description:
      "Turn 1900-01-01 and ClientId -1/-2/0 into nulls with reason codes; exclude soft-deleted funds; derive route in-use from 12 months of messages.",
    type: "friction_log",
    status: "triaged",
    frequencyPerWeek: 8,
    minutesLostEach: 10,
    submittedByName: "Owen Blake",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(30).toISOString(),
  }),
  idea({
    id: "demo-idea-14",
    title: "Office-hours slot for five flow-statement pilots",
    description:
      "Weekly drop-in for the five UK managers on the Q2 flow statement pilot so blockers do not need a new ticket every time.",
    type: "friction_log",
    status: "triaged",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(28).toISOString(),
  }),
  idea({
    id: "demo-idea-15",
    title: "Segment demand with minimum-cell rules",
    description:
      "Flows by strategy, vehicle, market and distributor type. At least five firms per cell and no single firm above a set share.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: 3,
    minutesLostEach: 30,
    submittedByName: "Alex Curtin",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(1).toISOString(),
  }),
  idea({
    id: "demo-idea-16",
    title: "License FE fundinfo for peer comparison module",
    description:
      "Data Insights module 3 needs performance, fees and ratings joined on ISIN. FE already supplies Fund Flow Index sectors.",
    type: "external_signal",
    status: "new",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(20).toISOString(),
  }),
  idea({
    id: "demo-idea-17",
    title: "White-label transfer status for advisers",
    description:
      "Platform console plus white-label status page and API so advisers and investors see where a transfer is.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: 1,
    minutesLostEach: 60,
    submittedByName: "Leon Okonkwo",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(12).toISOString(),
  }),
  idea({
    id: "demo-idea-18",
    title: "Template answers for Runner questions",
    description:
      "Common pause questions should have ready answers so owners do not rewrite the same reply.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: 6,
    minutesLostEach: 8,
    submittedByName: "Alex Curtin",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(9).toISOString(),
  }),
  idea({
    id: "demo-idea-19",
    title: "Fund Launch Radar feed for platforms",
    description:
      "Sell platforms a feed of launches and share class changes once fund master enrichment is live.",
    type: "external_signal",
    status: "new",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Vera Nilsen",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(7).toISOString(),
  }),
  idea({
    id: "demo-idea-20",
    title: "Kill switches and throttles at the edge gateway",
    description:
      "Per-agent and per-client caps, duplicate detection and kill switches before any unattended agent order.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(5).toISOString(),
  }),
  idea({
    id: "demo-idea-21",
    title: "Pass liquidity signals to GlobeOp Forward Redemption",
    description:
      "Daily redemption orders by fund and distributor type as a feature feed into SS&C's product, not a competing build.",
    type: "friction_log",
    status: "new",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: hoursAgo(4).toISOString(),
  }),
  idea({
    id: "demo-idea-22",
    title: "Park named-distributor matching until opt-in",
    description:
      "Module 4 matching needs consented interest profiles. Park until consent clauses are in standard terms.",
    type: "external_signal",
    status: "parked",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(7).toISOString(),
  }),
  idea({
    id: "demo-idea-23",
    title: "Park unattended agent ordering",
    description:
      "No unattended orders until mandates, request signing, controls and kill switches clear the trust layer exit.",
    type: "friction_log",
    status: "parked",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(8).toISOString(),
  }),
  idea({
    id: "demo-idea-24",
    title: "Park tokenised fund dealing until paperwork is digital",
    description:
      "Tokenised and semi-liquid funds wait until transfer and intake have digitised the paperwork.",
    type: "external_signal",
    status: "parked",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Vera Nilsen",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: daysAgo(9).toISOString(),
  }),
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
              ? "Reading consent and identity federation designs"
              : "Reading client key and governed metric drafts",
          rationale: "Using the same company sources as Pulse and LibreChat.",
          disclosureLabel: "Searching connectors",
          disclosureDetail: "confluence.search · jira.search",
        },
        {
          id: `${id}-r2`,
          title:
            id === "demo-ws-trust"
              ? "Checking policy service and audit ledger needs"
              : "Checking private MCP tools and entitlement tags",
          rationale: "Turning findings into a clear plan for the team.",
          disclosureLabel: "Read files",
          disclosureDetail:
            id === "demo-ws-trust"
              ? "Consent service and identity federation (draft)"
              : "Client key and private MCP tools (draft)",
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
      ? `# Plan: Transfer completion pilot

## Goal
Run transfer orchestration with two platforms: predicted rejections, repair, chase and completion.

## Steps
1. Choose rejection-only versus full orchestration with chasing
2. Wire pre-submission checks to the rejection model
3. Measure completion rate and days to complete
`
      : `# Plan: Context layer foundations

## Goal
Give every goal the same entitled gold tables: one client key, signed-off metrics, fund enrichment and private MCP.

## Steps
1. Ship calastone_client_id mapping and governed metric definitions
2. Publish private MCP tools and point Relay at them
3. Pilot free flow statement once metrics reconcile to billing within 0.1%
4. Pass row filters, masks and data-rule policy before any paid Insights module
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
        ? "Transfer completion needs rejection prediction, repair suggestions and orchestration with chasing. Price on success; start with two platforms."
        : "Every goal reads the context layer. Ship one client key, governed metrics, fund enrichment, entitlements and private MCP before paid Data Insights or agent writes.",
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
          title:
            id === "demo-ws-rail"
              ? "Choose pilot depth"
              : "Ship client key and metrics",
          description:
            id === "demo-ws-rail"
              ? "Rejection prediction only, or full orchestration with chasing."
              : "calastone_client_id mapping table and signed-off governed metrics.",
          filesLikelyTouched: ["packages/mcp/tools"],
          testsToAdd: ["contract tests"],
          riskLevel: "medium" as const,
          completed: true,
        },
        {
          id: "s2",
          order: 2,
          title:
            id === "demo-ws-rail"
              ? "Wire pre-submission checks"
              : "Connect Relay to private MCP",
          description:
            id === "demo-ws-rail"
              ? "Rejection model and repair suggestions before the network sees the request."
              : "Scout uses order_status, flows_summary and dealing_rules.",
          filesLikelyTouched: [],
          testsToAdd: [],
          riskLevel: "high" as const,
          completed: id === "demo-ws-rail",
        },
        {
          id: "s3",
          order: 3,
          title:
            id === "demo-ws-rail"
              ? "Measure completion outcomes"
              : "Pilot free flow statement",
          description:
            id === "demo-ws-rail"
              ? "Completion rate, days to complete, revenue per completed transfer."
              : "Five UK managers once the statement reconciles to billing within 0.1%.",
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
                body: "Confirm entitlements sit in Unity Catalog and the policy service, not in prompts.",
                resolved: false,
                createdAt: hoursAgo(3).toISOString(),
                anchorText: "entitlements",
                author: DEMO_USERS[2]!,
              },
              {
                id: "c2",
                body: "Add Datadog latency checks for private MCP to the pilot checklist.",
                resolved: false,
                createdAt: hoursAgo(2).toISOString(),
                anchorText: "Datadog",
                author: DEMO_USERS[3]!,
              },
              {
                id: "c3",
                body: "Flow statement narrative must pass the verifier against gold table cells.",
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
            ? "Consent service and identity federation (draft)"
            : "Client key and private MCP tools (draft)",
        itemId: "conf-1",
      },
      {
        connector: "datadog",
        title: "Private MCP latency dashboard",
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
      "Client key and metric drafts exist in Confluence. Datadog covers private MCP latency. Relay is listed as first internal MCP client in the technical roadmap.",
    openQuestion:
      row.id === "demo-ws-rail"
        ? "Should the transfer completion pilot start with rejection prediction only, or full orchestration with chasing?"
        : null,
  };
}
