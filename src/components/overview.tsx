"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ColourDot } from "@/components/colour-dot";
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
    label: "Research",
    ph: "Describe the problem. Scout searches code and connected sources.",
    cta: "Start research",
    href: "/workstreams/new",
  },
  {
    id: "idea" as const,
    label: "Log idea",
    ph: "Describe the friction or the external signal",
    cta: "Log idea",
    href: "/ideas",
  },
  {
    id: "find" as const,
    label: "Search",
    ph: "Search Confluence, Jira, Datadog, GitHub and connected sources",
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

  const kpis = [
    {
      label: "Needs input",
      value: String(needsN),
      hint: needsN === 1 ? "waiting on you" : "waiting on you",
    },
    {
      label: "Agents running",
      value: String(props.agentsActive),
      hint: props.agentsActive === 1 ? "active now" : "active now",
    },
    {
      label: "In review",
      value: String(props.stats.inReview),
      hint: "plans to approve",
    },
    {
      label: "Merged this week",
      value: String(props.stats.mergedThisWeek),
      hint: "last 7 days",
    },
  ];

  return (
    <div className="rl-overview flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <h1 className="m-0 text-[26px] font-medium leading-none tracking-[-0.03em] text-[var(--relay-ink-muted)]">
          Overview
        </h1>
      </div>

      <section
        aria-label="Key metrics"
        className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rl-sheet rl-sheet-elevated px-4 py-3.5">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--relay-ink-muted)]">
              {kpi.label}
            </p>
            <p className="m-0 mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular text-[var(--relay-ink)]">
              {kpi.value}
            </p>
            <p className="m-0 mt-1.5 text-[12px] text-[var(--relay-ink-subtle)]">{kpi.hint}</p>
          </article>
        ))}
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <StartWorkComposer />
          <WorkstreamTimelines rows={props.rows} />
        </div>
        <NeedsInputSection items={props.needsAction} />
      </div>
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
    <section aria-labelledby="rl-start-h" className="rl-sheet rl-sheet-elevated shrink-0 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="rl-start-h"
          className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]"
        >
          Start work
        </h2>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type of work">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`rl-chip rl-chip-compact ${mode === m.id ? "rl-chip-on" : ""}`}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <form className="flex flex-wrap gap-2" onSubmit={go}>
        <label className="sr-only" htmlFor="rl-ask-in">
          Describe what you need
        </label>
        <input
          id="rl-ask-in"
          className="rl-input rl-input-compact min-w-0 flex-[1_1_200px]"
          type="text"
          value={draft}
          placeholder={current.ph}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        <button type="submit" className="rl-btn-primary rl-btn-compact">
          {current.cta}
        </button>
      </form>
    </section>
  );
}

function NeedsInputSection(props: { items: NeedsActionItem[] }) {
  return (
    <section
      aria-labelledby="rl-wait-h"
      className="rl-sheet rl-sheet-elevated flex min-h-0 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-[var(--relay-border)] px-4 py-3">
        <h2
          id="rl-wait-h"
          className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]"
        >
          Needs your input
        </h2>
        <span className="text-[12px] tabular text-[var(--relay-ink-muted)]">
          {props.items.length}
        </span>
      </div>
      {props.items.length === 0 ? (
        <p className="m-0 px-4 py-5 text-[13px] text-[var(--relay-ink-muted)]">
          Nothing needs your input. Agents that pause with a question are listed here.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
          {props.items.map((item) => {
            const wsId = item.id.replace(/-q$|-c$/, "");
            return (
              <article
                key={item.id}
                className="flex flex-col gap-2 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-3.5 animate-relay-in"
              >
                <div className="flex items-start gap-2">
                  <ColourDot
                    color={item.color}
                    pulse
                    className="mt-1"
                    label="Needs a decision"
                  />
                  <p className="m-0 min-w-0 flex-1 text-[12px] text-[var(--relay-ink-muted)]">
                    {item.jiraKey ? (
                      <span className="font-mono">{item.jiraKey}</span>
                    ) : null}
                    {item.jiraKey ? " · " : null}
                    <span className="text-[var(--relay-warning)]">{item.summary}</span>
                  </p>
                </div>
                <h3 className="m-0 text-[14.5px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
                  {item.title}
                </h3>
                {item.detail ? (
                  <p className="m-0 line-clamp-2 text-[13px] text-[var(--relay-ink-body)]">
                    {item.detail}
                  </p>
                ) : null}
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  {item.options.slice(0, 2).map((option) => (
                    <Link
                      key={option}
                      href={`/workstreams/${wsId}`}
                      className="rl-btn-second rl-btn-tiny inline-flex items-center no-underline"
                    >
                      {option}
                    </Link>
                  ))}
                  <Link
                    href={`/workstreams/${wsId}`}
                    className="rl-btn-second rl-btn-tiny inline-flex items-center no-underline"
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
    <section
      aria-labelledby="rl-relay-h"
      className="rl-sheet rl-sheet-elevated flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--relay-border)] px-4 py-3">
        <h2
          id="rl-relay-h"
          className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]"
        >
          Workstream timelines
        </h2>
        <TimelineLegend compact />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1.5">
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
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] px-3 py-2 text-left text-[var(--relay-ink)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_4%,transparent)]"
            >
              <ColourDot
                color={row.color}
                pulse={row.progressTone === "waiting"}
                className="mt-1.5"
                label={row.progressTone === "waiting" ? "Needs a decision" : undefined}
              />
              <span className="flex min-w-0 flex-[1_1_160px] flex-col gap-0.5">
                <span className="truncate text-[13.5px] font-medium">{row.title}</span>
                <span className="truncate text-[12px] text-[var(--relay-ink-muted)]">
                  {row.jiraKey ? (
                    <span className="font-mono">{row.jiraKey}</span>
                  ) : (
                    <span className="font-mono">{row.id.slice(0, 8)}</span>
                  )}
                  {" · "}
                  {row.ownerName}
                </span>
              </span>
              <TimelineTrack
                segs={segs}
                ariaLabel={`${row.title}. ${row.progressLabel}.`}
                className="h-3 flex-[1.4_1_200px]"
              />
              <span className="flex min-w-0 flex-[0_1_120px] flex-col gap-0.5 text-[12px]">
                <span className={statusToneClass(tone)}>{row.progressLabel}</span>
                <span className="text-[11px] text-[var(--relay-ink-muted)]">
                  {formatRelativeTime(row.updatedAt)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
