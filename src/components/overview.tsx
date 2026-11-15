"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { answerQuestion } from "@/app/actions/workstream";
import {
  segsForStage,
  statusToneClass,
  TimelineLegend,
  TimelineTrack,
} from "@/components/timeline-track";
import { formatRelativeTime } from "@/lib/utils";
import type {
  NeedsActionItem,
  OverviewStats,
  WorkstreamRowRow,
} from "@/lib/overview";

export function OverviewPageView(props: {
  stats: OverviewStats;
  needsAction: NeedsActionItem[];
  rows: WorkstreamRowRow[];
  workstreamCount: number;
  agentsActive: number;
}) {
  const needsN = props.needsAction.length;
  const agentsN = props.agentsActive;
  const summary = `${needsN} need you · ${agentsN} agent${agentsN === 1 ? "" : "s"} running · ${props.stats.mergedThisWeek} merged this week`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="m-0 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--relay-ink)]">
          Overview
        </h1>
        <p className="mt-2 max-w-[68ch] text-[14px] text-[var(--relay-ink-body)]">{summary}</p>
      </div>

      <StartWorkComposer />

      <div className="flex flex-wrap gap-2 text-[12.5px] text-[var(--relay-ink-muted)]">
        <span>Research {props.stats.research}</span>
        <span aria-hidden>·</span>
        <span>Plan {props.stats.inReview}</span>
        <span aria-hidden>·</span>
        <span>Build {props.stats.building}</span>
        <span aria-hidden>·</span>
        <span>PR {props.stats.pullRequest}</span>
        <span aria-hidden>·</span>
        <span>Merged this week {props.stats.mergedThisWeek}</span>
      </div>

      <NeedsInputSection items={props.needsAction} />

      <WorkstreamTimelines rows={props.rows} />
    </div>
  );
}

function StartWorkComposer() {
  const router = useRouter();
  const [draft, setDraft] = useState("");

  function go(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    router.push(q ? `/workstreams/new?title=${encodeURIComponent(q)}` : "/workstreams/new");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  return (
    <section aria-labelledby="rl-start-h" className="flex flex-col gap-2">
      <h2 id="rl-start-h" className="sr-only">
        Start research
      </h2>
      <form className="flex flex-wrap gap-2.5" onSubmit={go}>
        <label className="sr-only" htmlFor="rl-ask-in">
          Describe a problem to research
        </label>
        <input
          id="rl-ask-in"
          className="rl-input min-w-0 flex-[1_1_280px]"
          type="text"
          value={draft}
          placeholder="Describe a problem to research..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        <button type="submit" className="rl-btn-primary">
          Start research
        </button>
      </form>
      <div className="flex flex-wrap gap-3 text-[12.5px]">
        <button
          type="button"
          className="text-[var(--relay-brand-fg)] hover:underline"
          onClick={() => {
            const q = draft.trim();
            router.push(q ? `/ideas?draft=${encodeURIComponent(q)}` : "/ideas");
          }}
        >
          Log as idea
        </button>
        <button
          type="button"
          className="text-[var(--relay-brand-fg)] hover:underline"
          onClick={() => {
            const q = draft.trim();
            router.push(q ? `/knowledge?q=${encodeURIComponent(q)}` : "/knowledge");
          }}
        >
          Search knowledge
        </button>
      </div>
    </section>
  );
}

function NeedsInputSection(props: { items: NeedsActionItem[] }) {
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = props.items.filter((item) => !dismissed.includes(item.id));

  function answer(itemId: string, option: string) {
    startTransition(async () => {
      const result = await answerQuestion(itemId, option);
      if (result.ok) {
        setDismissed((ids) => [...ids, itemId]);
        toast.success("Answer saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section aria-labelledby="rl-wait-h">
      <h2 id="rl-wait-h" className="m-0 text-[17px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
        Needs you
      </h2>
      {visible.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--relay-ink-muted)]">
          Nothing needs your input. Agents that pause with a question are listed here.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
          {visible.map((item) => {
            const wsId = item.id.replace(/-q$|-c$/, "");
            return (
              <article
                key={item.id}
                className="rl-sheet flex flex-col gap-2.5 p-5 animate-relay-in"
              >
                <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
                  {item.jiraKey ? (
                    <span className="font-mono">{item.jiraKey}</span>
                  ) : null}
                  {item.jiraKey ? " · " : null}
                  <span className="text-[var(--relay-warning)]">{item.summary}</span>
                </p>
                <h3 className="m-0 text-[17px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
                  {item.title}
                </h3>
                {item.detail ? (
                  <p className="m-0 text-[14px] text-[var(--relay-ink-body)]">{item.detail}</p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {item.kind === "question"
                    ? item.options.slice(0, 3).map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={pending}
                          className="rl-btn-second"
                          onClick={() => answer(item.id, option)}
                        >
                          {option}
                        </button>
                      ))
                    : null}
                  <Link
                    href={`/workstreams/${wsId}`}
                    className="rl-btn-second inline-flex items-center no-underline"
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WorkstreamTimelines(props: { rows: WorkstreamRowRow[] }) {
  return (
    <section aria-labelledby="rl-relay-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="rl-relay-h"
            className="m-0 text-[17px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]"
          >
            Workstreams
          </h2>
          <p className="mt-2 max-w-[68ch] text-[14px] text-[var(--relay-ink-muted)]">
            One bar per workstream. Colour is the state.
          </p>
        </div>
        <TimelineLegend />
      </div>
      <div className="rl-sheet mt-3 flex flex-col p-2">
        {props.rows.map((row) => {
          const segs = segsForStage(row.stage, row.progressTone);
          return (
            <Link
              key={row.id}
              href={`/workstreams/${row.id}`}
              className="flex flex-col gap-2 rounded-[14px] px-3 py-3 no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_5%,transparent)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-[12.5px] text-[var(--relay-ink-muted)]">
                    {row.jiraKey ?? row.id.slice(0, 8)}
                  </span>
                  <span className="mx-2 text-[var(--relay-ink-muted)]">·</span>
                  <span className="text-[14px] font-medium text-[var(--relay-ink)]">
                    {row.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--relay-ink-muted)]">
                  <span>{row.ownerInitials}</span>
                  <span className={statusToneClass(row.progressTone)}>
                    {row.progressLabel}
                  </span>
                  <span>{formatRelativeTime(row.updatedAt)}</span>
                </div>
              </div>
              <TimelineTrack segs={segs} ariaLabel={`${row.title} timeline`} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
