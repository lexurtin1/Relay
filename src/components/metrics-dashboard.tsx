import Link from "next/link";
import type { MetricsSnapshot } from "@/lib/metrics";

export function MetricsDashboard(props: { data: MetricsSnapshot }) {
  const maxTokens = Math.max(...props.data.tokensByPhase.map((p) => p.tokens), 1);
  const maxBar = Math.max(...props.data.workstreamBars.map((b) => b.value), 1);
  const maxStage = Math.max(...props.data.stageCounts.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
            Metrics
          </h1>
          <p className="mt-2 max-w-[64ch] text-[17px] text-[var(--relay-ink-body)]">
            Token spend, stage load, and time share across agents and people. Figures are from
            mock/demo activity unless live database metrics are connected.
          </p>
        </div>
        <Link href="/audit" className="rl-btn-second no-underline">
          Open Audit
        </Link>
      </div>

      <section aria-labelledby="rl-share-h" className="flex flex-col gap-3">
        <h2 id="rl-share-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
          Time share
        </h2>
        <div className="rl-sheet overflow-hidden p-4">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)]">
            <div
              className="h-full bg-[var(--relay-brand)]"
              style={{ width: `${props.data.agentSharePct}%` }}
              title={`Agents ${props.data.agentSharePct}%`}
            />
            <div
              className="h-full bg-[var(--relay-warning)]"
              style={{ width: `${props.data.personSharePct}%` }}
              title={`People ${props.data.personSharePct}%`}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--relay-ink-muted)]">
            <span>
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--relay-brand)]" />
              Agents {props.data.agentSharePct}%
            </span>
            <span>
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--relay-warning)]" />
              People {props.data.personSharePct}%
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rl-tokens-h" className="flex flex-col gap-3">
          <h2 id="rl-tokens-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
            Tokens by phase
          </h2>
          <p className="m-0 text-sm text-[var(--relay-ink-muted)]">
            Total tracked:{" "}
            <span className="tabular text-[var(--relay-ink)]">
              {props.data.tokensTotal.toLocaleString()}
            </span>
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {props.data.tokensByPhase.map((phase) => (
              <li key={phase.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[var(--relay-ink)]">{phase.label}</span>
                  <span className="tabular text-[var(--relay-ink-muted)]">
                    {phase.tokens.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)]">
                  <div
                    className="h-full rounded-full bg-[var(--relay-brand-fg)]"
                    style={{ width: `${Math.max(4, (phase.tokens / maxTokens) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rl-stage-h" className="flex flex-col gap-3">
          <h2 id="rl-stage-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
            Active by stage
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {props.data.stageCounts.map((stage) => (
              <li key={stage.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[var(--relay-ink)]">{stage.label}</span>
                  <span className="tabular text-[var(--relay-ink-muted)]">{stage.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)]">
                  <div
                    className="h-full rounded-full bg-[color-mix(in_srgb,var(--relay-brand)_70%,white)]"
                    style={{ width: `${Math.max(4, (stage.count / maxStage) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="rl-ideas-m-h" className="flex flex-col gap-3">
        <h2 id="rl-ideas-m-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
          Ideas pressure
        </h2>
        <div className="rl-sheet grid gap-4 p-5 sm:grid-cols-3">
          <MetricLine label="Backlog ideas" value={String(props.data.ideaBacklog)} />
          <MetricLine
            label="Friction hours / week"
            value={props.data.frictionHoursPerWeek.toFixed(1)}
          />
          <MetricLine
            label="Approvals · hand-offs"
            value={`${props.data.approvals} · ${props.data.handOffs}`}
          />
        </div>
      </section>

      <section aria-labelledby="rl-ws-bars-h" className="flex flex-col gap-3">
        <h2 id="rl-ws-bars-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
          Workstream activity
        </h2>
        <ul className="rl-sheet m-0 flex list-none flex-col gap-4 p-4">
          {props.data.workstreamBars.map((bar) => (
            <li key={bar.id}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/workstreams/${bar.id}`}
                  className="text-sm font-medium text-[var(--relay-ink)] no-underline hover:underline"
                >
                  {bar.title}
                </Link>
                <span className="text-[13px] text-[var(--relay-ink-muted)]">{bar.label}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)]">
                <div
                  className="h-full rounded-full bg-[var(--relay-brand)]"
                  style={{ width: `${Math.max(6, (bar.value / maxBar) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricLine(props: { label: string; value: string }) {
  return (
    <div>
      <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">{props.label}</p>
      <p className="m-0 mt-1 text-2xl font-medium tabular tracking-[-0.02em] text-[var(--relay-ink)]">
        {props.value}
      </p>
    </div>
  );
}
