import { notFound } from "next/navigation";
import { prisma } from "@relay/core";
import type { WorkstreamStage } from "@relay/core";
import { getCurrentUser } from "@/lib/session";
import { WorkstreamDetail } from "@/components/workstream-detail";
import type { ActionBarState } from "@/components/action-bar";

export const dynamic = "force-dynamic";

export default async function WorkstreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

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
        take: 1,
      },
    },
  });

  if (!workstream) notFound();

  const plan = workstream.plans[0] ?? null;
  const job = workstream.runnerJobs[0];
  const research = workstream.researchRuns[0];
  const rawEvents = job?.events ?? research?.events ?? [];

  const events = rawEvents.map((event) => {
    const payload = event.payload as {
      summary?: string;
      message?: string;
      tool?: string;
    };
    return {
      id: event.id,
      type: event.type,
      createdAt: event.createdAt.toISOString(),
      summary:
        payload.summary ??
        payload.message ??
        (payload.tool ? `Tool: ${payload.tool}` : event.type),
    };
  });

  const openQuestion =
    job?.questions.find((q) => !q.answer)?.questionText ?? null;

  const hasArchitectApproval = (plan?.approvals.length ?? 0) > 0;
  const role = user.role;
  const owns = workstream.ownerId === user.id;

  const actionState: ActionBarState = {
    canGeneratePlan: Boolean(research?.status === "succeeded" || research?.findings),
    canRequestReview: Boolean(plan && plan.status === "draft"),
    canApprove:
      Boolean(plan && plan.status === "in_review") &&
      (role === "architect" || role === "lead"),
    canHandOff:
      Boolean(plan && (plan.status === "approved" || hasArchitectApproval)) && owns,
    generateReason: research?.findings
      ? undefined
      : "Finish a research run before generating a plan.",
    reviewReason: plan
      ? plan.status === "draft"
        ? undefined
        : `Plan is ${plan.status.replaceAll("_", " ")}, not draft.`
      : "Create a draft plan first.",
    approveReason:
      role === "architect" || role === "lead"
        ? plan?.status === "in_review"
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

  return (
    <WorkstreamDetail
      id={workstream.id}
      title={workstream.title}
      problemStatement={workstream.problemStatement}
      stage={workstream.stage as WorkstreamStage}
      ownerName={workstream.owner.name}
      jiraKey={workstream.jiraKey}
      role={role}
      planVersion={plan?.versionNumber ?? null}
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
      events={events}
      openQuestion={openQuestion}
      actionState={actionState}
    />
  );
}
