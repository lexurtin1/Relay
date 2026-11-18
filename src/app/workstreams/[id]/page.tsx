import { notFound } from "next/navigation";
import { prisma, resolveWorkstreamColour } from "@relay/core";
import { WorkstreamDetailContainer } from "@/components/containers/workstream-detail-container";
import { WorkstreamDetail } from "@/components/workstream-detail";
import { isDemoMode } from "@/lib/db";
import { deriveProgress } from "@/lib/derive";
import { buildResearchStepsFromEvents } from "@/lib/research-activity";
import { getCurrentUser } from "@/lib/session";
import type { ActionGate, ActionVerb, NextMove, WorkstreamDetailModel } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default async function WorkstreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Demo mode: the browser store owns workstreams, including ones created there.
  if (isDemoMode()) return <WorkstreamDetailContainer id={id} />;

  const user = await getCurrentUser();
  if (!user) notFound();

  const ws = await prisma.workstream.findUnique({
    where: { id },
    include: {
      owner: true,
      plans: {
        include: {
          steps: { orderBy: { order: "asc" } },
          comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
          approvals: { include: { approver: true } },
        },
        orderBy: { versionNumber: "desc" },
      },
      runnerJobs: {
        include: { questions: true, events: { orderBy: { createdAt: "asc" }, take: 60 } },
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
  if (!ws) notFound();

  const plan = ws.plans[0] ?? null;
  const job = ws.runnerJobs[0];
  const research = ws.researchRuns[0];
  const question = job?.questions.find((q) => !q.answer) ?? null;
  const topComments = plan?.comments.filter((c) => c.parentId === null) ?? [];
  const openComments = topComments.filter((c) => !c.resolved).length;
  const role = user.role;
  const owns = ws.ownerId === user.id;

  const sourcesRaw = Array.isArray(research?.sourcesConsulted)
    ? (research?.sourcesConsulted as Array<{ connector?: string; title?: string; itemId?: string } | string>)
    : [];
  const sources = sourcesRaw.map((s) =>
    typeof s === "string"
      ? { connector: s, title: `${s} sources`, itemId: s }
      : { connector: s.connector ?? "source", title: s.title ?? s.connector ?? "Source", itemId: s.itemId },
  );
  const { steps: researchSteps, liveToolsLine } = buildResearchStepsFromEvents(research?.events ?? [], sources);

  // Database mode only wires the actions that have server actions today.
  const off = (reason: string): ActionGate => ({ ok: false, reason });
  const pending = "Runs in demo mode until the worker lands.";
  const gates: WorkstreamDetailModel["gates"] = {
    start_research: off(pending),
    generate_plan: off(pending),
    request_review: off(pending),
    revise_plan: off(pending),
    approve_plan: off(role === "architect" || role === "lead" ? pending : "Only architects and leads approve plans."),
    hand_off:
      plan?.status === "approved" && owns && !job ? { ok: true } : off(owns ? "Needs an approved plan." : "Only the owner can hand off."),
    answer_question: off(pending),
    merge_pr: off(pending),
    comment: off(pending),
    resolve: off(pending),
    ask: { ok: true },
  };

  const steps = plan?.steps ?? [];
  const progress = deriveProgress({
    stage: ws.stage,
    questionOpen: Boolean(question),
    runnerActive: job?.status === "running" || job?.status === "provisioning",
    stepsCompleted: steps.filter((s) => s.completed).length,
    stepsTotal: steps.length,
    researchRunning: research?.status === "running",
    planDrafting: false,
    planVersion: plan?.versionNumber ?? null,
    planStatus: plan?.status ?? null,
    openComments,
    prChecks: job?.prUrl ? "passed" : null,
    findingsReady: Boolean(research?.findings),
  });

  const primary: ActionVerb | null = question ? "answer_question" : plan?.status === "approved" && !job ? "hand_off" : null;
  const nextMove: NextMove = {
    holder: { kind: "person", name: ws.owner.name, detail: "Owner" },
    headline: progress.label,
    body: "Database mode shows live records. Agents run once the worker lands; try the demo for the full journey.",
    primary,
  };

  const model: WorkstreamDetailModel = {
    id: ws.id,
    title: ws.title,
    problemStatement: ws.problemStatement,
    stage: ws.stage,
    color: resolveWorkstreamColour(ws.color),
    jiraKey: ws.jiraKey,
    owner: { id: ws.owner.id, name: ws.owner.name, role: ws.owner.role },
    origin: ws.origin,
    priority: ws.priority,
    progress,
    research: {
      status: research?.status === "running" ? "running" : research?.findings ? "succeeded" : "idle",
      ask: ws.problemStatement,
      steps: researchSteps,
      sources,
      findings: research?.findings ?? null,
      liveTools: liveToolsLine,
    },
    plan: plan
      ? {
          id: plan.id,
          version: plan.versionNumber,
          totalVersions: ws.plans.length,
          status: plan.status,
          markdown: plan.markdownBody,
          steps: steps.map((s) => ({
            id: s.id,
            order: s.order,
            title: s.title,
            description: s.description,
            filesLikelyTouched: s.filesLikelyTouched,
            testsToAdd: s.testsToAdd,
            riskLevel: s.riskLevel,
            completed: s.completed,
            needsConfirmation: s.needsConfirmation,
          })),
          comments: topComments.map((c) => ({
            id: c.id,
            stepId: c.stepId,
            anchorText: c.anchorText,
            body: c.body,
            authorName: c.author.name,
            resolved: c.resolved,
            resolution: null,
            createdAt: c.createdAt.toISOString(),
            replies: (plan?.comments ?? [])
              .filter((r) => r.parentId === c.id)
              .map((r) => ({
                id: r.id,
                stepId: r.stepId,
                anchorText: r.anchorText,
                body: r.body,
                authorName: r.author.name,
                resolved: r.resolved,
                resolution: null,
                createdAt: r.createdAt.toISOString(),
                replies: [],
              })),
          })),
          openComments,
          approvals: plan.approvals.map((a) => ({ name: a.approver.name, at: a.createdAt.toISOString() })),
        }
      : null,
    planDrafting: null,
    runner: job
      ? {
          status:
            job.status === "awaiting_input"
              ? "awaiting_input"
              : job.status === "succeeded"
                ? job.prUrl
                  ? "pr_open"
                  : "merged"
                : job.status === "provisioning" || job.status === "queued"
                  ? "provisioning"
                  : "running",
          model: "claude-opus-5-5",
          profile: "default",
          branch: job.branch ?? "relay/runner",
          context: job.additionalInstructions ?? "",
          log: job.events.map((e) => ({ at: e.createdAt.toISOString(), text: e.type.replaceAll("_", " "), kind: "info" as const })),
          question: question ? { text: question.questionText, options: question.options, answer: null, answeredBy: null } : null,
          pr: null,
          stepsCompleted: steps.filter((s) => s.completed).length,
          stepsTotal: steps.length,
        }
      : null,
    history: ws.plans.map((p) => ({
      id: p.id,
      label: p.versionNumber > 1 ? `Plan v${p.versionNumber} generated from comments` : `Plan v${p.versionNumber} generated`,
      at: p.createdAt.toISOString(),
      actor: "agent" as const,
    })),
    gates,
    nextMove,
    tokens: { input: 0, output: 0 },
    interactive: true,
  };

  return <WorkstreamDetail model={model} />;
}
