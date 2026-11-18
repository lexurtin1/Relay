"use client";

import { GitPullRequest, Hammer, ListChecks, Search, UserCheck, type LucideIcon } from "lucide-react";
import type { StepperStage } from "@relay/core/domain";
import type { StageCount } from "@/lib/demo-store/selectors";

const ICONS: Record<StepperStage, LucideIcon> = {
  research: Search,
  plan: ListChecks,
  review: UserCheck,
  build: Hammer,
  pr: GitPullRequest,
};

/**
 * Workstream counts per stage. Each stage is run by an agent or a person.
 * A moving marker shows while any agent is running; amber badges count
 * workstreams waiting for input.
 */
export function RelayPipeline(props: {
  counts: StageCount[];
  selected?: StepperStage | null;
  onSelect?: (key: StepperStage | null) => void;
}) {
  const working = props.counts.some((c) => c.agentActive > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="rl-pipeline" role="group" aria-label="Workstreams by stage. Select a stage to filter.">
        <div className="rl-pipeline-track" aria-hidden>
          {working ? <span className="rl-pipeline-marker" /> : null}
        </div>
        {props.counts.map((c) => {
          const Icon = ICONS[c.key];
          const selected = props.selected === c.key;
          return (
            <button
              key={c.key}
              type="button"
              className="rl-pipeline-node"
              aria-pressed={selected}
              onClick={() => props.onSelect?.(selected ? null : c.key)}
              aria-label={`${c.label}: ${c.count} workstream${c.count === 1 ? "" : "s"}${c.blocked ? `, ${c.blocked} waiting for input` : ""}${c.agentActive ? `, ${c.holderLabel} running on ${c.agentActive}` : ""}`}
            >
              <span className="rl-pipeline-icon" data-agent={c.holder === "agent"} data-live={c.agentActive > 0}>
                <Icon className="h-[19px] w-[19px]" aria-hidden />
                {c.blocked > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--relay-warning)] px-1 text-[10.5px] font-semibold text-white">
                    {c.blocked}
                  </span>
                ) : null}
              </span>
              <span className="text-[12.5px] font-medium text-[var(--relay-ink)]">{c.label}</span>
              <span className="rl-stat-value text-[22px]">{c.count}</span>
              <span className="text-[11px] text-[var(--relay-ink-muted)]">
                {c.holder === "agent" ? (c.agentActive > 0 ? `${c.holderLabel} running` : c.holderLabel) : c.holderLabel}
              </span>
            </button>
          );
        })}
      </div>
      <p className="m-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--relay-ink-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--relay-brand-fg)]" aria-hidden />
          Agent step
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--relay-border-strong)]" aria-hidden />
          Person step
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--relay-warning)]" aria-hidden />
          Needs input
        </span>
      </p>
    </div>
  );
}
