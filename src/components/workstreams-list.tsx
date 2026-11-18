"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { stageLabel, type WorkstreamStage } from "@relay/core/domain";
import { ColourDot } from "@/components/colour-dot";
import {
  segsForStage,
  statusToneClass,
  TimelineLegend,
  TimelineTrack,
} from "@/components/timeline-track";
import type { WorkstreamRowRow } from "@/lib/overview";
import { PageHero } from "@/components/page-hero";
import type { StageCount } from "@/lib/demo-store/selectors";
import { formatRelativeTime } from "@/lib/utils";

const STAGE_FILTERS: Array<{ key: string; label: string; match?: WorkstreamStage[] }> = [
  { key: "all", label: "All" },
  { key: "research", label: "Research", match: ["idea", "research"] },
  { key: "planning", label: "Plan", match: ["planning"] },
  { key: "in_review", label: "Review", match: ["in_review", "approved"] },
  { key: "building", label: "Build", match: ["building", "awaiting_input"] },
  { key: "pr_open", label: "Pull request", match: ["pr_open"] },
  { key: "merged", label: "Merged", match: ["merged"] },
];

const STAGE_SHADES = ["#2B6FD6", "#3F82E0", "#0D9488", "#14908F", "#475569"];

function StageDistribution(props: { counts: StageCount[] }) {
  const total = props.counts.reduce((s, c) => s + c.count, 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[var(--relay-surface-sunken)]" role="img" aria-label={props.counts.map((c) => `${c.label} ${c.count}`).join(", ")}>
        {props.counts.map((c, i) =>
          c.count > 0 ? (
            <span key={c.key} className="h-full" style={{ width: `${(c.count / total) * 100}%`, background: STAGE_SHADES[i] }} title={`${c.label}: ${c.count}`} />
          ) : null,
        )}
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-5">
        {props.counts.map((c, i) => (
          <li key={c.key} className="flex flex-col gap-0.5 rounded-[12px] border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--relay-ink-muted)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: STAGE_SHADES[i] }} aria-hidden />
              {c.label}
            </span>
            <span className="rl-stat-value text-[20px]">{c.count}</span>
            {c.blocked > 0 ? <span className="text-[11px] text-[var(--relay-warning)]">{c.blocked} waiting</span> : <span className="text-[11px] text-[var(--relay-ink-subtle)]">{c.holderLabel}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkstreamsList(props: { rows: WorkstreamRowRow[]; stageCounts: StageCount[]; agentsActive: number }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const def = STAGE_FILTERS.find((f) => f.key === filter);
    if (!def || filter === "all" || !def.match) return props.rows;
    return props.rows.filter((r) => def.match!.includes(r.stage));
  }, [filter, props.rows]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        id="workstreams"
        eyebrow="Workstreams"
        title="Every piece of work, and who holds the baton"
        purpose="Each workstream runs Research, Plan, Review, Build and Pull request. Agents carry the routine legs; people decide at review, at questions and at merge."
        stats={[
          { label: "Active", value: props.rows.filter((r) => r.stage !== "merged" && r.stage !== "killed").length },
          { label: "Waiting on a person", value: props.rows.filter((r) => r.progressTone === "waiting").length, tone: props.rows.filter((r) => r.progressTone === "waiting").length > 0 ? "waiting" : "default" },
          { label: "Agents working", value: props.agentsActive, tone: props.agentsActive > 0 ? "live" : "default" },
          { label: "Merged", value: props.rows.filter((r) => r.stage === "merged").length },
        ]}
        actions={
          <Link href="/workstreams/new" className="rl-btn-primary rl-btn-compact inline-flex items-center no-underline">
            New workstream
          </Link>
        }
        visual={<StageDistribution counts={props.stageCounts} />}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage">
          {STAGE_FILTERS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`rl-chip ${filter === s.key ? "rl-chip-on" : ""}`}
              aria-pressed={filter === s.key}
              onClick={() => setFilter(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <TimelineLegend />
      </div>

      <div className="rl-sheet flex flex-col p-2">
        {filtered.length === 0 ? (
          <p className="m-0 px-3.5 py-5 text-[var(--relay-ink-muted)]">
            No workstreams at this stage.
          </p>
        ) : (
          filtered.map((row) => {
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
                <ColourDot
                  color={row.color}
                  pulse={row.progressTone === "waiting"}
                  size="md"
                  className="mt-1.5"
                  label={row.progressTone === "waiting" ? "Needs a decision" : undefined}
                />
                <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                  <span className="text-base font-medium">{row.title}</span>
                  <span className="text-[13px] text-[var(--relay-ink-muted)]">
                    {row.jiraKey ? (
                      <span className="font-mono">{row.jiraKey}</span>
                    ) : null}
                    {row.jiraKey ? " · " : null}
                    {row.ownerName}
                    {" · "}
                    {stageLabel(row.stage)}
                  </span>
                </span>
                <TimelineTrack
                  segs={segs}
                  ariaLabel={`${row.title}. ${row.progressLabel}.`}
                />
                <span className="flex min-w-0 flex-[0_1_230px] flex-col gap-0.5 text-sm">
                  <span className={statusToneClass(tone)}>{row.progressLabel}</span>
                  <span className="text-[13px] text-[var(--relay-ink-muted)]" suppressHydrationWarning>
                    Updated {formatRelativeTime(row.updatedAt)}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
