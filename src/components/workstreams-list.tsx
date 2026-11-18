"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { stageLabel, type WorkstreamStage } from "@relay/core";
import {
  segsForStage,
  statusToneClass,
  TimelineLegend,
  TimelineTrack,
} from "@/components/timeline-track";
import type { WorkstreamRowRow } from "@/lib/overview";
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

export function WorkstreamsList(props: { rows: WorkstreamRowRow[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const def = STAGE_FILTERS.find((f) => f.key === filter);
    if (!def || filter === "all" || !def.match) return props.rows;
    return props.rows.filter((r) => def.match!.includes(r.stage));
  }, [filter, props.rows]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          Workstreams
        </h1>
        <p className="mt-2 max-w-[68ch] text-[var(--relay-ink-muted)]">
          Every workstream moves through five stages: Research, Plan, Review, Build, Pull request.
          Open one to see its agent session, plan and build.
        </p>
      </div>

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
                style={{ borderLeftWidth: 4, borderLeftColor: row.color }}
              >
                <span className="flex min-w-0 flex-[1_1_300px] flex-col gap-0.5">
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
                  <span className="text-[13px] text-[var(--relay-ink-muted)]">
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
