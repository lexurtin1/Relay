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
    title: "Share dealing info with partner teams",
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
    title: "Run one approved savings or rebalance pilot",
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
    title: "Know which agents can act for each firm",
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
    title: "Spot orders likely to fail before settlement",
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
    title: "Agree agent fields with UK market groups",
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
    title: "Explain coverage in plain language",
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
    title: "Cut repair time when an order breaks",
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
    title: "Invite two platforms to a shared pilot",
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
    title: "Publish a simple open dealing profile",
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
    title: "Send managers a weekly cost-avoided note",
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
    title: "Run one approved savings or rebalance pilot",
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
    title: "Share dealing info with partner teams",
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
    title: "Send managers a weekly cost-avoided note",
    kind: "comments",
    summary: "Plan v1 · 2 open comments, lead review needed",
    detail: "Keep the note to two numbers and one sentence.",
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
    title: "Run one approved savings or rebalance pilot",
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
    title: "Cut repair time when an order breaks",
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
    title: "Know which agents can act for each firm",
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
    title: "Publish dealing rules for partners",
    description:
      "Orderability, cut-offs, frequency, minimums and settlement by link. Read-only first for design partners.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 12,
    minutesLostEach: 15,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Share dealing info with partner teams",
    createdAt: daysAgo(5).toISOString(),
  }),
  idea({
    id: "demo-idea-2",
    title: "Use Relay as the first internal client",
    description:
      "Point Scout and Knowledge at the same company sources as the chatbot so we learn on our own work first.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-context",
    workstreamTitle: "Share dealing info with partner teams",
    createdAt: daysAgo(4).toISOString(),
  }),
  idea({
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
    workstreamTitle: "Run one approved savings or rebalance pilot",
    createdAt: daysAgo(4).toISOString(),
  }),
  idea({
    id: "demo-idea-4",
    title: "List helpers under the firm that owns them",
    description:
      "Each helper has an owner firm, what it may do, and how to reach the person in charge.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-trust",
    workstreamTitle: "Know which agents can act for each firm",
    createdAt: daysAgo(3).toISOString(),
  }),
  idea({
    id: "demo-idea-5",
    title: "Flag orders that may fail or settle late",
    description:
      "With partner consent, score risk earlier. Ties to UK and EU settlement pressure in 2027.",
    type: "external_signal",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Owen Blake",
    workstreamId: "demo-ws-collective",
    workstreamTitle: "Spot orders likely to fail before settlement",
    createdAt: daysAgo(3).toISOString(),
  }),
  idea({
    id: "demo-idea-6",
    title: "Draft optional agent fields for market groups",
    description:
      "Optional initiating helper ID and mandate reference on fund order messages.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-standards",
    workstreamTitle: "Agree agent fields with UK market groups",
    createdAt: daysAgo(6).toISOString(),
  }),
  idea({
    id: "demo-idea-7",
    title: "One coverage definition for demos",
    description:
      "Agree value vs count language so partner demos do not contradict each other.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-coverage",
    workstreamTitle: "Explain coverage in plain language",
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-8",
    title: "Named owners on the repair path",
    description:
      "When an order breaks, everyone should know who answers first at platform, TA and manager.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: 4,
    minutesLostEach: 45,
    submittedByName: "Alex Curtin",
    workstreamId: "demo-ws-repair",
    workstreamTitle: "Cut repair time when an order breaks",
    createdAt: daysAgo(2).toISOString(),
  }),
  idea({
    id: "demo-idea-9",
    title: "Short invite pack for two platforms",
    description:
      "What they get, what they share, how to stop. Keep legal light for the first pilot.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Aisha Rahman",
    workstreamId: "demo-ws-invite",
    workstreamTitle: "Invite two platforms to a shared pilot",
    createdAt: daysAgo(1).toISOString(),
  }),
  idea({
    id: "demo-idea-10",
    title: "Weekly cost-avoided email for managers",
    description:
      "Two numbers and one sentence. No dashboard required for the first pilot.",
    type: "friction_log",
    status: "promoted",
    frequencyPerWeek: null,
    minutesLostEach: null,
    submittedByName: "Leon Okonkwo",
    workstreamId: "demo-ws-weekly",
    workstreamTitle: "Send managers a weekly cost-avoided note",
    createdAt: daysAgo(1).toISOString(),
  }),
  idea({
    id: "demo-idea-11",
    title: "Join an industry working item on helpers",
    description:
      "Propose a financial services item and contribute the fund dealing profile.",
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
    title: "Meet the FCA AI Lab on fund dealing trust",
    description:
      "Extend Know Your Agent conversations from payments into fund dealing with Calastone as industry pilot.",
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
    title: "Plain-language exception labels",
    description:
      "Ops teams still decode opaque codes. Agree a short shared label set for the top ten failures.",
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
    title: "Office-hours slot for design partners",
    description:
      "A weekly drop-in so partners can raise blockers without opening a new ticket every time.",
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
    title: "Segment views instead of named distributors",
    description:
      "Safer Insights design until distributors opt in. Avoid green-space leaks.",
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
    title: "Licensed peer data for comparisons",
    description:
      "Peer views need licensed fund data Calastone does not hold. Pitch flows plus a data partner.",
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
    title: "Show managers repair cost avoided",
    description:
      "Counter higher helper message volume with a clear saving report per fund manager.",
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
    title: "Partner success story one-pager",
    description:
      "A short internal note when a pilot hits its first week of rejects avoided.",
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
    title: "Calm alerts when helpers go quiet",
    description:
      "If a helper stops sending heartbeats, notify the owner firm without paging the whole ops floor.",
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
    title: "Shared glossary for Scout findings",
    description:
      "Scout summaries mix platform and TA terms. One short glossary keeps plans readable.",
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
    createdAt: daysAgo(7).toISOString(),
  }),
  idea({
    id: "demo-idea-23",
    title: "Park live write access for chatbots",
    description:
      "Consumer chatbots must not place orders. Keep this parked while trust work lands.",
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
    title: "Park cross-border mandate reuse",
    description:
      "Interesting later, but consent rules differ by market. Park until UK pilot is stable.",
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
              ? "Looking up how firms register helpers today"
              : "Reading dealing rules across company sources",
          rationale: "Using the same company sources as the chatbot.",
          disclosureLabel: "Searching connectors",
          disclosureDetail: "confluence.search · jira.search",
        },
        {
          id: `${id}-r2`,
          title:
            id === "demo-ws-trust"
              ? "Checking mandate and stop-button needs"
              : "Checking order status and exception wording for partners",
          rationale: "Turning findings into a clear plan for the team.",
          disclosureLabel: "Read files",
          disclosureDetail:
            id === "demo-ws-trust"
              ? "Agent registry and scopes (draft)"
              : "Dealing rules for partners (draft)",
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
      ? `# Plan: Approved write pilot

## Goal
Start with ops helpers and one low-risk write flow.

## Steps
1. Pick regular savings or model rebalance
2. Require a named person on every order
3. Measure rejects avoided and repair time saved
`
      : `# Plan: Share dealing info with partners

## Goal
Give platforms and ops helpers trustworthy read access before any write pilot.

## Steps
1. Publish dealing rules, order status and exception views
2. Point Relay at the same company sources as the chatbot
3. Agree fair-use limits and a free flow statement for two fund managers
4. Agree coverage wording before any client demo
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
        ? "Start with ops helpers and one low-risk write flow. Every order needs a named person to approve, plus clear stops if something goes wrong."
        : "Partner helpers need dealing rules, order status and exceptions before they can help. Use the same company sources the chatbot already reads, with Relay as a first internal client.",
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
          title: id === "demo-ws-rail" ? "Choose pilot flow" : "Publish core read views",
          description:
            id === "demo-ws-rail"
              ? "Regular savings or model rebalance with design partners."
              : "Dealing rules, status, exceptions, coverage queries.",
          filesLikelyTouched: ["packages/mcp/tools"],
          testsToAdd: ["contract tests"],
          riskLevel: "medium" as const,
          completed: true,
        },
        {
          id: "s2",
          order: 2,
          title: id === "demo-ws-rail" ? "Wire approval gate" : "Connect Relay as internal client",
          description:
            id === "demo-ws-rail"
              ? "No helper order leaves without a named person."
              : "Scout uses the shared company sources.",
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
                body: "Add Datadog latency checks to the pilot checklist.",
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
            : "Dealing rules for partners (draft)",
        itemId: "conf-1",
      },
      {
        connector: "datadog",
        title: "Helper latency dashboard",
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
      "Dealing-rules draft exists in Confluence. Datadog demo dashboard covers helper latency. Relay listed as first internal client in the 90-day plan.",
    openQuestion:
      row.id === "demo-ws-rail"
        ? "Should the first write pilot be a regular savings run or a model portfolio rebalance?"
        : null,
  };
}
