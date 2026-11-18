"use client";

import { useState } from "react";

export type StackSeries = { key: string; label: string; color: string };
export type StackRow = { id: string; label: string; values: Record<string, number> };

/** Horizontal stacked bars with a 2px surface gap between segments and hover detail. */
export function StackedBars(props: { series: StackSeries[]; rows: StackRow[]; format: (v: number) => string }) {
  const [hover, setHover] = useState<{ row: string; key: string } | null>(null);
  const totals = props.rows.map((r) => props.series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0));
  const max = Math.max(...totals, 0) || 1;

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {props.rows.map((r, i) => {
        const total = totals[i]!;
        const active = hover?.row === r.id ? props.series.find((s) => s.key === hover.key) : undefined;
        const present = props.series.filter((s) => (r.values[s.key] ?? 0) > 0);
        return (
          <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_56px] items-center gap-3">
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] text-[var(--relay-ink-body)]" title={r.label}>
                {r.label}
              </span>
              <span className="block h-4 text-[11px] text-[var(--relay-ink-muted)]">
                {active ? `${active.label}: ${props.format(r.values[active.key] ?? 0)}` : ""}
              </span>
            </span>
            <span className="flex h-3.5 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
              {present.map((s, j) => {
                const v = r.values[s.key] ?? 0;
                return (
                  <span
                    key={s.key}
                    role="img"
                    aria-label={`${r.label}, ${s.label}: ${props.format(v)}`}
                    className={`h-full ${j === present.length - 1 ? "rounded-r-[4px]" : ""}`}
                    style={{
                      flexGrow: v,
                      flexBasis: 0,
                      minWidth: 3,
                      background: s.color,
                      opacity: hover && (hover.row !== r.id || hover.key !== s.key) ? 0.45 : 1,
                    }}
                    onMouseEnter={() => setHover({ row: r.id, key: s.key })}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </span>
            <span className="tabular text-right text-[12.5px] text-[var(--relay-ink)]">{props.format(total)}</span>
          </li>
        );
      })}
    </ul>
  );
}
