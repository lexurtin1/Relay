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


  // 1. Context layer — in review
  const wsContext = await prisma.workstream.create({
    data: {
      title: "Ship client key, governed metrics and private MCP",
      problemStatement:
        "Every goal reads the context layer. Ship one client key, governed metrics, fund enrichment, entitlements and private MCP before paid Data Insights or agent writes.",
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
        "# Plan v1\n\n1. Ship client key mapping\n2. Wire entitlements\n3. Pilot private MCP",
      steps: {
        create: [
          {
            order: 1,
            title: "Ship client key mapping",
            description: "calastone_client_id plus LEI, BIC, Salesforce and SS&C maps.",
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Wire entitlements",
            description: "Unity Catalog tags, row filters and data-rule policy.",
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
        "# Plan: Context layer foundations\n\n## Goal\nGive every goal the same entitled gold tables: one client key, signed-off metrics, fund enrichment and private MCP.\n\n## Steps\n1. Ship calastone_client_id mapping and governed metric definitions\n2. Publish private MCP tools and point Relay at them\n3. Pilot free flow statement once metrics reconcile to billing within 0.1%\n4. Pass row filters, masks and data-rule policy before any paid Insights module",
      steps: {
        create: [
          {
            order: 1,
            title: "Ship client key and metrics",
            description: "calastone_client_id mapping table and signed-off governed metrics.",
            filesLikelyTouched: ["packages/mcp/tools"],
            testsToAdd: ["tool contract tests"],
            riskLevel: RiskLevel.medium,
            needsConfirmation: false,
          },
          {
            order: 2,
            title: "Connect Relay to private MCP",
            description: "Scout uses order_status, flows_summary and dealing_rules.",
            riskLevel: RiskLevel.low,
          },
          {
            order: 3,
            title: "Pilot free flow statement",
            description: "Five UK managers once the statement reconciles to billing within 0.1%.",
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
        body: "Confirm entitlements sit in Unity Catalog and the policy service, not in prompts.",
        resolved: false,
      },
      {
        planId: planContextV2.id,
        authorId: leon.id,
        body: "Add Datadog latency checks for private MCP to the pilot checklist.",
        resolved: false,
      },
      {
        planId: planContextV2.id,
        authorId: owen.id,
        body: "Flow statement narrative must pass the verifier against gold table cells.",
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
          title: "Client key and private MCP tools (draft)",
          itemId: "conf-client-key",
        },
        {
          connector: "jira",
          title: "INNO-310 context layer",
          itemId: "INNO-310",
        },
        {
          connector: "datadog",
          title: "Private MCP latency dashboard",
          itemId: "mcp-tool-latency",
        },
        {
          connector: "github",
          title: "packages/mcp/src/tools",
          itemId: "gh-tools",
        },
      ],
      findings:
        "Client key and metric drafts exist in Confluence. Datadog covers private MCP latency. Relay is listed as first internal MCP client in the technical roadmap.",
      tokenUsage: 4200,
      startedAt: hoursAgo(6),
      finishedAt: hoursAgo(5),
      events: {
        create: [
          {
            type: AgentEventType.status,
            payload: { text: "Researching client key and governed metrics across Confluence and Jira" },
            createdAt: hoursAgo(6),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "confluence.search", query: "client key private MCP" },
            createdAt: hoursAgo(5.9),
          },
          {
            type: AgentEventType.tool_result,
            payload: { tool: "confluence.search", title: "Client key and mapping table (draft)" },
            createdAt: hoursAgo(5.8),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "datadog.get_dashboard", id: "mcp-tool-latency" },
            createdAt: hoursAgo(5.7),
          },
          {
            type: AgentEventType.status,
            payload: { text: "Interpreting private MCP tools for the context layer exit" },
            createdAt: hoursAgo(5.5),
          },
        ],
      },
    },
  });

  // 2. Transaction layer — awaiting input (Runner paused)
  const wsRail = await prisma.workstream.create({
    data: {
      title: "Pilot transfer completion with two platforms",
      problemStatement:
        "Transfer completion needs rejection prediction, repair suggestions and orchestration with chasing. Price on success; start with two platforms.",
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
        "# Plan: Transfer completion pilot\n\n1. Choose rejection-only versus full orchestration with chasing\n2. Wire pre-submission checks to the rejection model\n3. Measure completion rate and days to complete",
      steps: {
        create: [
          {
            order: 1,
            title: "Choose pilot depth",
            description: "Rejection prediction only, or full orchestration with chasing.",
            completed: true,
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Wire pre-submission checks",
            description: "Rejection model and repair suggestions before the network sees the request.",
            completed: true,
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
          {
            order: 3,
            title: "Add timers and chasing",
            description: "Automatic chase of the ceding party; escalate past target time.",
            completed: false,
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
          {
            order: 4,
            title: "Report completion outcomes",
            description: "Completion rate, days to complete, revenue per completed transfer.",
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
      branch: "relay/transfer-completion-pilot",
      additionalInstructions: "Prefer full orchestration with chasing if both platforms are ready.",
      tokenUsage: 8100,
      startedAt: hoursAgo(3),
      questions: {
        create: [
          {
            questionText:
              "Should the transfer completion pilot start with rejection prediction only, or full orchestration with chasing?",
            options: [
              "Rejection prediction only",
              "Full orchestration with chasing",
              "Ask architect",
            ],
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
            payload: { text: "Pilot depth choice needed" },
            createdAt: hoursAgo(1),
          },
        ],
      },
    },
  });

  // 3. Trust layer — research
  const wsTrust = await prisma.workstream.create({
    data: {
      title: "Stand up consent records and identity federation",
      problemStatement:
        "Data Insights and network models need identity federation and consent records before any aggregated query. Map every request to calastone_client_id.",
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
          title: "Consent service and identity federation (draft)",
          itemId: "conf-consent",
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
            payload: { text: "Researching consent records and identity federation patterns" },
            createdAt: hoursAgo(4),
          },
          {
            type: AgentEventType.tool_call,
            payload: { tool: "confluence.search", query: "consent identity federation" },
            createdAt: hoursAgo(3.9),
          },
          {
            type: AgentEventType.tool_result,
            payload: { tool: "confluence.search", title: "Consent service and identity federation (draft)" },
            createdAt: hoursAgo(3.8),
          },
          {
            type: AgentEventType.status,
            payload: { text: "Interpreting policy service and audit ledger requirements" },
            createdAt: hoursAgo(3.5),
          },
        ],
      },
    },
  });

  // 4. Intelligence layer — planning
  const wsCollective = await prisma.workstream.create({
    data: {
      title: "Train transfer rejection prediction on history",
      problemStatement:
        "Train a gradient-boosted classifier on transfers history with reject reasons. Shadow mode first; precision agreed with pilot platforms before client release.",
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
        "# Plan: Transfer rejection model\n\n1. Build labelled evaluation set from history\n2. Train classifier with reason codes in MLflow\n3. Run shadow mode for one to two months\n4. Agree precision threshold with two pilot platforms",
      steps: {
        create: [
          {
            order: 1,
            title: "Build evaluation set",
            description: "Labelled transfer outcomes with reject reasons and completeness.",
            riskLevel: RiskLevel.medium,
            needsConfirmation: false,
          },
          {
            order: 2,
            title: "Train and register model",
            description: "MLflow registry; train only where clients consented.",
            riskLevel: RiskLevel.medium,
          },
          {
            order: 3,
            title: "Shadow mode",
            description: "Compare predictions with outcomes before any client sees scores.",
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
        ],
      },
    },
  });

  // 5. Standards — merged example
  const wsStandards = await prisma.workstream.create({
    data: {
      title: "Draft agent ID and mandate fields for UKFMPG",
      problemStatement:
        "Fund orders name the trade but not the agent that started them. Draft optional agent ID and mandate reference for setr messages via UKFMPG.",
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
      title: "Pilot free flow statement with five UK managers",
      problemStatement:
        "Goal 1: monthly PDF and web view plus flows_summary MCP. Gold table must reconcile to billing within 0.1%; narrative passes the verifier.",
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
      title: "Build transfer repair suggestions for ops",
      problemStatement:
        "Rules first, language model for free-text fields. Suggested corrections for a person to approve until accuracy justifies removing review.",
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
      title: "Design AI intake pilot with one transfer agent",
      problemStatement:
        "Start with one TA and its long tail of distributors who still send email, PDF or fax. Full human review first, then lower review per field as accuracy is proven.",
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
      title: "Publish open fund-dealing agent profile",
      problemStatement:
        "MCP tools and A2A agent card for fund dealing, contributed as an open profile for partners and neo-brokers.",
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
      title: "Ship Data Insights own-book and segment demand",
      problemStatement:
        "Goal 2 modules 1 and 2 for the UK: own-book share of category and segment demand with minimum-cell rules. Paid modules after the context layer exit.",
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
        "# Plan: Data Insights layer 1\n\n1. Own-book module against the relationship table\n2. Segment demand with minimum-cell rules\n3. Pilot with UK managers after flow statement",
      steps: {
        create: [
          {
            order: 1,
            title: "Own-book module",
            description: "Share of category within distributors already dealing the manager's funds.",
            riskLevel: RiskLevel.medium,
          },
          {
            order: 2,
            title: "Segment demand",
            description: "At least five firms per cell; no single firm dominant.",
            riskLevel: RiskLevel.high,
            needsConfirmation: true,
          },
        ],
      },
    },
  });

  await prisma.idea.createMany({
    data: [
      {
        title: "One Calastone client key with LEI and Salesforce maps",
        description:
          "Canonical calastone_client_id from client_client.Id, plus mapping to LEI, BIC, Salesforce and SS&C IDs. Resolve the 274 unmapped clients.",
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
          "Monthly gold table of gross and net flows with cost per pound of flow, verifier-checked narrative, and flows_summary MCP tool.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 2,
        minutesLostEach: 40,
        status: IdeaStatus.promoted,
        workstreamId: wsCoverage.id,
      },
      {
        title: "Use Relay as first internal MCP client",
        description:
          "Point Scout and Knowledge at private MCP tools so the team dogfoods the context layer.",
        submittedById: alex.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsContext.id,
      },
      {
        title: "Transfer orchestration with timers and chasing",
        description:
          "Workflow over Calastone Transfers: pre-submission check, repair, submission, chase, complete. Success-based pricing on completion.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 5,
        minutesLostEach: 25,
        status: IdeaStatus.promoted,
        workstreamId: wsRail.id,
      },
      {
        title: "Kill switches and throttles at the edge gateway",
        description:
          "Per-agent and per-client caps, duplicate detection and kill switches before any unattended agent order.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 1,
        minutesLostEach: 120,
        status: IdeaStatus.promoted,
        workstreamId: wsRail.id,
      },
      {
        title: "Consent service for benchmark pools and matching",
        description:
          "Versioned records per client for benchmarking contribution, opt-in distributor matching and GIDS data use.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsTrust.id,
      },
      {
        title: "Signed mandates for agent ordering pilots",
        description:
          "Approving person, client, funds, accounts, side, maximum value, expiry and whether each order needs approval.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsTrust.id,
      },
      {
        title: "Gradient-boosted transfer rejection classifier",
        description:
          "Train on transfers history with reject reasons. Output rejection probability and likely cause per request.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "Agree data separation rules with SS&C",
        description:
          "Written rules on how Calastone network data may and may not be used by SS&C businesses.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsCollective.id,
      },
      {
        title: "ISO 20022 agent ID and mandate reference fields",
        description:
          "Optional initiating agent ID and mandate reference on setr messages via UKFMPG.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "Publish open fund-dealing agent profile",
        description:
          "MCP tools and A2A agent card for partners and neo-brokers, contributed to the Agentic AI Foundation.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsStandards.id,
      },
      {
        title: "Monthly flow statement gold table and narrative",
        description:
          "flow_statement_monthly per manager with verifier-checked narrative reviewed by the relationship manager for the first three months.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsCoverage.id,
      },
      {
        title: "Human-reviewed transfer repair suggestions",
        description:
          "Rules first, language model for free-text fields. Keep human review until measured accuracy justifies removing it.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 4,
        minutesLostEach: 45,
        status: IdeaStatus.promoted,
        workstreamId: wsRepair.id,
      },
      {
        title: "AI intake inbox for one TA long tail",
        description:
          "Email, upload and fax-to-email into extract, validate, confirm with sender, then emit ISO 20022.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsInvite.id,
      },
      {
        title: "Open profile sketch for vendors",
        description:
          "Map common dealing asks into a short open card vendors can implement without a bilateral deal.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: wsOpenProfile.id,
      },
      {
        title: "Data Insights module 1 own book",
        description:
          "Share of category within each distributor already dealing the manager's funds. Enforce the data rule via the relationship table.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.promoted,
        workstreamId: wsWeeklyNote.id,
      },
      {
        title: "Contribute open dealing profile to Agentic AI Foundation",
        description:
          "MCP tools and A2A agent card for fund dealing as an open profile for partners.",
        submittedById: leon.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Pilot agent ordering inside FCA AI Live Testing",
        description:
          "Human approval on every order during pilots; seek FCA AI Lab coverage for the agent ordering path.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.triaged,
      },
      {
        title: "Silver cleaning rules for placeholder dates and IDs",
        description:
          "Turn 1900-01-01 and ClientId -1/-2/0 into nulls with reason codes; derive route in-use from 12 months of messages.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 8,
        minutesLostEach: 10,
        status: IdeaStatus.triaged,
      },
      {
        title: "Office-hours slot for five flow-statement pilots",
        description:
          "Weekly drop-in for the five UK managers on the Q2 flow statement pilot.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.triaged,
      },
      {
        title: "Segment demand with minimum-cell rules",
        description:
          "Flows by strategy, vehicle, market and distributor type. At least five firms per cell and no single firm above a set share.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 3,
        minutesLostEach: 30,
        status: IdeaStatus.new,
      },
      {
        title: "License FE fundinfo for peer comparison module",
        description:
          "Data Insights module 3 needs performance, fees and ratings joined on ISIN. FE already supplies Fund Flow Index sectors.",
        submittedById: owen.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
      {
        title: "White-label transfer status for advisers",
        description:
          "Platform console plus white-label status page and API so advisers and investors see where a transfer is.",
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
        title: "Fund Launch Radar feed for platforms",
        description:
          "Sell platforms a feed of launches and share class changes once fund master enrichment is live.",
        submittedById: vera.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
      {
        title: "Document extraction for faxed and emailed orders",
        description:
          "Vision-capable language model to a fixed schema with field confidence scores for the AI intake pilot.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.new,
      },
      {
        title: "Pass liquidity signals to GlobeOp Forward Redemption",
        description:
          "Daily redemption orders by fund and distributor type as a feature feed into SS&C's product, not a competing build.",
        submittedById: aisha.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.new,
      },
      {
        title: "Park named-distributor matching until opt-in",
        description:
          "Module 4 matching needs consented interest profiles. Park until consent clauses are in standard terms.",
        submittedById: aisha.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.parked,
      },
      {
        title: "Park unattended agent ordering",
        description:
          "No unattended orders until mandates, request signing, controls and kill switches clear the trust layer exit.",
        submittedById: leon.id,
        type: IdeaType.friction_log,
        status: IdeaStatus.parked,
      },
      {
        title: "Park tokenised fund dealing until paperwork is digital",
        description:
          "Tokenised and semi-liquid funds wait until transfer and intake have digitised the paperwork.",
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
      detail: "Seeded AI roadmap workstreams and Ideas board for the agent demo.",
    },
  });

  void runnerRail;
  console.log(
    "Seed complete: 10 roadmap workstreams, Ideas board aligned to Calastone AI technical roadmap.",
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
