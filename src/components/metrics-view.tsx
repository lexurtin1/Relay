"use client";

import Link from "next/link";
import { AreaChart } from "@/components/charts/area-chart";
import { BarList } from "@/components/charts/bar-list";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { StackedBars } from "@/components/charts/stacked-bars";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/ui/astryx";
import type { MetricsModel } from "@/lib/demo-store/selectors";

const SERIES = [
  { key: "agent", label: "Agent working", color: "var(--relay-chart-agent)" },
  { key: "person", label: "Person working", color: "var(--relay-chart-person)" },
  { key: "waiting", label: "Waiting on a person", color: "var(--relay-chart-waiting)" },
];

const days = (v: number) => (v < 1 ? `${Math.round(v * 24)}h` : `${v.toFixed(1)}d`);
const hours = (v: number) => (v < 1 ? `${Math.round(v * 60)}m` : `${v.toFixed(v < 10 ? 1 : 0)}h`);
const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k` : String(v));

export function MetricsView(props: { metrics: MetricsModel | null }) {
  const m = props.metrics;
  return (
    <div className="flex flex-col gap-4">
      <PageHero
        id="metrics"
        eyebrow="Metrics"
        title="How fast work moves, and who carries it"
        purpose="Cycle time from problem to merge, the share of time agents carry versus people, and model use through the AI Gateway. Every number comes from the same events as the audit log."
        stats={
          m
            ? [
                { label: "Merged", value: m.totals.merged },
                { label: "Median cycle time", value: m.totals.medianCycleDays === null ? "None" : days(m.totals.medianCycleDays) },
                { label: "Time carried by agents", value: `${Math.round(m.totals.agentShare * 100)}%`, tone: "live" },
                { label: "Tokens this week", value: compact(m.totals.tokensWeek) },
              ]
            : []
        }
        actions={
          <Link href="/audit" className="rl-btn-second rl-btn-compact inline-flex items-center no-underline">
            Open audit log
          </Link>
        }
      />

      {!m ? (
        <div className="rl-sheet p-8">
          <EmptyState
            title="Metrics arrive with the worker"
            description="In database mode these charts need agent events from the worker (Milestone 6). The demo shows them from browser data today."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <ChartFrame
              title="Cycle time to merge"
              subtitle="Days from workstream created to pull request merged"
              table={{ head: ["Workstream", "Days"], rows: m.cycle.map((c) => [c.title, c.days.toFixed(1)]) }}
            >
              <BarList data={m.cycle.map((c) => ({ id: c.id, label: c.title, value: c.days, color: c.color }))} format={days} />
            </ChartFrame>

            <ChartFrame
              title="Who carried the work"
              subtitle="Hours by workstream, split by who held the baton"
              legend={
                <div className="flex flex-wrap gap-3">
                  {SERIES.map((s) => (
                    <LegendItem key={s.key} color={s.color} label={s.label} />
                  ))}
                </div>
              }
              table={{
                head: ["Workstream", "Agent h", "Person h", "Waiting h"],
                rows: m.share.map((r) => [r.title, r.agentHours.toFixed(1), r.personHours.toFixed(1), r.waitingHours.toFixed(1)]),
              }}
            >
              <StackedBars
                series={SERIES}
                rows={m.share.map((r) => ({ id: r.id, label: r.title, values: { agent: r.agentHours, person: r.personHours, waiting: r.waitingHours } }))}
                format={hours}
              />
            </ChartFrame>
          </div>

          <ChartFrame
            title="Model tokens per day"
            subtitle="Scout, Planner and Runner calls through the SS&C AI Gateway, last 14 days"
            table={{ head: ["Day", "Tokens"], rows: m.tokensByDay.map((d) => [d.label, d.tokens]) }}
          >
            <AreaChart data={m.tokensByDay.map((d) => ({ key: d.day, label: d.label, value: d.tokens }))} format={compact} unit="tokens" />
          </ChartFrame>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Plans approved", value: m.totals.approvals, hint: "Every approval is in the audit log" },
              { label: "Runner questions answered", value: m.totals.questionsAnswered, hint: "Times a person unblocked an agent" },
              { label: "Agent share of elapsed time", value: `${Math.round(m.totals.agentShare * 100)}%`, hint: "Across the busiest eight workstreams" },
            ].map((t) => (
              <section key={t.label} className="rl-sheet p-5">
                <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">{t.label}</p>
                <p className="rl-stat-value m-0 mt-2">{t.value}</p>
                <p className="m-0 mt-2 text-[12px] text-[var(--relay-ink-subtle)]">{t.hint}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
