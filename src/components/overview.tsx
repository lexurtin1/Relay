"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
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

const MODES = [
  {
    id: "research" as const,
    label: "Research a problem",
    ph: "Describe the problem. Scout searches the code and the connected sources.",
    cta: "Start research",
    href: "/workstreams/new",
  },
  {
    id: "idea" as const,
    label: "Log an idea",
    ph: "Describe the friction or the external signal",
    cta: "Log idea",
    href: "/ideas",
  },
  {
    id: "find" as const,
    label: "Search knowledge",
    ph: "Search Confluence, Jira, GitHub and the other connected sources",
    cta: "Search",
    href: "/knowledge",
  },
];

export function OverviewPageView(props: {
  stats: OverviewStats;
  needsAction: NeedsActionItem[];
  rows: WorkstreamRowRow[];
  workstreamCount: number;
  agentsActive: number;
}) {
  const needsN = props.needsAction.length;
  const agentsN = props.agentsActive;
  const summary = `${needsN} item${needsN === 1 ? "" : "s"} need${needsN === 1 ? "s" : ""} your input · ${agentsN} agent${agentsN === 1 ? "" : "s"} running · ${props.stats.mergedThisWeek} merged this week`;

  return (
    <div className="flex flex-col gap-9">
      <div>
        <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          Overview
        </h1>
        <p className="mt-2 max-w-[68ch] text-[17px] text-[var(--relay-ink-body)]">{summary}</p>
      </div>

      <StartWorkComposer />

      <NeedsInputSection items={props.needsAction} />

      <WorkstreamTimelines rows={props.rows} />
    </div>
  );
}

function StartWorkComposer() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("research");
  const [draft, setDraft] = useState("");
  const current = MODES.find((m) => m.id === mode) ?? MODES[0]!;

  function go(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (mode === "find" && q) {
      router.push(`/knowledge?q=${encodeURIComponent(q)}`);
      return;
    }
    if (mode === "idea") {
      router.push(q ? `/ideas?draft=${encodeURIComponent(q)}` : "/ideas");
      return;
    }
    router.push(q ? `/workstreams/new?title=${encodeURIComponent(q)}` : "/workstreams/new");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  return (
    <section aria-labelledby="rl-start-h" className="flex flex-col gap-3">
      <h2 id="rl-start-h" className="m-0 text-xl font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
        Start work
      </h2>
      <div className="rl-glass flex flex-col gap-3 rounded-[26px] p-3.5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type of work">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`rl-chip ${mode === m.id ? "rl-chip-on" : ""}`}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <form className="flex flex-wrap gap-2.5" onSubmit={go}>
          <label className="sr-only" htmlFor="rl-ask-in">
            Describe what you need
          </label>
          <input
            id="rl-ask-in"
            className="rl-input min-w-0 flex-[1_1_280px]"
            type="text"
            value={draft}
            placeholder={current.ph}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
          />
          <button type="submit" className="rl-btn-primary">
            {current.cta}
          </button>
        </form>
      </div>
    </section>
  );
}

function NeedsInputSection(props: { items: NeedsActionItem[] }) {
  return (
    <section aria-labelledby="rl-wait-h">
      <h2 id="rl-wait-h" className="m-0 text-xl font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
        Needs your input
      </h2>
      {props.items.length === 0 ? (
        <p className="mt-4 text-[var(--relay-ink-muted)]">
          Nothing needs your input. Agents that pause with a question are listed here.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
          {props.items.map((item) => {
            const wsId = item.id.replace(/-q$|-c$/, "");
            return (
              <article
                key={item.id}
                className="rl-sheet flex flex-col gap-2.5 p-[22px] animate-relay-in"
              >
                <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">
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
                  <p className="m-0 text-[var(--relay-ink-body)]">{item.detail}</p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {item.options.slice(0, 3).map((option) => (
                    <Link
                      key={option}
                      href={`/workstreams/${wsId}`}
                      className="rl-btn-second inline-flex items-center no-underline"
                    >
                      {option}
                    </Link>
                  ))}
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
            className="m-0 text-xl font-medium tracking-[-0.01em] text-[var(--relay-ink)]"
          >
            Workstream timelines
          </h2>
          <p className="mt-2 max-w-[68ch] text-[var(--relay-ink-muted)]">
            One bar per workstream, from first write-up on the left to now on the right. Colour is
            the state. Width is the share of elapsed time.
          </p>
        </div>
        <TimelineLegend />
      </div>
      <div className="rl-sheet mt-4 flex flex-col p-2">
        {props.rows.map((row) => {
          const segs = segsForStage(row.stage, row.progressTone);
          const tone =
            row.progressTone === "waiting"
              ? "w"
              : row.progressTone === "done"
                ? "d"
                : row.progressTone === "active"
                  ? "a"
                  : "p";
          return (
            <Link
              key={row.id}
              href={`/workstreams/${row.id}`}
              className="flex w-full flex-wrap items-center gap-x-7 gap-y-3.5 rounded-[14px] px-3.5 py-4 text-left text-[var(--relay-ink)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_4.5%,transparent)]"
            >
              <span className="flex min-w-0 flex-[1_1_300px] flex-col gap-0.5">
                <span className="text-base font-medium">{row.title}</span>
                <span className="text-[13px] text-[var(--relay-ink-muted)]">
                  {row.jiraKey ? (
                    <span className="font-mono">{row.jiraKey}</span>
                  ) : (
                    <span className="font-mono">{row.id.slice(0, 8)}</span>
                  )}
                  {" · "}
                  {row.ownerName}
                  {" · "}
                  {row.progressLabel}
                </span>
              </span>
              <TimelineTrack
                segs={segs}
                ariaLabel={`${row.title}. ${row.progressLabel}.`}
              />
              <span className="flex min-w-0 flex-[0_1_230px] flex-col gap-0.5 text-sm">
                <span className={statusToneClass(tone)}>{row.progressLabel}</span>
                <span className="text-[13px] text-[var(--relay-ink-muted)]">
                  Updated {formatRelativeTime(row.updatedAt)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
