import {
  IdeaStatus,
  IdeaType,
  PlanStatus,
  PrismaClient,
  RiskLevel,
  RunnerJobStatus,
  UserRole,
  WorkstreamOrigin,
  WorkstreamPriority,
  WorkstreamStage,
  AgentEventType,
  ResearchRunStatus,
  AuditAction,
} from "@prisma/client";
import { WORKSTREAM_COLOURS } from "@relay/core";

const prisma = new PrismaClient();

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000);
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86_400_000);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.question.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.planStep.deleteMany();
  await prisma.runnerJob.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.researchRun.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.workstream.deleteMany();
  await prisma.user.deleteMany();

  const [alex, owen, aisha, leon, vera] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Curtin",
        email: "alex.curtin@example-calastone.invalid",
        role: UserRole.engineer,
        team: "Innovation and Strategy",
      },
    }),
    prisma.user.create({
      data: {
        name: "Owen Blake",
        email: "owen.blake@example-calastone.invalid",
        role: UserRole.engineer,
        team: "Innovation and Strategy",
      },
    }),
    prisma.user.create({
      data: {
        name: "Aisha Rahman",
        email: "aisha.rahman@example-calastone.invalid",
        role: UserRole.architect,
        team: "Innovation and Strategy",
      },
    }),
    prisma.user.create({
      data: {
        name: "Leon Okonkwo",
        email: "leon.okonkwo@example-calastone.invalid",
        role: UserRole.lead,
        team: "Innovation and Strategy",
      },
    }),
    prisma.user.create({
      data: {
        name: "Vera Nilsen",
        email: "vera.nilsen@example-calastone.invalid",
        role: UserRole.viewer,
        team: "Innovation and Strategy",
      },
    }),
  ]);

  // 1. Context layer MCP — in review
  const wsContext = await prisma.workstream.create({
    data: {
      title: "Ship read-side MCP tools for design partners",
      problemStatement:
        "Agents cannot act on data they cannot read. Expose dealing rules, order status and exceptions through the same MCP surface the company chatbot already uses, with Relay as a first internal client.",
      stage: WorkstreamStage.in_review,
      jiraKey: "INNO-310",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.high,
      color: WORKSTREAM_COLOURS.context,
      ownerId: alex.id,
      lastActivityAt: hoursAgo(2),
    },
  });

  await prisma.plan.create({
    data: {
      workstreamId: wsContext.id,
      versionNumber: 1,
      status: PlanStatus.superseded,
      markdownBody:
        "# Plan v1\n\n1. List core read tools\n2. Wire entitlements\n3. Pilot with one partner",
      steps: {
        create: [
          {
            order: 1,
            title: "List core read tools",
            description: "Dealing rules, status, exceptions, coverage.",
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Wire entitlements",
            description: "Per-participant ring-fence on private data.",
            riskLevel: RiskLevel.medium,
          },
        ],
      },
    },
  });

  const planContextV2 = await prisma.plan.create({
    data: {
      workstreamId: wsContext.id,
      versionNumber: 2,
      status: PlanStatus.in_review,
      markdownBody:
        "# Plan: Context layer MCP for design partners\n\n## Goal\nGive platforms and ops agents trustworthy read tools before any write pilot.\n\n## Steps\n1. Publish dealing-rules, order-status and exception tools on the shared MCP server\n2. Point Relay Scout at the same connectors as the chatbot (Salesforce, Jira, Confluence, Databricks, Datadog, GitHub, Power BI)\n3. Agree fair-use limits and a free flow statement for two fund managers\n4. Document coverage definition (value vs count) before any client demo",
      steps: {
        create: [
          {
            order: 1,
            title: "Publish core read tools",
            description: "Dealing rules, status, exceptions, coverage queries.",
            filesLikelyTouched: ["packages/mcp/tools"],
            testsToAdd: ["tool contract tests"],
            riskLevel: RiskLevel.medium,
            needsConfirmation: false,
          },
          {
            order: 2,
            title: "Connect Relay as internal client",
            description: "Scout uses the shared connector set for company context.",
            riskLevel: RiskLevel.low,
          },
          {
            order: 3,
            title: "Pilot free flow statement",
            description: "Two managers who raised cost concerns; no named-distributor green space.",
            riskLevel: RiskLevel.medium,
            needsConfirmation: true,
          },
        ],
      },
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        planId: planContextV2.id,
        authorId: aisha.id,
        body: "Confirm entitlements sit in the data layer, not in prompts.",
        resolved: false,
      },
      {
        planId: planContextV2.id,
        authorId: leon.id,
        body: "Add Datadog latency dashboard to the pilot checklist.",
        resolved: false,
      },
      {
        planId: planContextV2.id,
        authorId: owen.id,
        body: "Coverage wording must match Fund Flow Index language.",
        resolved: false,
      },
    ],
  });

  await prisma.researchRun.create({
    data: {
      workstreamId: wsContext.id,
      status: ResearchRunStatus.succeeded,
      sourcesConsulted: [
        {
          connector: "confluence",
          title: "Dealing rules MCP tools (draft)",
          itemId: "conf-dealing",
        },
        {
          connector: "jira",
          title: "INNO-310 context layer",
          itemId: "INNO-310",
        },
        {
          connector: "datadog",
          title: "MCP tool latency dashboard",
          itemId: "mcp-tool-latency",
        },
        {
          connector: "github",
          title: "packages/mcp/src/tools",
          itemId: "gh-tools",
        },
      ],
      findings:
        "Dealing-rules draft exists in Confluence. Datadog demo dashboard covers MCP latency. Relay listed as first internal MCP client in the 90-day plan.",
      tokenUsage: 4200,
      startedAt: hoursAgo(6),
      finishedAt: hoursAgo(5),
      events: {
        create: [
          {
            type: AgentEventType.status,
            payload: { text: "Researching dealing rules across Confluence and Jira" },
            createdAt: hoursAgo(6),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "confluence.search", query: "dealing rules MCP" },
            createdAt: hoursAgo(5.9),
          },
          {
            type: AgentEventType.tool_result,
            payload: { tool: "confluence.search", title: "Dealing rules MCP tools (draft)" },
            createdAt: hoursAgo(5.8),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "datadog.get_dashboard", id: "mcp-tool-latency" },
            createdAt: hoursAgo(5.7),
          },
          {
            type: AgentEventType.status,
            payload: { text: "Interpreting order status and exception tools for partner pilots" },
            createdAt: hoursAgo(5.5),
          },
        ],
      },
    },
  });

  // 2. Agent transaction rail — awaiting input (Runner paused)
  const wsRail = await prisma.workstream.create({
    data: {
      title: "Run one human-approved agent order pilot",
      problemStatement:
        "Start with ops agents and one low-risk write flow (regular savings or model rebalance). Every order needs human approval, throttles and a kill switch.",
      stage: WorkstreamStage.awaiting_input,
      jiraKey: "INNO-311",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.critical,
      color: WORKSTREAM_COLOURS.rail,
      ownerId: owen.id,
      lastActivityAt: hoursAgo(1),
    },
  });

  const planRail = await prisma.plan.create({
    data: {
      workstreamId: wsRail.id,
      versionNumber: 1,
      status: PlanStatus.approved,
      markdownBody:
        "# Plan: Human-approved write pilot\n\n1. Pick regular savings or model rebalance\n2. Require human approval on every order\n3. Measure pre-trade rejects avoided and repair time saved",
      steps: {
        create: [
          {
            order: 1,
            title: "Choose pilot flow",
            description: "Regular savings or model rebalance with design partners.",
            completed: true,
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Wire approval gate",
            description: "No agent order leaves without a named person.",
            completed: true,
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
          {
            order: 3,
            title: "Add throttles and kill switch",
            description: "Per-agent caps so one faulty agent cannot flood a fund.",
            completed: false,
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
          {
            order: 4,
            title: "Report savings to managers",
            description: "Rejects avoided and repair hours saved per 1,000 orders.",
            completed: false,
            riskLevel: RiskLevel.medium,
          },
        ],
      },
      approvals: { create: [{ approverId: aisha.id }] },
    },
  });

  const runnerRail = await prisma.runnerJob.create({
    data: {
      workstreamId: wsRail.id,
      planId: planRail.id,
      status: RunnerJobStatus.awaiting_input,
      workspacePath: "/tmp/relay-runner/demo-rail",
      branch: "relay/agent-order-pilot",
      additionalInstructions: "Prefer regular savings for the first pilot.",
      tokenUsage: 8100,
      startedAt: hoursAgo(3),
      questions: {
        create: [
          {
            questionText:
              "Should the first write pilot be a regular savings run or a model portfolio rebalance?",
            options: ["Regular savings", "Model rebalance", "Ask architect"],
          },
        ],
      },
      events: {
        create: [
          {
            type: AgentEventType.status,
            payload: { text: "Provisioning Runner workspace" },
            createdAt: hoursAgo(3),
          },
          {
            type: AgentEventType.question,
            payload: { text: "Pilot flow choice needed" },
            createdAt: hoursAgo(1),
          },
        ],
      },
    },
  });

  // 3. Trust and identity — research
  const wsTrust = await prisma.workstream.create({
    data: {
      title: "Stand up agent registry with scopes and audit",
      problemStatement:
        "Calastone already knows every participant. Extend that to the agents they run: registry, scopes, signed mandates, provenance on each order, and a readable audit trail.",
      stage: WorkstreamStage.research,
      jiraKey: "INNO-312",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.high,
      color: WORKSTREAM_COLOURS.trust,
      ownerId: alex.id,
      lastActivityAt: hoursAgo(4),
    },
  });

  await prisma.researchRun.create({
    data: {
      workstreamId: wsTrust.id,
      status: ResearchRunStatus.running,
      sourcesConsulted: [
        {
          connector: "confluence",
          title: "Agent registry and scopes (draft)",
          itemId: "conf-registry",
        },
        {
          connector: "jira",
          title: "INNO-312 trust layer",
          itemId: "INNO-312",
        },
        {
          connector: "datadog",
          title: "Agent throttle monitors",
          itemId: "agent-throttle",
        },
      ],
      findings: null,
      tokenUsage: 2100,
      startedAt: hoursAgo(4),
      events: {
        create: [
          {
            type: AgentEventType.status,
            payload: { text: "Researching agent registry patterns and fund dealing scopes" },
            createdAt: hoursAgo(4),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "confluence.search", query: "agent registry scopes" },
            createdAt: hoursAgo(3.9),
          },
          {
            type: AgentEventType.tool_result,
            payload: { tool: "confluence.search", title: "Agent registry and scopes (draft)" },
            createdAt: hoursAgo(3.8),
          },
          {
            type: AgentEventType.status,
            payload: { text: "Interpreting mandate and kill-switch requirements for the TA repair story" },
            createdAt: hoursAgo(3.5),
          },
        ],
      },
    },
  });

  // 4. Collective intelligence — planning
  const wsCollective = await prisma.workstream.create({
    data: {
      title: "Predict settlement fails with partner consent",
      problemStatement:
        "Combine Calastone order flow with SS&C register-side data under clear consent. Score rejection and late settlement risk before T+1 pressure rises.",
      stage: WorkstreamStage.planning,
      jiraKey: "INNO-313",
      origin: WorkstreamOrigin.external_opportunity,
      priority: WorkstreamPriority.medium,
      color: WORKSTREAM_COLOURS.collective,
      ownerId: aisha.id,
      lastActivityAt: hoursAgo(6),
    },
  });

  await prisma.plan.create({
    data: {
      workstreamId: wsCollective.id,
      versionNumber: 1,
      status: PlanStatus.draft,
      markdownBody:
        "# Plan: Fail prediction pilot\n\n1. Agree GIDS consent model\n2. Shared entity key with Calastone ontology\n3. Databricks clean-room sketch\n4. Score orders for reject or late settlement likelihood",
      steps: {
        create: [
          {
            order: 1,
            title: "Agree consent model",
            description: "Design partners first, then standard terms.",
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
          {
            order: 2,
            title: "Shared primary key",
            description: "One entity key with Jonathan Abram / GIDS.",
            riskLevel: RiskLevel.medium,
          },
          {
            order: 3,
            title: "Clean-room setup",
            description: "Databricks path so raw books are not pooled.",
            riskLevel: RiskLevel.medium,
          },
        ],
      },
    },
  });

  // 5. Standards — merged example
  const wsStandards = await prisma.workstream.create({
    data: {
      title: "Draft agent fields for UKFMPG change request",
      problemStatement:
        "ISO 20022 defines the fund order but not the initiating agent or mandate. Draft optional fields and take them to UKFMPG with SS&C and two platforms as co-sponsors.",
      stage: WorkstreamStage.merged,
      jiraKey: "INNO-314",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.medium,
      color: WORKSTREAM_COLOURS.standards,
      ownerId: leon.id,
      lastActivityAt: daysAgo(2),
    },
  });

  const planStandards = await prisma.plan.create({
    data: {
      workstreamId: wsStandards.id,
      versionNumber: 1,
      status: PlanStatus.approved,
      markdownBody:
        "# Plan: Standards draft\n\n1. Optional agent ID and mandate reference\n2. Open fund-dealing MCP profile\n3. Brief for UKFMPG",
      steps: {
        create: [
          {
            order: 1,
            title: "Draft optional message elements",
            description: "Agent ID and mandate reference for setr messages.",
            completed: true,
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Publish open profile sketch",
            description: "MCP tools and A2A card mapped to ISO 20022.",
            completed: true,
            riskLevel: RiskLevel.medium,
          },
        ],
      },
      approvals: { create: [{ approverId: aisha.id }] },
    },
  });

  await prisma.runnerJob.create({
    data: {
      workstreamId: wsStandards.id,
      planId: planStandards.id,
      status: RunnerJobStatus.succeeded,
      workspacePath: "/tmp/relay-runner/demo-standards",
      branch: "relay/ukfmpg-draft",
      prUrl: "https://github.com/example-calastone/relay/pull/42",
      tokenUsage: 5600,
      startedAt: daysAgo(4),
      finishedAt: daysAgo(2),
    },
  });

  await prisma.idea.createMany({
    data: [
      {
        title: "Publish dealing rules as MCP tools",
        description:
          "Orderability, cut-offs, frequency, minimums and settlement by link. Read-only first for design partners.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 12,
        minutesLostEach: 15,
        status: IdeaStatus.promoted,
        workstreamId: wsContext.id,
      },
      {
        title: "Give managers a free flow statement",
        description:
          "Show messages, flows delivered and cost per pound of flow before any Data Insights upsell.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 2,
        minutesLostEach: 40,
        status: IdeaStatus.promoted,
        workstreamId: wsContext.id,
      },
      {
        title: "Use Relay as first MCP client",
        description:
          "Point Scout and Knowledge at the same connectors as the company chatbot so the strategy is dogfooded internally.",
        submittedById: alex.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsContext.id,
      },
      {
        title: "Pilot regular savings with human approval",
        description:
          "Low-risk write path. Every order approved by a named person. Measure rejects avoided.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 5,
        minutesLostEach: 25,
        status: IdeaStatus.promoted,
        workstreamId: wsRail.id,
      },
      {
        title: "Add per-agent kill switch",
        description:
          "Throttles, duplicate detection and a kill switch so one faulty agent cannot flood a fund.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 1,
        minutesLostEach: 120,
        status: IdeaStatus.promoted,
        workstreamId: wsRail.id,
      },
      {
        title: "Register agents under participant identity",
        description:
          "Registry lists each agent, owner participant, endpoint and scopes. No consumer chatbot IDs.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsTrust.id,
      },
      {
        title: "Signed mandates for bulk rebalances",
        description:
          "Client list, target model, max value, expiry and named approver travel with the orders.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsTrust.id,
      },
      {
        title: "Score orders for fail or late settlement",
        description:
          "Network model with partner consent. Ties to UK and EU T+1 pressure in 2027.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "Agree GIDS data consent with SS&C",
        description:
          "Register-side data fills holdings gaps only with explicit consent or a contribute-to-receive pool.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "Draft agent ID fields for UKFMPG",
        description:
          "Optional initiating agent ID and mandate reference in fund order messages.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "Open fund-dealing MCP profile",
        description:
          "Publish tool definitions openly so vendors can build without a bilateral deal.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "Join Agentic AI Foundation working item",
        description:
          "Propose a financial services item and contribute the fund dealing profile.",
        submittedById: leon.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Meet FCA AI Lab on fund dealing trust",
        description:
          "Extend Know Your Agent conversations from payments into fund dealing with Calastone as industry pilot.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Segment views instead of named distributors",
        description:
          "Safer Data Insights design until distributors opt in. Avoid green-space leaks.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 3,
        minutesLostEach: 30,
        status: IdeaStatus.new,
      },
      {
        title: "Scope FE fundinfo for peer comparison",
        description:
          "Layer 2 needs licensed fund data Calastone does not hold. Pitch flows plus FE, not against data vendors.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
      {
        title: "Show managers repair cost avoided",
        description:
          "Counter higher agent message volume with a clear saving report per fund manager.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 1,
        minutesLostEach: 60,
        status: IdeaStatus.new,
      },
      {
        title: "Park named-distributor wallet share",
        description:
          "Needs distributor opt-in. Park until legal review of green space and consent is done.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.parked,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.seed,
      userId: alex.id,
      detail: "Seeded strategy-aligned workstreams and ideas for agent infrastructure demo.",
    },
  });

  void runnerRail;
  console.log("Seed complete: 5 strategy workstreams, ideas board content, MCP connectors story.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
