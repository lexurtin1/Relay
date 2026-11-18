"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ACTIVE_BOARD_STAGES,
  COMPLETED_BOARD_STAGES,
  stageLabel,
  type WorkstreamCardModel,
  type WorkstreamStage,
} from "@relay/core";
import { ArrowRight, Plus } from "lucide-react";
import { ColourDot } from "@/components/colour-dot";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { formatTimeInStage } from "@/lib/utils";

export function NeedsYouStrip(props: { items: WorkstreamCardModel[] }) {
  if (props.items.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] px-4 py-3 shadow-sm">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
              Needs you
            </h2>
            <p className="mt-0.5 text-sm text-[var(--relay-ink-muted)]">
              Nothing waiting on you. Keep an eye on building workstreams or start a new one.
            </p>
          </div>
          <Link
            href="/workstreams/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-[var(--relay-primary-fg)] transition-relay hover:bg-[var(--relay-primary-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New workstream
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[color-mix(in_srgb,var(--relay-warning)_28%,var(--relay-border))] bg-[var(--relay-warning-soft)] shadow-sm">

      <div className="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--relay-warning)_18%,transparent)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-2 w-2 rounded-full bg-[var(--relay-warning)]"
            aria-hidden
          />
          <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
            Needs you
          </h2>
          <span className="tabular text-xs text-[var(--relay-warning)]">
            {props.items.length}
          </span>
        </div>
        <Link
          href="/workstreams/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--relay-primary)] px-3 py-1.5 text-sm font-medium text-[var(--relay-primary-fg)] transition-relay hover:bg-[var(--relay-primary-hover)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New workstream
        </Link>
      </div>
      <ul className="divide-y divide-[color-mix(in_srgb,var(--relay-warning)_12%,transparent)]">
        {props.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 px-4 py-2.5 animate-relay-in"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/workstreams/${item.id}`}
                className="block truncate text-sm font-medium text-[var(--relay-ink)] hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-[var(--relay-warning)]">
                {item.needsYouReason}
                {item.jiraKey ? (
                  <>
                    {" · "}
                    <span className="font-mono">{item.jiraKey}</span>
                  </>
                ) : null}
              </p>
            </div>
            <Link
              href={`/workstreams/${item.id}`}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--relay-border)] bg-[var(--relay-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--relay-ink)] transition-relay hover:border-[var(--relay-primary)]"
            >
              {item.needsYouAction ?? "Open"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WorkstreamBoard(props: { cards: WorkstreamCardModel[] }) {
  const [showCompleted, setShowCompleted] = useState(false);

  const byStage = useMemo(() => {
    return DASHBOARD_VISIBLE.reduce(
      (acc, stage) => {
        acc[stage] = props.cards.filter((card) => card.stage === stage);
        return acc;
      },
      {} as Record<WorkstreamStage, WorkstreamCardModel[]>,
    );
  }, [props.cards]);

  const activeStages = ACTIVE_BOARD_STAGES;
  const completedCards = props.cards.filter((c) =>
    COMPLETED_BOARD_STAGES.includes(c.stage),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-[var(--relay-ink-muted)]">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(event) => setShowCompleted(event.target.checked)}
            className="rounded-xl border-[var(--relay-border)]"
          />
          Show completed
          <span className="tabular">({completedCards.length})</span>
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {activeStages.map((stage) => {
          const items = byStage[stage] ?? [];
          if (items.length === 0) {
            return (
              <div
                key={stage}
                className="flex w-10 shrink-0 flex-col items-center rounded-2xl border border-dashed border-[var(--relay-border)] bg-[var(--relay-surface)] py-3"
                title={`No workstreams in ${stageLabel(stage)}`}
              >
                <span className="writing-mode-vertical text-[10px] font-semibold uppercase tracking-wide text-[var(--relay-ink-subtle)] [writing-mode:vertical-rl] rotate-180">
                  {stageLabel(stage)}
                </span>
              </div>
            );
          }

          return (
            <section
              key={stage}
              className="flex min-w-[240px] max-w-[300px] flex-1 flex-col rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface-sunken)]"
            >
              <header className="flex items-center justify-between gap-2 px-3 py-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
                  {stageLabel(stage)}
                </h2>
                <span className="tabular text-[11px] text-[var(--relay-ink-subtle)]">
                  {items.length}
                </span>
              </header>
              <div className="flex flex-col gap-2 px-2 pb-2">
                {items.map((card) => (
                  <WorkstreamCard key={card.id} card={card} />
                ))}
              </div>
            </section>
          );
        })}

        {showCompleted
          ? COMPLETED_BOARD_STAGES.map((stage) => {
              const items = byStage[stage] ?? [];
              if (items.length === 0) return null;
              return (
                <section
                  key={stage}
                  className="flex min-w-[240px] max-w-[300px] flex-1 flex-col rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface-sunken)]"
                >
                  <header className="flex items-center justify-between gap-2 px-3 py-2">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
                      {stageLabel(stage)}
                    </h2>
                    <span className="tabular text-[11px] text-[var(--relay-ink-subtle)]">
                      {items.length}
                    </span>
                  </header>
                  <div className="flex flex-col gap-2 px-2 pb-2">
                    {items.map((card) => (
                      <WorkstreamCard key={card.id} card={card} />
                    ))}
                  </div>
                </section>
              );
            })
          : null}
      </div>
    </div>
  );
}

const DASHBOARD_VISIBLE = [...ACTIVE_BOARD_STAGES, ...COMPLETED_BOARD_STAGES];

function WorkstreamCard(props: { card: WorkstreamCardModel }) {
  const { card } = props;
  const progress =
    card.stepsTotal > 0
      ? Math.round((card.stepsCompleted / card.stepsTotal) * 100)
      : 0;

  return (
    <Link
      href={`/workstreams/${card.id}`}
      className="block rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] p-3 shadow-sm transition-relay hover:border-[var(--relay-primary)] hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <ColourDot
          color={card.color}
          pulse={card.needsYou}
          className="mt-1"
          label={card.needsYou ? "Needs a decision" : undefined}
        />
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--relay-ink)]">
          {card.title}
        </h3>
        {card.agentActive ? (
          <span
            className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--relay-gateway-purple)] animate-relay-pulse"
            title="Agent actively running"
            aria-label="Agent actively running"
          />
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Avatar initials={card.ownerInitials} name={card.ownerName} />
        {card.jiraKey ? (
          <span className="font-mono text-[11px] text-[var(--relay-ink-muted)]">
            {card.jiraKey}
          </span>
        ) : null}
        <StatusPill stage={card.stage} />
      </div>

      {(card.stage === "building" || card.stage === "awaiting_input") &&
      card.stepsTotal > 0 ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--relay-ink-muted)]">
            <span>Plan steps</span>
            <span className="tabular">
              {card.stepsCompleted} of {card.stepsTotal}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-xl bg-[var(--relay-surface-sunken)]">
            <div
              className="h-full rounded-xl bg-[var(--relay-primary)] transition-relay"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--relay-ink-subtle)]">
        <span>{formatTimeInStage(card.stageEnteredAt)}</span>
        {card.needsYou ? (
          <span className="inline-flex items-center gap-1 text-[var(--relay-warning)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--relay-warning)]" aria-hidden />
            Needs you
          </span>
        ) : null}
      </div>
    </Link>
  );
}
