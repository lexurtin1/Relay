"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useDemo, useRelayActions } from "@/lib/demo-store/provider";
import { cn } from "@/lib/utils";

export type HeroStat = {
  label: string;
  value: string | number;
  hint?: string;
  /** Amber only when a person is blocking work. */
  tone?: "default" | "waiting" | "live";
};

/**
 * Compact operational hero: what this page is for, the live numbers that
 * matter, and the primary action. Collapses to a one-line strip; the choice is
 * remembered per page in the demo store.
 */
export function PageHero(props: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  purpose: ReactNode;
  stats?: HeroStat[];
  actions?: ReactNode;
  visual?: ReactNode;
  className?: string;
}) {
  const actions = useRelayActions();
  const stored = useDemo((s) => s.ui.heroCollapsed[props.id] ?? false);
  const [local, setLocal] = useState(false);
  const collapsed = stored ?? local;

  const toggle = () => {
    if (actions.mode === "demo") actions.setHero(props.id, !collapsed);
    else setLocal(!collapsed);
  };

  if (collapsed) {
    return (
      <section
        className={cn("rl-hero flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3", props.className)}
        aria-label={typeof props.title === "string" ? props.title : props.eyebrow}
      >
        <h1 className="m-0 text-[17px] font-medium tracking-[-0.02em] text-[var(--relay-ink)]">{props.title}</h1>
        {props.stats?.length ? (
          <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
            {props.stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <dt className="text-[var(--relay-ink-muted)]">{s.label}</dt>
                <dd className={cn("m-0 tabular font-semibold", toneClass(s.tone))}>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {props.actions}
          <button type="button" onClick={toggle} className="rl-btn-second rl-btn-tiny inline-flex items-center gap-1" aria-expanded={false}>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            Show
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("rl-hero animate-relay-in grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center", !props.visual && "lg:grid-cols-1", props.className)}
      aria-labelledby={`${props.id}-hero-title`}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="rl-eyebrow">{props.eyebrow}</p>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-[var(--relay-ink-muted)] transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] hover:text-[var(--relay-ink)]"
            aria-expanded
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            Hide
          </button>
        </div>
        <h1
          id={`${props.id}-hero-title`}
          className="m-0 text-[clamp(24px,2.6vw,34px)] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--relay-ink)]"
        >
          {props.title}
        </h1>
        <p className="m-0 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--relay-ink-body)]">{props.purpose}</p>
        {props.stats?.length ? (
          <dl className="m-0 mt-1 flex flex-wrap items-start gap-x-7 gap-y-3">
            {props.stats.map((s) => (
              <div key={s.label} className="flex min-w-[88px] flex-col-reverse gap-1">
                <dt className="text-[12px] text-[var(--relay-ink-muted)]">
                  {s.label}
                  {s.hint ? <span className="block text-[11px] text-[var(--relay-ink-subtle)]">{s.hint}</span> : null}
                </dt>
                <dd className={cn("rl-stat-value m-0", toneClass(s.tone))}>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {props.actions ? <div className="mt-1 flex flex-wrap gap-2">{props.actions}</div> : null}
      </div>
      {props.visual ? <div className="min-w-0">{props.visual}</div> : null}
    </section>
  );
}

function toneClass(tone: HeroStat["tone"]) {
  if (tone === "waiting") return "text-[var(--relay-warning)]";
  if (tone === "live") return "text-[var(--relay-brand-fg)]";
  return "";
}
