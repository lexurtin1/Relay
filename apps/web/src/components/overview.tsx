"use client";

import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  PIPELINE_LABELS,
  type AgentRunningItem,
  type NeedsActionItem,
  type OverviewStats,
  type WorkstreamRowRow,
} from "@/lib/overview";

export function OverviewHeader(props: {
  workstreamCount: number;
  agentsActive: number;
}) {
  return (
    <div className="rounded-2xl bg-[linear-gradient(135deg,#1a1740_0%,#243a6b_55%,#2f5aa0_100%)] px-5 py-5 text-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-white/75">
            Innovation and Strategy · {props.workstreamCount} workstreams ·{" "}
            {props.agentsActive} agents running
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-relay hover:bg-white/10"
          >
            <Lightbulb className="h-4 w-4" aria-hidden />
            Log an idea
          </Link>
          <Link
            href="/workstreams/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-white transition-relay hover:bg-[var(--relay-primary-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New workstream
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StatsRow(props: { stats: OverviewStats; activeFilter?: string }) {
  const items = [
    { key: "all", label: "All active", value: props.stats.allActive },
    { key: "research", label: "Research", value: props.stats.research },
    { key: "review", label: "In review", value: props.stats.inReview },
    { key: "building", label: "Building", value: props.stats.building },
    { key: "pr", label: "Pull request", value: props.stats.pullRequest },
    { key: "merged", label: "Merged this week", value: props.stats.mergedThisWeek },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item, index) => {
        const active = (props.activeFilter ?? "all") === item.key || (!props.activeFilter && index === 0);
        return (
          <div
            key={item.key}
            className={cn(
              "rounded-2xl border bg-[var(--relay-surface)] px-4 py-3 shadow-sm",
              active
                ? "border-[var(--relay-primary)] ring-1 ring-[var(--relay-primary)]"
                : "border-[var(--relay-border)]",
            )}
          >
            <div className="text-xs font-medium text-[var(--relay-ink-muted)]">{item.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular text-[var(--relay-ink)]">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NeedsActionPanel(props: { items: NeedsActionItem[] }) {
  return (
    <section className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] shadow-sm">
      <header className="flex items-center gap-2 border-b border-[var(--relay-border)] px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
          Needs your action
        </h2>
        <span className="rounded-full bg-[var(--relay-warning-soft)] px-2 py-0.5 text-xs font-semibold tabular text-[var(--relay-warning)]">
          {props.items.length}
        </span>
      </header>
      {props.items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--relay-ink-muted)]">
          Nothing waiting on you. Agents will surface questions and plan comments here.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--relay-border)]">
          {props.items.map((item) => (
            <li key={item.id} className="relative px-4 py-3 pl-5 animate-relay-in">
              <span
                className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-[var(--relay-warning)]"
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-[var(--relay-ink-subtle)]">
                    {item.jiraKey ? (
                      <span className="font-mono text-[var(--relay-ink-muted)]">{item.jiraKey}</span>
                    ) : null}
                    {item.jiraKey ? " · " : null}
                    {item.summary} · {formatRelativeTime(item.createdAt)}
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--relay-ink)]">{item.title}</p>
                  {item.detail ? (
                    <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">{item.detail}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="rounded-xl border border-[var(--relay-border)] bg-[var(--relay-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--relay-ink)] transition-relay hover:border-[var(--relay-primary)]"
                  >
                    {option}
                  </button>
                ))}
                <Link
                  href={`/workstreams/${item.id.replace(/-q$|-c$/, "")}`}
                  className="rounded-xl bg-[var(--relay-primary)] px-2.5 py-1.5 text-xs font-medium text-white transition-relay hover:bg-[var(--relay-primary-hover)]"
                >
                  {item.actionLabel}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AgentsRunningPanel(props: { items: AgentRunningItem[] }) {
  return (
    <section className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] shadow-sm">
      <header className="border-b border-[var(--relay-border)] px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
          Agents running
        </h2>
      </header>
      {props.items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--relay-ink-muted)]">
          No agents running. Hand off an approved plan or start research to see live activity.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--relay-border)]">
          {props.items.map((item) => {
            const pct =
              item.stepsTotal > 0
                ? Math.round((item.stepsCompleted / item.stepsTotal) * 100)
                : 35;
            return (
              <li key={item.id} className="px-4 py-3 animate-relay-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[var(--relay-ink-subtle)]">
                      <span className="font-medium text-[var(--relay-brand)]">{item.kind}</span>
                      {item.jiraKey ? (
                        <>
                          {" "}
                          <span className="font-mono">{item.jiraKey}</span>
                        </>
                      ) : null}
                    </div>
                    <Link
                      href={`/workstreams/${item.workstreamId}`}
                      className="mt-0.5 block truncate text-sm font-medium text-[var(--relay-ink)] hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--relay-ink-muted)]">{item.statusLine}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular text-[var(--relay-ink-subtle)]">
                    {formatRelativeTime(item.startedAt)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--relay-surface-sunken)]">
                  <div
                    className="h-full rounded-full bg-[var(--relay-primary)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function WorkstreamsTable(props: { rows: WorkstreamRowRow[] }) {
  return (
    <section className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--relay-border)] px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
            Workstreams
          </h2>
          <p className="text-xs text-[var(--relay-ink-muted)]">
            Progress from research to pull request
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--relay-ink-muted)]">
          <span className="rounded-xl border border-[var(--relay-border)] px-2 py-1">
            Owner: everyone
          </span>
          <span className="rounded-xl border border-[var(--relay-border)] px-2 py-1">
            Sort: last updated
          </span>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--relay-border)] text-xs text-[var(--relay-ink-subtle)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Workstream</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              {PIPELINE_LABELS.map((col) => (
                <th key={col.key} className="px-2 py-2.5 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--relay-border)] last:border-0 hover:bg-[var(--relay-primary-soft)]/40"
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/workstreams/${row.id}`}
                    className="font-medium text-[var(--relay-ink)] hover:underline"
                  >
                    {row.title}
                  </Link>
                  {row.jiraKey ? (
                    <div className="mt-0.5 font-mono text-xs text-[var(--relay-ink-subtle)]">
                      {row.jiraKey}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <Avatar initials={row.ownerInitials} name={row.ownerName} />
                    <span className="text-[var(--relay-ink-muted)]">
                      {row.ownerName.split(" ")[0]?.[0]}. {row.ownerName.split(" ").slice(-1)}
                    </span>
                  </div>
                </td>
                {PIPELINE_LABELS.map((col, index) => {
                  const reached = index <= row.stepperIndex;
                  const current = index === row.stepperIndex;
                  return (
                    <td key={col.key} className="px-2 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full border",
                            current && row.progressTone === "waiting"
                              ? "border-[var(--relay-warning)] bg-[var(--relay-warning)]"
                              : current && row.progressTone === "done"
                                ? "border-[var(--relay-success)] bg-[var(--relay-success)]"
                                : current
                                  ? "border-[var(--relay-primary)] bg-[var(--relay-primary)]"
                                  : reached
                                    ? "border-[var(--relay-brand)] bg-[var(--relay-brand)]"
                                    : "border-[var(--relay-border-strong)] bg-[var(--relay-surface)]",
                          )}
                          aria-hidden
                        />
                        {current ? (
                          <span
                            className={cn(
                              "max-w-[110px] truncate text-[11px]",
                              row.progressTone === "waiting"
                                ? "text-[var(--relay-warning)]"
                                : row.progressTone === "done"
                                  ? "text-[var(--relay-success)]"
                                  : "text-[var(--relay-ink-muted)]",
                            )}
                          >
                            {row.progressLabel}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 align-top text-right text-xs tabular text-[var(--relay-ink-subtle)]">
                  {formatRelativeTime(row.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
