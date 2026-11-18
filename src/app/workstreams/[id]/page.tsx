import { notFound } from "next/navigation";
import { prisma, resolveWorkstreamColour } from "@relay/core";
import type { WorkstreamStage } from "@relay/core";
import { getCurrentUser } from "@/lib/session";
import { WorkstreamDetail } from "@/components/workstream-detail";
import type { ActionBarState } from "@/components/action-bar";
import { useDemoFixtures } from "@/lib/db";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";
import { buildResearchStepsFromEvents } from "@/lib/research-activity";

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
    const openCommentCount = demo.plan.comments.filter((c) => !c.resolved).length;
    const role = user.role;
    const owns = demo.ownerId === user.id;
    const actionState: ActionBarState = {
      canGeneratePlan: true,
      canRequestReview: false,
      canRevise: openCommentCount > 0,
      canApprove:
        demo.plan.status === "in_review" &&
        openCommentCount === 0 &&
        (role === "architect" || role === "lead"),
      canHandOff:
        (demo.plan.status === "approved" || Boolean(demo.canHandOff)) && owns,
      openCommentCount,
      generateReason: undefined,
      reviewReason: "Plan is already in review.",
      reviseReason: undefined,
      approveReason:
        openCommentCount > 0
          ? "Resolve or address open comments before approval."
          : undefined,
      handOffReason: !owns
        ? "You can only hand off workstreams you own."
        : demo.plan.status === "approved" || demo.canHandOff
          ? undefined
          : "Needs at least one architect approval.",
    };

    return (
      <WorkstreamDetail
        id={demo.id}
        title={demo.title}
        problemStatement={demo.problemStatement}
        stage={demo.stage as WorkstreamStage}
        ownerName={demo.owner.name}
        origin={demo.origin}
        priority={demo.priority}
        jiraKey={demo.jiraKey}
        role={role}
        color={demo.color}
        planId={demo.plan.id}
        planVersion={demo.plan.versionNumber}
        planTotalVersions={2}
        planMarkdown={demo.plan.markdownBody}
        steps={demo.plan.steps.map((step) => ({
          ...step,
          needsConfirmation: false,
        }))}
        comments={demo.plan.comments.map((comment) => ({
          id: comment.id,
          stepId: null,
          anchorText: comment.anchorText,
          body: comment.body,
          authorName: comment.author.name,
          resolved: comment.resolved,
        }))}
        researchSummary={demo.researchSummary}
        sources={demo.sources}
        researchSteps={demo.researchSteps}
        liveToolsLine={demo.liveToolsLine}
        history={demo.history}
        openQuestion={demo.openQuestion}
        actionState={actionState}
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
        include: { events: { orderBy: { createdAt: "desc" }, take: 40 } },
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
  const color = resolveWorkstreamColour(workstream.color);

  const sourcesRaw = Array.isArray(research?.sourcesConsulted)
    ? (research?.sourcesConsulted as Array<{
        connector?: string;
        title?: string;
        itemId?: string;
      } | string>)
    : [];

  const sources = sourcesRaw
    .map((s) =>
      typeof s === "string"
        ? { connector: s, title: `${s} sources`, itemId: s }
        : {
            connector: s.connector ?? "source",
            title: s.title ?? s.connector ?? "Source",
            itemId: s.itemId,
          },
    )
    .filter((s) => Boolean(s.title));

  const { steps: researchSteps, liveToolsLine } = buildResearchStepsFromEvents(
    research?.events ?? [],
    sources,
  );

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
      .filter((r) => r.status === "succeeded" || r.findings || r.status === "running")
      .map((r) => ({
        id: `research-${r.id}`,
        label:
          r.status === "running" ? "Scout researching" : "Research completed",
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
    research?.findings ?? workstream.problemStatement;

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
      color={color}
      planId={plan?.id ?? null}
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
      researchSteps={researchSteps}
      liveToolsLine={liveToolsLine}
      history={history}
      openQuestion={openQuestion}
      actionState={actionState}
    />
  );
}
