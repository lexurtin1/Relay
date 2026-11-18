"use client";

import { useState } from "react";
import { ColourDot } from "@/components/colour-dot";

export type BarDatum = { id: string; label: string; value: number; color?: string };

/** Ranked horizontal bars for one measure. One hue: the job is magnitude. */
export function BarList(props: { data: BarDatum[]; format: (v: number) => string; barColor?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...props.data.map((d) => d.value), 0) || 1;
  if (props.data.length === 0) return <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">Nothing merged yet.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {props.data.map((d) => (
        <li
          key={d.id}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_56px] items-center gap-3 rounded-lg px-1 py-0.5"
          style={{ background: hover === d.id ? "var(--relay-chart-grid)" : undefined }}
          onMouseEnter={() => setHover(d.id)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-[var(--relay-ink-body)]">
            {d.color ? <ColourDot color={d.color} size="sm" /> : null}
            <span className="truncate" title={d.label}>
              {d.label}
            </span>
          </span>
          <span className="relative h-3 rounded-[4px] bg-[var(--relay-chart-grid)]">
            <span
              className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[width] duration-500"
              style={{ width: `${(d.value / max) * 100}%`, background: props.barColor ?? "var(--relay-chart-agent)" }}
            />
          </span>
          <span className="tabular text-right text-[12.5px] text-[var(--relay-ink)]">{props.format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}
