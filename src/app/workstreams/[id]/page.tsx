import { notFound } from "next/navigation";
import { prisma } from "@relay/core";
import type { WorkstreamStage } from "@relay/core";
import { getCurrentUser } from "@/lib/session";
import { WorkstreamDetail } from "@/components/workstream-detail";
import type { ActionBarState } from "@/components/action-bar";
import { useDemoFixtures } from "@/lib/db";
import { getDemoAgentState } from "@/lib/demo-agent-store";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function WorkstreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  if (useDemoFixtures()) {
    const demo = getDemoWorkstreamDetail(id);
    if (!demo) notFound();
    const agent = getDemoAgentState(id);
    const openCommentCount = demo.plan.comments.filter((c) => !c.resolved).length;
    const role = user.role;
    const owns = demo.ownerId === user.id;
    const researchSummary = agent.researchSummary ?? demo.researchSummary;
    const planMarkdown = agent.planMarkdown ?? demo.plan.markdownBody;
    const planVersion = agent.planVersion ?? demo.plan.versionNumber;
    const stage = (agent.stage as WorkstreamStage | undefined) ?? (demo.stage as WorkstreamStage);
    const sources = agent.sources?.length ? agent.sources : demo.sources;
    const history = agent.history?.length ? agent.history : demo.history;
    const actionState: ActionBarState = {
      canGeneratePlan: Boolean(researchSummary),
      canRequestReview: false,
      canRevise: openCommentCount > 0,
      canApprove: false,
      canHandOff: false,
      openCommentCount,
      generateReason: researchSummary
        ? undefined
        : "Finish a research run before generating a plan.",
      reviewReason: "Plan is already in review.",
      reviseReason: undefined,
      approveReason: "Resolve or address open comments before approval.",
      handOffReason: !owns
        ? "You can only hand off workstreams you own."
        : "Needs at least one architect approval.",
    };

    return (
      <WorkstreamDetail
        id={demo.id}
        title={demo.title}
        problemStatement={demo.problemStatement}
        stage={stage}
        ownerName={demo.owner.name}
        origin={demo.origin}
        priority={demo.priority}
        jiraKey={demo.jiraKey}
        role={role}
        planVersion={planVersion}
        planTotalVersions={Math.max(2, planVersion)}
        planMarkdown={planMarkdown}
        steps={
          agent.planSteps?.map((step) => ({
            id: `demo-step-${step.order}`,
            order: step.order,
            title: step.title,
            description: step.description,
            filesLikelyTouched: step.filesLikelyTouched,
            testsToAdd: step.testsToAdd,
            riskLevel: step.riskLevel,
            completed: false,
            needsConfirmation: false,
          })) ??
          demo.plan.steps.map((step) => ({
            ...step,
            needsConfirmation: false,
          }))
        }
        comments={demo.plan.comments.map((comment) => ({
          id: comment.id,
          stepId: null,
          anchorText: comment.anchorText,
          body: comment.body,
          authorName: comment.author.name,
          resolved: comment.resolved,
        }))}
        researchSummary={researchSummary}
        sources={sources}
        history={history}
        openQuestion={demo.openQuestion}
        actionState={actionState}
        agentEvents={agent.events}
        canResearch
        canPlan={Boolean(researchSummary)}
      />
    );
  }

  const workstream = await prisma.workstream.findUnique({
    where: { id },
    include: {
      owner: true,
      plans: {
        include: {
          steps: { orderBy: { order: "asc" } },
          comments: {
            where: { parentId: null },
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
          approvals: true,
        },
        orderBy: { versionNumber: "desc" },
      },
      runnerJobs: {
        include: {
          questions: true,
          events: { orderBy: { createdAt: "desc" }, take: 30 },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      researchRuns: {
        include: { events: { orderBy: { createdAt: "desc" }, take: 30 } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!workstream) notFound();

  const plan = workstream.plans[0] ?? null;
  const job = workstream.runnerJobs[0];
  const research = workstream.researchRuns[0];
  const openQuestion =
    job?.questions.find((q) => !q.answer)?.questionText ?? null;
  const openCommentCount =
    plan?.comments.filter((c) => !c.resolved).length ?? 0;

  const hasArchitectApproval = (plan?.approvals.length ?? 0) > 0;
  const role = user.role;
  const owns = workstream.ownerId === user.id;

  const sourcesRaw = Array.isArray(research?.sourcesConsulted)
    ? (research?.sourcesConsulted as Array<{
        connector?: string;
        title?: string;
        itemId?: string;
      }>)
    : [];

  const sources = sourcesRaw
    .filter((s) => s.title)
    .map((s) => ({
      connector: s.connector ?? "source",
      title: s.title as string,
      itemId: s.itemId,
    }));

  if (sources.length === 0 && workstream.jiraKey === "INNO-214") {
    sources.push(
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
      {
        connector: "jira",
        title: "INNO-198 duplicate ISIN logic",
        itemId: "INNO-198",
      },
      {
        connector: "github",
        title: "packages/mcp/src/tools",
        itemId: "gh-tools",
      },
    );
  }

  const history = [
    ...workstream.plans.map((p) => ({
      id: `plan-${p.id}`,
      label:
        p.versionNumber > 1
          ? `Plan v${p.versionNumber} generated from comments`
          : `Plan v${p.versionNumber} generated`,
      at: p.createdAt.toISOString(),
    })),
    ...workstream.researchRuns
      .filter((r) => r.status === "succeeded" || r.findings)
      .map((r) => ({
        id: `research-${r.id}`,
        label: "Research completed",
        at: (r.finishedAt ?? r.updatedAt).toISOString(),
      })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const actionState: ActionBarState = {
    canGeneratePlan: Boolean(research?.status === "succeeded" || research?.findings),
    canRequestReview: Boolean(plan && plan.status === "draft"),
    canRevise: openCommentCount > 0 && Boolean(plan),
    canApprove:
      Boolean(plan && plan.status === "in_review") &&
      openCommentCount === 0 &&
      (role === "architect" || role === "lead"),
    canHandOff:
      Boolean(plan && (plan.status === "approved" || hasArchitectApproval)) && owns,
    openCommentCount,
    generateReason: research?.findings
      ? undefined
      : "Finish a research run before generating a plan.",
    reviewReason: plan
      ? plan.status === "draft"
        ? undefined
        : `Plan is ${plan.status.replaceAll("_", " ")}, not draft.`
      : "Create a draft plan first.",
    reviseReason:
      openCommentCount > 0
        ? undefined
        : "Open comments are required before revising from review feedback.",
    approveReason:
      role === "architect" || role === "lead"
        ? openCommentCount > 0
          ? "Resolve or address open comments before approval."
          : plan?.status === "in_review"
            ? undefined
            : "Plan must be in review."
        : "Only architects and leads can approve plans.",
    handOffReason: !owns
      ? "You can only hand off workstreams you own."
      : !plan
        ? "An approved plan is required."
        : hasArchitectApproval || plan.status === "approved"
          ? undefined
          : "Needs at least one architect approval.",
  };

  const researchSummary =
    research?.findings ??
    (workstream.jiraKey === "INNO-214"
      ? "ISIN checks are implemented separately in three tools. None return structured error codes, so agents cannot branch on failure type."
      : workstream.problemStatement);

  return (
    <WorkstreamDetail
      id={workstream.id}
      title={workstream.title}
      problemStatement={workstream.problemStatement}
      stage={workstream.stage as WorkstreamStage}
      ownerName={workstream.owner.name}
      origin={workstream.origin}
      priority={workstream.priority}
      jiraKey={workstream.jiraKey}
      role={role}
      planVersion={plan?.versionNumber ?? null}
      planTotalVersions={workstream.plans.length}
      planMarkdown={plan?.markdownBody ?? null}
      steps={
        plan?.steps.map((step) => ({
          id: step.id,
          order: step.order,
          title: step.title,
          description: step.description,
          filesLikelyTouched: step.filesLikelyTouched,
          testsToAdd: step.testsToAdd,
          riskLevel: step.riskLevel,
          completed: step.completed,
          needsConfirmation: step.needsConfirmation,
        })) ?? []
      }
      comments={
        plan?.comments.map((comment) => ({
          id: comment.id,
          stepId: comment.stepId,
          anchorText: comment.anchorText,
          body: comment.body,
          authorName: comment.author.name,
          resolved: comment.resolved,
        })) ?? []
      }
      researchSummary={researchSummary}
      sources={sources}
      history={history}
      openQuestion={openQuestion}
      actionState={actionState}
      agentEvents={(research?.events ?? [])
        .slice()
        .reverse()
        .map((e) => {
          const payload = (e.payload ?? {}) as { summary?: string };
          return {
            id: e.id,
            type: e.type,
            summary: payload.summary ?? e.type,
            createdAt: e.createdAt.toISOString(),
          };
        })}
      canResearch
      canPlan={Boolean(research?.findings || research?.status === "succeeded")}
    />
  );
}
