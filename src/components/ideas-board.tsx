"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { createIdeaAction, promoteIdeaAction, triageIdeaAction } from "@/app/actions/ideas";
import type { IdeaView } from "@/lib/ideas";
import { cn, formatRelativeTime } from "@/lib/utils";

const STATUSES = ["new", "triaged", "promoted", "parked"] as const;

export function IdeasBoard(props: {
  ideas: IdeaView[];
  role: string;
  draft?: string;
  flash?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(Boolean(props.draft));
  const statusFilter = searchParams.get("status") ?? "all";
  const typeFilter = searchParams.get("type") ?? "all";
  const canTriage = props.role === "lead" || props.role === "architect";
  const canWrite = props.role !== "viewer";

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `/ideas?${qs}` : "/ideas");
  }

  const grouped = STATUSES.map((status) => ({
    status,
    items: props.ideas.filter((i) => i.status === status),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
            Ideas
          </h1>
          <p className="mt-2 max-w-[64ch] text-[17px] text-[var(--relay-ink-body)]">
            Friction logs and external signals. Leads triage, park, or promote into a workstream.
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            className="rl-btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Close form" : "Log idea"}
          </button>
        ) : null}
      </div>

      {props.flash ? (
        <p className="m-0 text-sm text-[var(--relay-brand-fg)]">{props.flash}</p>
      ) : null}

      {showForm && canWrite ? (
        <form action={createIdeaAction} className="rl-sheet flex flex-col gap-3 p-5">
          <h2 className="m-0 text-base font-medium text-[var(--relay-ink)]">New idea</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--relay-ink-muted)]">Title</span>
            <input
              name="title"
              required
              className="rl-input w-full"
              defaultValue={props.draft ?? ""}
              placeholder="Short name for the friction or signal"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--relay-ink-muted)]">Description</span>
            <textarea
              name="description"
              required
              rows={3}
              className="rl-input w-full py-3"
              placeholder="Who feels it, and how often?"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--relay-ink-muted)]">Type</span>
              <select name="type" className="rl-input" defaultValue="friction_log">
                <option value="friction_log">Friction log</option>
                <option value="external_signal">External signal</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--relay-ink-muted)]">Times / week</span>
              <input name="frequencyPerWeek" type="number" min={0} className="rl-input w-28" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--relay-ink-muted)]">Minutes each</span>
              <input name="minutesLostEach" type="number" min={0} className="rl-input w-28" />
            </label>
          </div>
          <button type="submit" className="rl-btn-primary self-start">
            Save idea
          </button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["all", "friction_log", "external_signal"] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={cn("rl-chip", typeFilter === type && "rl-chip-on")}
            onClick={() => setFilter("type", type)}
          >
            {type === "all" ? "All types" : type === "friction_log" ? "Friction" : "External"}
          </button>
        ))}
        {(["all", ...STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={cn("rl-chip", statusFilter === status && "rl-chip-on")}
            onClick={() => setFilter("status", status)}
          >
            {status === "all" ? "All status" : status}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {grouped.map((column) => (
          <section key={column.status} className="min-w-0">
            <h2 className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--relay-ink-subtle)]">
              {column.status}
              <span className="ml-2 tabular text-[var(--relay-ink-muted)]">
                {column.items.length}
              </span>
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {column.items.length === 0 ? (
                <li className="rounded-[14px] border border-dashed border-[var(--relay-border)] px-3 py-4 text-sm text-[var(--relay-ink-muted)]">
                  Empty
                </li>
              ) : (
                column.items.map((idea) => (
                  <li key={idea.id} className="rl-sheet flex flex-col gap-2 p-3.5">
                    <p className="m-0 text-[11px] uppercase tracking-[0.05em] text-[var(--relay-ink-subtle)]">
                      {idea.type === "friction_log" ? "Friction" : "External"} ·{" "}
                      {idea.submittedByName}
                    </p>
                    <h3 className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">
                      {idea.title}
                    </h3>
                    <p className="m-0 text-sm text-[var(--relay-ink-body)]">{idea.description}</p>
                    {idea.weeklyMinutesLost != null ? (
                      <p className="m-0 text-[13px] tabular text-[var(--relay-warning)]">
                        ~{idea.weeklyMinutesLost} min / week
                      </p>
                    ) : null}
                    {idea.workstreamId ? (
                      <Link
                        href={`/workstreams/${idea.workstreamId}`}
                        className="text-[13px] text-[var(--relay-brand-fg)] hover:underline"
                      >
                        {idea.workstreamTitle ?? "Open workstream"}
                      </Link>
                    ) : null}
                    <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">
                      {formatRelativeTime(idea.createdAt)}
                    </p>
                    {canTriage && idea.status !== "promoted" ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {idea.status === "new" ? (
                          <button
                            type="button"
                            className="rl-btn-second"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await triageIdeaAction({ id: idea.id, status: "triaged" });
                              })
                            }
                          >
                            Triage
                          </button>
                        ) : null}
                        {idea.status !== "parked" ? (
                          <button
                            type="button"
                            className="rl-btn-second"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await triageIdeaAction({ id: idea.id, status: "parked" });
                              })
                            }
                          >
                            Park
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rl-btn-second"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await triageIdeaAction({ id: idea.id, status: "new" });
                              })
                            }
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          type="button"
                          className="rl-btn-primary"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await promoteIdeaAction(idea.id);
                            })
                          }
                        >
                          Promote
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
