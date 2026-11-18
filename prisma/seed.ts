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

  // 1. Context — in review
  const wsContext = await prisma.workstream.create({
    data: {
      title: "Share dealing info with partner teams",
      problemStatement:
        "Partner agents need dealing rules, order status and exceptions before they can help. Use the same company sources the chatbot already reads, with Relay as a first internal client.",
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
      title: "Run one approved savings or rebalance pilot",
      problemStatement:
        "Start with ops helpers and one low-risk write flow (regular savings or model rebalance). Every order needs a named person to approve, plus clear stops if something goes wrong.",
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
      title: "Know which agents can act for each firm",
      problemStatement:
        "Calastone already knows every participant. Extend that to the helpers they run: who owns them, what they may do, signed mandates, and a clear trail on each order.",
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
      title: "Spot orders likely to fail before settlement",
      problemStatement:
        "With clear partner consent, combine order flow with register-side signals. Flag rejection and late settlement risk earlier, before T+1 pressure rises.",
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
      title: "Agree agent fields with UK market groups",
      problemStatement:
        "Fund orders name the trade but not the helper that started them. Draft optional fields and take them to UK market groups with SS&C and two platforms as co-sponsors.",
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

  // Extra workstreams so Overview and lists feel full
  const wsCoverage = await prisma.workstream.create({
    data: {
      title: "Explain coverage in plain language",
      problemStatement:
        "Partners ask whether coverage is by value or by count. Agree one wording before any client demo.",
      stage: WorkstreamStage.planning,
      jiraKey: "INNO-315",
      origin: WorkstreamOrigin.internal_friction,
      priority: WorkstreamPriority.medium,
      color: WORKSTREAM_COLOURS.context,
      ownerId: leon.id,
      lastActivityAt: hoursAgo(8),
    },
  });

  const wsRepair = await prisma.workstream.create({
    data: {
      title: "Cut repair time when an order breaks",
      problemStatement:
        "When an order fails, platforms, TAs and managers still chase each other by email. Make a clear repair path with named owners.",
      stage: WorkstreamStage.building,
      jiraKey: "INNO-316",
      origin: WorkstreamOrigin.internal_friction,
      priority: WorkstreamPriority.high,
      color: WORKSTREAM_COLOURS.rail,
      ownerId: alex.id,
      lastActivityAt: hoursAgo(3),
    },
  });

  const wsInvite = await prisma.workstream.create({
    data: {
      title: "Invite two platforms to a shared pilot",
      problemStatement:
        "Design partners need a short invite pack: what they get, what they share, and how to stop.",
      stage: WorkstreamStage.idea,
      jiraKey: "INNO-317",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.medium,
      color: WORKSTREAM_COLOURS.trust,
      ownerId: aisha.id,
      lastActivityAt: hoursAgo(10),
    },
  });

  const wsOpenProfile = await prisma.workstream.create({
    data: {
      title: "Publish a simple open dealing profile",
      problemStatement:
        "Vendors should not need a bilateral deal just to try basic dealing helpers. Publish a short open profile.",
      stage: WorkstreamStage.research,
      jiraKey: "INNO-318",
      origin: WorkstreamOrigin.external_opportunity,
      priority: WorkstreamPriority.low,
      color: WORKSTREAM_COLOURS.standards,
      ownerId: owen.id,
      lastActivityAt: hoursAgo(12),
    },
  });

  const wsWeeklyNote = await prisma.workstream.create({
    data: {
      title: "Send managers a weekly cost-avoided note",
      problemStatement:
        "Message volume will rise with helpers. Offset that with a clear weekly note on rejects avoided and repair time saved.",
      stage: WorkstreamStage.in_review,
      jiraKey: "INNO-319",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.medium,
      color: WORKSTREAM_COLOURS.collective,
      ownerId: leon.id,
      lastActivityAt: hoursAgo(5),
    },
  });

  await prisma.plan.create({
    data: {
      workstreamId: wsWeeklyNote.id,
      versionNumber: 1,
      status: PlanStatus.in_review,
      markdownBody:
        "# Plan: Weekly cost-avoided note\n\n1. Pick two metrics\n2. Draft the manager email\n3. Pilot with one design partner",
      steps: {
        create: [
          {
            order: 1,
            title: "Pick two metrics",
            description: "Rejects avoided and repair minutes saved.",
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Draft the note",
            description: "One page, plain language, no jargon.",
            riskLevel: RiskLevel.low,
          },
        ],
      },
    },
  });

  await prisma.idea.createMany({
    data: [
      {
        title: "Publish dealing rules for partners",
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
          "Show messages, flows delivered and cost per pound of flow before any upsell conversation.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 2,
        minutesLostEach: 40,
        status: IdeaStatus.promoted,
        workstreamId: wsContext.id,
      },
      {
        title: "Use Relay as the first internal client",
        description:
          "Point Scout and Knowledge at the same company sources as the chatbot so we learn on our own work first.",
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
        title: "Add a stop button per helper",
        description:
          "Throttles, duplicate checks and a clear stop so one faulty helper cannot flood a fund.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 1,
        minutesLostEach: 120,
        status: IdeaStatus.promoted,
        workstreamId: wsRail.id,
      },
      {
        title: "List helpers under the firm that owns them",
        description:
          "Each helper has an owner firm, what it may do, and how to reach the person in charge.",
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
        title: "Flag orders that may fail or settle late",
        description:
          "With partner consent, score risk earlier. Ties to UK and EU settlement pressure in 2027.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "Agree data sharing rules with SS&C",
        description:
          "Register-side data fills holdings gaps only with explicit consent or a contribute-to-receive pool.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "Draft optional agent fields for market groups",
        description:
          "Optional initiating helper ID and mandate reference on fund order messages.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "Publish an open dealing profile",
        description:
          "A short public profile so vendors can try basic helpers without a bilateral deal.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "One coverage definition for demos",
        description:
          "Agree value vs count language so partner demos do not contradict each other.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsCoverage.id,
      },
      {
        title: "Named owners on the repair path",
        description:
          "When an order breaks, everyone should know who answers first at platform, TA and manager.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 4,
        minutesLostEach: 45,
        status: IdeaStatus.promoted,
        workstreamId: wsRepair.id,
      },
      {
        title: "Short invite pack for two platforms",
        description:
          "What they get, what they share, how to stop. Keep legal light for the first pilot.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsInvite.id,
      },
      {
        title: "Open profile sketch for vendors",
        description:
          "Map the common dealing asks into a short open card vendors can implement.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsOpenProfile.id,
      },
      {
        title: "Weekly cost-avoided email for managers",
        description:
          "Two numbers and one sentence. No dashboard required for the first pilot.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsWeeklyNote.id,
      },
      {
        title: "Join an industry working item on helpers",
        description:
          "Propose a financial services item and contribute the fund dealing profile.",
        submittedById: leon.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Meet the FCA AI Lab on fund dealing trust",
        description:
          "Extend Know Your Agent conversations from payments into fund dealing with Calastone as industry pilot.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Plain-language exception labels",
        description:
          "Ops teams still decode opaque codes. Agree a short shared label set for the top ten failures.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 8,
        minutesLostEach: 10,
        status: IdeaStatus.triaged,
      },
      {
        title: "Office-hours slot for design partners",
        description:
          "A weekly drop-in so partners can raise blockers without opening a new ticket every time.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.triaged,
      },
      {
        title: "Segment views instead of named distributors",
        description:
          "Safer Insights design until distributors opt in. Avoid green-space leaks.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 3,
        minutesLostEach: 30,
        status: IdeaStatus.new,
      },
      {
        title: "Licensed peer data for comparisons",
        description:
          "Peer views need licensed fund data Calastone does not hold. Pitch flows plus a data partner, not against vendors.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
      {
        title: "Show managers repair cost avoided",
        description:
          "Counter higher helper message volume with a clear saving report per fund manager.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 1,
        minutesLostEach: 60,
        status: IdeaStatus.new,
      },
      {
        title: "Template answers for Runner questions",
        description:
          "Common pause questions should have ready answers so owners do not rewrite the same reply.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 6,
        minutesLostEach: 8,
        status: IdeaStatus.new,
      },
      {
        title: "Partner success story one-pager",
        description:
          "A short internal note when a pilot hits its first week of rejects avoided.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
      {
        title: "Calm alerts when helpers go quiet",
        description:
          "If a helper stops sending heartbeats, notify the owner firm without paging the whole ops floor.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.new,
      },
      {
        title: "Shared glossary for Scout findings",
        description:
          "Scout summaries mix platform and TA terms. One short glossary keeps plans readable.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
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
      {
        title: "Park live write access for chatbots",
        description:
          "Consumer chatbots must not place orders. Keep this parked while trust work lands.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.parked,
      },
      {
        title: "Park cross-border mandate reuse",
        description:
          "Interesting later, but consent rules differ by market. Park until UK pilot is stable.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.parked,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.seed,
      userId: alex.id,
      detail: "Seeded strategy workstreams and a fuller Ideas board for the agent demo.",
    },
  });

  void runnerRail;
  console.log(
    "Seed complete: 10 workstreams, expanded Ideas board, shared company sources story.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
