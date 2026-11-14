import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@relay/core";
import { stageLabel, type WorkstreamStage } from "@relay/core";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkstreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          approvals: { include: { approver: true } },
        },
        orderBy: { versionNumber: "desc" },
      },
      runnerJobs: {
        include: {
          questions: true,
          events: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      researchRuns: {
        include: { events: { orderBy: { createdAt: "desc" }, take: 20 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!workstream) notFound();

  const plan = workstream.plans[0];
  const job = workstream.runnerJobs[0];
  const research = workstream.researchRuns[0];
  const events = job?.events ?? research?.events ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-[var(--relay-ink-subtle)] hover:underline">
            Back to dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--relay-ink)]">
            {workstream.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
            {stageLabel(workstream.stage as WorkstreamStage)} · {workstream.owner.name}
            {workstream.jiraKey ? ` · ${workstream.jiraKey}` : ""}
          </p>
        </div>
        <div className="rounded border border-dashed border-[var(--relay-border-strong)] bg-white px-3 py-2 text-xs text-[var(--relay-ink-subtle)]">
          Action bar arrives in Milestones 3 to 5
        </div>
      </div>

      <p className="rounded border border-[var(--relay-border)] bg-white p-4 text-sm text-[var(--relay-ink-muted)]">
        {workstream.problemStatement}
      </p>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded border border-[var(--relay-border)] bg-white">
          <header className="border-b border-[var(--relay-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
            Agent activity
          </header>
          <ul className="max-h-[480px] space-y-2 overflow-y-auto p-3 text-sm">
            {events.length === 0 ? (
              <li className="text-[var(--relay-ink-subtle)]">No events yet.</li>
            ) : (
              events.map((event) => {
                const payload = event.payload as {
                  summary?: string;
                  message?: string;
                  tool?: string;
                };
                return (
                  <li key={event.id} className="border-b border-[var(--relay-surface-sunken)] pb-2">
                    <div className="text-[11px] uppercase tracking-wide text-[var(--relay-ink-subtle)]">
                      {event.type} · {formatRelativeTime(event.createdAt)}
                    </div>
                    <div className="mt-1 text-[var(--relay-ink-muted)]">
                      {payload.summary ?? payload.message ?? payload.tool ?? "Event"}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded border border-[var(--relay-border)] bg-white lg:col-span-1">
          <header className="border-b border-[var(--relay-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
            Plan {plan ? `v${plan.versionNumber}` : ""}
          </header>
          <div className="max-h-[480px] overflow-y-auto p-3">
            {plan ? (
              <pre className="whitespace-pre-wrap font-[inherit] text-sm leading-relaxed text-[var(--relay-ink)]">
                {plan.markdownBody}
              </pre>
            ) : (
              <p className="text-sm text-[var(--relay-ink-subtle)]">No plan yet.</p>
            )}
          </div>
        </section>

        <section className="rounded border border-[var(--relay-border)] bg-white">
          <header className="border-b border-[var(--relay-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
            Comments
          </header>
          <ul className="max-h-[480px] space-y-3 overflow-y-auto p-3 text-sm">
            {!plan || plan.comments.length === 0 ? (
              <li className="text-[var(--relay-ink-subtle)]">No comments yet.</li>
            ) : (
              plan.comments.map((comment) => (
                <li key={comment.id} className="rounded border border-[var(--relay-border)] p-2">
                  <div className="text-xs text-[var(--relay-ink-subtle)]">
                    {comment.author.name}
                    {comment.resolved ? " · resolved" : " · open"}
                  </div>
                  {comment.anchorText ? (
                    <div className="mt-1 text-xs italic text-[var(--relay-ink-muted)]">
                      “{comment.anchorText}”
                    </div>
                  ) : null}
                  <p className="mt-1 text-[var(--relay-ink)]">{comment.body}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {job?.questions.some((q) => !q.answer) ? (
        <div className="rounded border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm">
          <div className="font-semibold text-[#B54708]">Runner needs you</div>
          <p className="mt-1 text-[var(--relay-ink-muted)]">
            {job.questions.find((q) => !q.answer)?.questionText}
          </p>
          <p className="mt-2 text-xs text-[var(--relay-ink-subtle)]">
            Answer UI arrives with the Runner milestone.
          </p>
        </div>
      ) : null}
    </div>
  );
}
