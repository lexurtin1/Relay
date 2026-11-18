"use client";

import { useRef, useState, type MouseEvent } from "react";

export type AreaPoint = { key: string; label: string; value: number };

/** Single series over time. Crosshair and tooltip on hover; recessive grid. */
export function AreaChart(props: { data: AreaPoint[]; format: (v: number) => string; height?: number; unit?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const h = props.height ?? 180;
  const n = props.data.length;
  const max = Math.max(...props.data.map((d) => d.value), 0) * 1.15 || 1;
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / max) * 100;
  const line = props.data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;

  const onMove = (e: MouseEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || n === 0) return;
    const ratio = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1);
    setIdx(Math.round(ratio * (n - 1)));
  };

  const active = idx !== null ? props.data[idx] : null;

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div ref={ref} className="relative" style={{ height: h }} onMouseMove={onMove} onMouseLeave={() => setIdx(null)}>
        {[0, 0.5, 1].map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-[var(--relay-chart-grid)]" style={{ top: `${g * 100}%` }} aria-hidden />
        ))}
        <span className="absolute left-0 top-0 -translate-y-full pb-0.5 text-[11px] tabular text-[var(--relay-ink-subtle)]">
          {props.format(Math.round(max))}
        </span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path d={area} fill="var(--relay-chart-agent)" opacity={0.12} />
          <path d={line} fill="none" stroke="var(--relay-chart-agent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {active && idx !== null ? (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--relay-border-strong)]" style={{ left: `${x(idx)}%` }} aria-hidden />
            <div
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--relay-surface)]"
              style={{ left: `${x(idx)}%`, top: `${y(active.value)}%`, background: "var(--relay-chart-agent)" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--relay-border)] bg-[var(--relay-surface)] px-2.5 py-1.5 text-[12px] shadow-md"
              style={{ left: `${Math.min(Math.max(x(idx), 12), 88)}%` }}
            >
              <span className="block text-[var(--relay-ink-muted)]">{active.label}</span>
              <span className="tabular font-medium text-[var(--relay-ink)]">
                {props.format(active.value)}
                {props.unit ? ` ${props.unit}` : ""}
              </span>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex justify-between text-[11px] text-[var(--relay-ink-subtle)]">
        {props.data
          .filter((_, i) => i % 3 === 0 || i === n - 1)
          .map((d) => (
            <span key={d.key}>{d.label}</span>
          ))}
      </div>
    </div>
  );
}
