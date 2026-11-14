import Link from "next/link";
import type { DashboardCounts, WorkstreamCardModel, WorkstreamStage } from "@relay/core";
import { DASHBOARD_STAGE_COLUMNS, stageLabel } from "@relay/core";
import { formatRelativeTime } from "@/lib/utils";

export function DashboardTopBar(props: { counts: DashboardCounts }) {
  const items = [
    { label: "In research", value: props.counts.inResearch },
    { label: "In review", value: props.counts.inReview },
    { label: "Building", value: props.counts.building },
    { label: "Awaiting input", value: props.counts.awaitingInput },
    { label: "PRs open", value: props.counts.prsOpen },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[110px] rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3 py-2"
        >
          <div className="text-xs text-[var(--relay-ink-subtle)]">{item.label}</div>
          <div className="text-xl font-semibold tabular-nums text-[var(--relay-ink)]">
            {item.value}
          </div>
        </div>
      ))}
      <Link
        href="/workstreams/new"
        className="ml-auto rounded bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--relay-primary-hover)]"
      >
        New workstream
      </Link>
    </div>
  );
}

export function WorkstreamBoard(props: { cards: WorkstreamCardModel[] }) {
  const byStage = DASHBOARD_STAGE_COLUMNS.reduce(
    (acc, stage) => {
      acc[stage] = props.cards.filter((card) => card.stage === stage);
      return acc;
    },
    {} as Record<WorkstreamStage, WorkstreamCardModel[]>,
  );

  const visibleStages = DASHBOARD_STAGE_COLUMNS.filter(
    (stage) => (byStage[stage]?.length ?? 0) > 0 || ["research", "in_review", "building", "awaiting_input", "pr_open"].includes(stage),
  );

  return (
    <div className="mt-4 grid gap-3 overflow-x-auto pb-2 md:grid-flow-col md:auto-cols-[280px]">
      {visibleStages.map((stage) => (
        <section key={stage} className="min-h-[320px] rounded border border-[var(--relay-border)] bg-[var(--relay-surface-sunken)]">
          <header className="flex items-center justify-between border-b border-[var(--relay-border)] px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-muted)]">
              {stageLabel(stage)}
            </h2>
            <span className="text-xs tabular-nums text-[var(--relay-ink-subtle)]">
              {byStage[stage]?.length ?? 0}
            </span>
          </header>
          <div className="flex flex-col gap-2 p-2">
            {(byStage[stage] ?? []).map((card) => (
              <WorkstreamCard key={card.id} card={card} />
            ))}
            {(byStage[stage]?.length ?? 0) === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-[var(--relay-ink-subtle)]">
                No workstreams
              </p>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function WorkstreamCard(props: { card: WorkstreamCardModel }) {
  const { card } = props;
  return (
    <Link
      href={`/workstreams/${card.id}`}
      className="block rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] p-3 hover:border-[var(--relay-primary)]"
    >
      <div className="flex items-start gap-2">
        <h3 className="text-sm font-semibold leading-snug text-[var(--relay-ink)]">
          {card.title}
        </h3>
        {card.needsYou ? (
          <span
            className="ml-auto shrink-0 rounded bg-[var(--relay-danger-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--relay-danger)]"
            title={card.needsYouReason ?? "Needs you"}
          >
            Needs you
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--relay-ink-subtle)]">
        {card.jiraKey ? <span>{card.jiraKey}</span> : null}
        <span className="capitalize">{card.priority}</span>
        <span>{card.ownerName}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-[var(--relay-ink-muted)]">
        {card.lastAgentActivity ?? "No agent activity yet"}
      </p>
      <p className="mt-2 text-[11px] text-[var(--relay-ink-subtle)]">
        {formatRelativeTime(card.lastActivityAt)}
      </p>
    </Link>
  );
}
