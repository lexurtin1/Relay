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

const prisma = new PrismaClient();

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

  // 1. ISIN validation tool - in_review, plan v2, 3 open comments
  const ws1 = await prisma.workstream.create({
    data: {
      title: "Add ISIN validation tool to the Calastone MCP server",
      problemStatement:
        "Engineers repeatedly re-implement ISIN checks across tools. Expose a shared validation tool on the fictional Calastone MCP server with clear error codes.",
      stage: WorkstreamStage.in_review,
      jiraKey: "INNO-214",
      origin: WorkstreamOrigin.internal_friction,
      priority: WorkstreamPriority.high,
      ownerId: alex.id,
      lastActivityAt: hoursAgo(2),
    },
  });

  await prisma.plan.create({
    data: {
      workstreamId: ws1.id,
      versionNumber: 1,
      status: PlanStatus.superseded,
      markdownBody:
        "# Plan v1\n\n1. Add ISIN regex helper\n2. Wire MCP tool\n3. Add unit tests",
      steps: {
        create: [
          {
            order: 1,
            title: "Add ISIN helper",
            description: "Create a shared validator module.",
            filesLikelyTouched: ["packages/mcp/src/isin.ts"],
            testsToAdd: ["isin.test.ts"],
            riskLevel: RiskLevel.low,
          },
        ],
      },
    },
  });

  const plan1v2 = await prisma.plan.create({
    data: {
      workstreamId: ws1.id,
      versionNumber: 2,
      status: PlanStatus.in_review,
      markdownBody: `# Plan: ISIN validation tool

## Goal
Add a read-only \`validate_isin\` tool to the fictional Calastone MCP server so other agents reuse one implementation.

## Steps
1. Extract checksum and format rules into \`packages/mcp/src/isin.ts\`.
2. Register the tool with structured error codes for format and checksum failures.
3. Add Vitest coverage for valid, invalid checksum, and malformed inputs.
4. Document the tool in the MCP server README with a short example.
`,
      steps: {
        create: [
          {
            order: 1,
            title: "Extract ISIN validator",
            description: "Move format and checksum logic into a shared module.",
            filesLikelyTouched: ["packages/mcp/src/isin.ts"],
            testsToAdd: ["packages/mcp/src/isin.test.ts"],
            riskLevel: RiskLevel.low,
          },
          {
            order: 2,
            title: "Register MCP tool",
            description: "Expose validate_isin with structured errors.",
            filesLikelyTouched: ["packages/mcp/src/tools.ts"],
            testsToAdd: ["packages/mcp/src/tools.isin.test.ts"],
            riskLevel: RiskLevel.medium,
          },
          {
            order: 3,
            title: "Document and example",
            description: "Update README with usage example.",
            filesLikelyTouched: ["packages/mcp/README.md"],
            testsToAdd: [],
            riskLevel: RiskLevel.low,
          },
        ],
      },
    },
    include: { steps: true },
  });

  await prisma.comment.createMany({
    data: [
      {
        planId: plan1v2.id,
        stepId: plan1v2.steps[1]?.id,
        authorId: aisha.id,
        anchorText: "structured error codes",
        body: "Please list the exact error code strings so clients can branch on them.",
        resolved: false,
      },
      {
        planId: plan1v2.id,
        authorId: owen.id,
        anchorText: "checksum and format rules",
        body: "Confirm we follow ISO 6166 and reject country codes outside the demo allowlist.",
        resolved: false,
      },
      {
        planId: plan1v2.id,
        authorId: leon.id,
        anchorText: "Document the tool",
        body: "Add a note that this tool is read-only and must not call live market data.",
        resolved: false,
      },
    ],
  });

  // 2. Reconciliation exceptions - building, runner mid-run with events
  const ws2 = await prisma.workstream.create({
    data: {
      title: "Automate triage of reconciliation exceptions",
      problemStatement:
        "Ops analysts spend hours sorting fictional reconciliation exceptions. Propose automated triage buckets with an audit trail.",
      stage: WorkstreamStage.building,
      jiraKey: "INNO-188",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.high,
      ownerId: owen.id,
      lastActivityAt: minutesAgo(12),
    },
  });

  const plan2 = await prisma.plan.create({
    data: {
      workstreamId: ws2.id,
      versionNumber: 1,
      status: PlanStatus.approved,
      markdownBody:
        "# Plan: Reconciliation exception triage\n\n1. Model exception buckets\n2. Add classifier service\n3. Write audit events\n4. Add UI queue filters",
      steps: {
        create: [
          {
            order: 1,
            title: "Model buckets",
            description: "Define enum and persistence for triage buckets.",
            filesLikelyTouched: ["apps/ops/src/triage/types.ts"],
            testsToAdd: ["types.test.ts"],
            riskLevel: RiskLevel.low,
            completed: true,
          },
          {
            order: 2,
            title: "Classifier service",
            description: "Rule-based classifier over synthetic exceptions.",
            filesLikelyTouched: ["apps/ops/src/triage/classifier.ts"],
            testsToAdd: ["classifier.test.ts"],
            riskLevel: RiskLevel.medium,
            completed: false,
          },
          {
            order: 3,
            title: "Audit trail",
            description: "Persist who or what assigned each bucket.",
            filesLikelyTouched: ["apps/ops/src/triage/audit.ts"],
            testsToAdd: ["audit.test.ts"],
            riskLevel: RiskLevel.medium,
            needsConfirmation: true,
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: { planId: plan2.id, approverId: aisha.id },
  });

  const job2 = await prisma.runnerJob.create({
    data: {
      workstreamId: ws2.id,
      planId: plan2.id,
      status: RunnerJobStatus.running,
      workspacePath: "/worktrees/recon-triage",
      branch: "relay/recon-triage-demo",
      startedAt: hoursAgo(1),
    },
  });

  const replayEvents = [
    {
      type: AgentEventType.status,
      payload: { message: "Provisioning worktree from demo-repos/ops-tools" },
      createdAt: minutesAgo(55),
    },
    {
      type: AgentEventType.thought_summary,
      payload: {
        summary: "Starting with bucket model before classifier rules.",
      },
      createdAt: minutesAgo(50),
    },
    {
      type: AgentEventType.file_edit,
      payload: {
        path: "apps/ops/src/triage/types.ts",
        diff: "+ export type TriageBucket = 'mismatch' | 'late' | 'duplicate' | 'manual';",
      },
      createdAt: minutesAgo(42),
    },
    {
      type: AgentEventType.test_run,
      payload: { command: "pnpm test triage", passed: true, summary: "3 passed" },
      createdAt: minutesAgo(35),
    },
    {
      type: AgentEventType.tool_call,
      payload: { tool: "read_file", args: { path: "apps/ops/src/triage/classifier.ts" } },
      createdAt: minutesAgo(20),
    },
    {
      type: AgentEventType.thought_summary,
      payload: {
        summary: "Implementing rule-based classifier for synthetic exception codes.",
      },
      createdAt: minutesAgo(12),
    },
  ];

  for (const event of replayEvents) {
    await prisma.agentEvent.create({
      data: {
        runnerJobId: job2.id,
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
      },
    });
  }

  // 3. Fund Launch Radar - awaiting_input
  const ws3 = await prisma.workstream.create({
    data: {
      title: "Fund Launch Radar: ingest new fund launch notices",
      problemStatement:
        "Leads want a radar of fictional new fund launches. Need an ingest path that prefers one authoritative source when notices disagree.",
      stage: WorkstreamStage.awaiting_input,
      jiraKey: "INNO-201",
      origin: WorkstreamOrigin.external_opportunity,
      priority: WorkstreamPriority.medium,
      ownerId: alex.id,
      lastActivityAt: minutesAgo(8),
    },
  });

  const plan3 = await prisma.plan.create({
    data: {
      workstreamId: ws3.id,
      versionNumber: 1,
      status: PlanStatus.approved,
      markdownBody:
        "# Plan: Fund Launch Radar ingest\n\n1. Define notice schema\n2. Ingest adapters\n3. Conflict resolution\n4. Dashboard card",
      steps: {
        create: [
          {
            order: 1,
            title: "Notice schema",
            description: "Shared type for launch notices.",
            filesLikelyTouched: ["apps/radar/src/schema.ts"],
            testsToAdd: ["schema.test.ts"],
            riskLevel: RiskLevel.low,
            completed: true,
          },
          {
            order: 2,
            title: "Ingest adapters",
            description: "Pull from Confluence and Salesforce mock feeds.",
            filesLikelyTouched: ["apps/radar/src/ingest.ts"],
            testsToAdd: ["ingest.test.ts"],
            riskLevel: RiskLevel.medium,
            needsConfirmation: true,
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: { planId: plan3.id, approverId: aisha.id },
  });

  const job3 = await prisma.runnerJob.create({
    data: {
      workstreamId: ws3.id,
      planId: plan3.id,
      status: RunnerJobStatus.awaiting_input,
      workspacePath: "/worktrees/fund-launch-radar",
      branch: "relay/fund-launch-radar-demo",
      startedAt: hoursAgo(3),
    },
  });

  await prisma.question.create({
    data: {
      runnerJobId: job3.id,
      questionText:
        "Which source should be authoritative when Confluence and Salesforce disagree on a fund launch notice date?",
      options: ["Confluence page", "Salesforce opportunity", "Ask a human each time"],
    },
  });

  await prisma.agentEvent.create({
    data: {
      runnerJobId: job3.id,
      type: AgentEventType.question,
      payload: {
        summary: "Paused for authoritative source choice.",
      },
      createdAt: minutesAgo(8),
    },
  });

  // 4. Weekly pipeline report - pr_open
  const ws4 = await prisma.workstream.create({
    data: {
      title: "Weekly pipeline report generator for the CCO",
      problemStatement:
        "Produce a weekly fictional pipeline summary for the CCO from Power BI exports and Salesforce stages.",
      stage: WorkstreamStage.pr_open,
      jiraKey: "INNO-176",
      origin: WorkstreamOrigin.roadmap,
      priority: WorkstreamPriority.medium,
      ownerId: owen.id,
      lastActivityAt: hoursAgo(6),
    },
  });

  const plan4 = await prisma.plan.create({
    data: {
      workstreamId: ws4.id,
      versionNumber: 1,
      status: PlanStatus.approved,
      markdownBody:
        "# Plan: Weekly CCO pipeline report\n\n1. Query Salesforce stages\n2. Join Power BI volumes\n3. Render markdown report\n4. Schedule weekly job",
      steps: {
        create: [
          {
            order: 1,
            title: "Salesforce stage query",
            description: "Read opportunity stages from mock connector.",
            filesLikelyTouched: ["apps/reports/src/salesforce.ts"],
            testsToAdd: ["salesforce.test.ts"],
            riskLevel: RiskLevel.low,
            completed: true,
          },
          {
            order: 2,
            title: "Report renderer",
            description: "Markdown report with totals by region.",
            filesLikelyTouched: ["apps/reports/src/render.ts"],
            testsToAdd: ["render.test.ts"],
            riskLevel: RiskLevel.low,
            completed: true,
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: { planId: plan4.id, approverId: aisha.id },
  });

  const job4 = await prisma.runnerJob.create({
    data: {
      workstreamId: ws4.id,
      planId: plan4.id,
      status: RunnerJobStatus.succeeded,
      workspacePath: "/worktrees/cco-report",
      branch: "relay/cco-weekly-report",
      prUrl: "https://github.com/example-calastone/demo-ops-tools/pull/42",
      startedAt: hoursAgo(10),
      finishedAt: hoursAgo(6),
    },
  });

  await prisma.agentEvent.create({
    data: {
      runnerJobId: job4.id,
      type: AgentEventType.status,
      payload: {
        message: "Reviewer summary: plan covered; tests present; no risky files flagged.",
        reviewer: {
          ok: true,
          flags: [],
          summary:
            "Diff matches the approved plan. Report renderer and Salesforce query are covered by unit tests.",
        },
      },
      createdAt: hoursAgo(6),
    },
  });

  // 5. Client onboarding checklist - research
  const ws5 = await prisma.workstream.create({
    data: {
      title: "Client onboarding checklist assistant",
      problemStatement:
        "New fictional distributor onboarding still relies on tribal knowledge. Research current Confluence checklists and Salesforce stages to propose an assistant.",
      stage: WorkstreamStage.research,
      jiraKey: "INNO-220",
      origin: WorkstreamOrigin.internal_friction,
      priority: WorkstreamPriority.medium,
      ownerId: alex.id,
      lastActivityAt: hoursAgo(1),
    },
  });

  await prisma.researchRun.create({
    data: {
      workstreamId: ws5.id,
      status: ResearchRunStatus.running,
      sourcesConsulted: [
        {
          connector: "confluence",
          itemId: "conf-onboarding-1",
          title: "Distributor onboarding checklist (fictional)",
        },
      ],
      findings: null,
      tokenUsage: 1200,
      startedAt: hoursAgo(1),
      events: {
        create: [
          {
            type: AgentEventType.tool_call,
            payload: {
              tool: "search_confluence",
              args: { query: "distributor onboarding checklist" },
            },
            createdAt: minutesAgo(50),
          },
          {
            type: AgentEventType.thought_summary,
            payload: {
              summary:
                "Found onboarding checklist pages and related Salesforce stage names. Gathering constraints next.",
            },
            createdAt: minutesAgo(40),
          },
        ],
      },
    },
  });

  await prisma.idea.createMany({
    data: [
      {
        title: "Manual ISIN checks in three tools",
        description:
          "Engineers copy ISIN regex between MCP tools, LibreChat modules, and ad-hoc scripts.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 8,
        minutesLostEach: 15,
        status: IdeaStatus.promoted,
        workstreamId: ws1.id,
      },
      {
        title: "Reconciliation exception sorting by hand",
        description: "Ops paste exception CSV into sheets and tag rows manually.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 5,
        minutesLostEach: 90,
        status: IdeaStatus.promoted,
        workstreamId: ws2.id,
      },
      {
        title: "Waiting on Confluence for onboarding steps",
        description: "New joiners cannot find the latest distributor checklist.",
        submittedById: alex.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 3,
        minutesLostEach: 40,
        status: IdeaStatus.promoted,
        workstreamId: ws5.id,
      },
      {
        title: "Jira status hunting across Innovation epics",
        description: "Stand-ups spend time finding the right epic updates.",
        submittedById: owen.id,
        type: IdeaType.friction_log,
        frequencyPerWeek: 4,
        minutesLostEach: 20,
        status: IdeaStatus.new,
      },
      {
        title: "Client asked about fund launch visibility",
        description:
          "At a fictional industry roundtable, a distributor lead asked for earlier visibility of new fund launches.",
        submittedById: leon.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.promoted,
        workstreamId: ws3.id,
      },
      {
        title: "Conference signal: agent-ready order APIs",
        description:
          "A fictional conference panel discussed exposing order status to internal agents with strict rate limits.",
        submittedById: leon.id,
        type: IdeaType.external_signal,
        status: IdeaStatus.new,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.seed,
      detail: "Milestone 1 demo seed applied",
      userId: leon.id,
    },
  });

  console.log("Seeded Relay demo data:");
  console.log(`  users=${5} workstreams=${5} ideas=${6}`);
  console.log(`  viewer=${vera.email} (read-only demo user)`);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
