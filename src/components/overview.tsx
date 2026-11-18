"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { mapStageToStepper, type StepperStage } from "@relay/core/domain";
import { ColourDot } from "@/components/colour-dot";
import { PageHero } from "@/components/page-hero";
import { RelayPipeline } from "@/components/relay-pipeline";
import {
  segsForStage,
  statusToneClass,
  TimelineLegend,
  TimelineTrack,
} from "@/components/timeline-track";
import { EmptyState } from "@/components/ui/astryx";
import { useRelayActions } from "@/lib/demo-store/provider";
import type { StageCount } from "@/lib/demo-store/selectors";
import { formatRelativeTime } from "@/lib/utils";
import type { NeedsActionItem, OverviewStats, WorkstreamRowRow } from "@/lib/overview";

const MODES = [
  {
    id: "research" as const,
    label: "Research",
    ph: "Describe the problem. Scout starts reading company sources at once.",
    cta: "Start research",
  },
  {
    id: "idea" as const,
    label: "Log idea",
    ph: "Describe the friction or the external signal",
    cta: "Log idea",
  },
  {
    id: "find" as const,
    label: "Search",
    ph: "Search Confluence, Jira, Datadog, GitHub and connected sources",
    cta: "Search",
  },
];

export type OverviewProps = {
  appName: string;
  stats: OverviewStats;
  needsAction: NeedsActionItem[];
  rows: WorkstreamRowRow[];
  agentsActive: number;
  stageCounts: StageCount[];
};

export function OverviewPageView(props: OverviewProps) {
  const actions = useRelayActions();
  const [stage, setStage] = useState<StepperStage | null>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const needsN = props.needsAction.length;

  const rows = useMemo(
    () => (stage ? props.rows.filter((r) => mapStageToStepper(r.stage) === stage && r.stage !== "merged") : props.rows),
    [props.rows, stage],
  );

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHero
        id="overview"
        eyebrow="Innovation and Strategy workspace"
        title="Workstream overview"
        purpose={
          <>
            Each workstream goes through five stages: research (Scout), planning (Planner), review
            and approval (people), build (Runner) and pull request (owner merges). This page shows
            the stage of each workstream and the items that need your input.
          </>
        }
        stats={[
          { label: "Need your input", value: needsN, tone: needsN > 0 ? "waiting" : "default" },
          { label: "Agents running", value: props.agentsActive, tone: props.agentsActive > 0 ? "live" : "default" },
          { label: "In review", value: props.stats.inReview },
          { label: "Merged this week", value: props.stats.mergedThisWeek },
        ]}
        actions={
          <button type="button" className="rl-btn-primary rl-btn-compact" onClick={() => composerRef.current?.focus()}>
            Start work
          </button>
        }
        visual={<RelayPipeline counts={props.stageCounts} selected={stage} onSelect={setStage} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <WorkstreamTimelines rows={rows} stage={stage} onClear={() => setStage(null)} />
        <NeedsInputSection items={props.needsAction} />
      </div>

      <StartWorkComposer inputRef={composerRef} />
    </div>
  );
}

function StartWorkComposer(props: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const router = useRouter();
  const actions = useRelayActions();
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("research");
  const [draft, setDraft] = useState("");
  const current = MODES.find((m) => m.id === mode) ?? MODES[0]!;

  function go(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (mode === "find") {
      router.push(q ? `/knowledge?q=${encodeURIComponent(q)}` : "/knowledge");
      return;
    }
    if (mode === "idea") {
      if (actions.mode === "demo" && q) {
        if (actions.createIdea({ title: q, description: "", type: "friction_log" })) {
          setDraft("");
          router.push("/ideas");
        }
        return;
      }
      router.push(q ? `/ideas?draft=${encodeURIComponent(q)}` : "/ideas");
      return;
    }
    if (actions.mode === "demo" && q) {
      const id = actions.createWorkstream({ title: q, problemStatement: q });
      if (id) {
        setDraft("");
        router.push(`/workstreams/${id}`);
      }
      return;
    }
    router.push(q ? `/workstreams/new?title=${encodeURIComponent(q)}` : "/workstreams/new");
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 max-[900px]:pl-[calc(var(--relay-sidebar-rail)+12px)] min-[901px]:pl-[calc(var(--relay-sidebar-width)+16px)]">
      <section
        aria-labelledby="rl-start-h"
        className="rl-glass pointer-events-auto w-full max-w-[1100px] rounded-[18px] px-2.5 py-2 shadow-[0_16px_48px_-18px_rgba(13,19,31,0.45)]"
      >
        <h2 id="rl-start-h" className="sr-only">
          Start work
        </h2>
        <form className="flex flex-wrap items-center gap-2" onSubmit={go}>
          <div className="flex shrink-0 gap-1" role="group" aria-label="Type of work">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`rl-chip rl-chip-compact ${mode === m.id ? "rl-chip-on" : ""}`}
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="rl-ask-in">
            Describe what you need
          </label>
          <input
            ref={props.inputRef}
            id="rl-ask-in"
            className="rl-input rl-input-compact min-w-0 flex-[1_1_200px]"
            type="text"
            value={draft}
            placeholder={current.ph}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="rl-btn-primary rl-btn-compact">
            {current.cta}
          </button>
        </form>
      </section>
    </div>
  );
}

function NeedsInputSection(props: { items: NeedsActionItem[] }) {
  const actions = useRelayActions();
  return (
    <section
      aria-labelledby="rl-wait-h"
      className="rl-sheet rl-sheet-elevated flex max-h-[640px] min-h-0 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-[var(--relay-border)] px-4 py-3">
        <h2 id="rl-wait-h" className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
          Needs your input
        </h2>
        <span className="text-[12px] tabular text-[var(--relay-ink-muted)]">{props.items.length}</span>
      </div>
      {props.items.length === 0 ? (
        <div className="p-4">
          <EmptyState
            isCompact
            title="Nothing is waiting on you"
            description="When the Runner pauses with a question, or a plan needs review, it lands here."
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
          {props.items.map((item) => {
            const wsId = item.workstreamId ?? item.id.replace(/-[qcmh]$/, "");
            const href = `/workstreams/${wsId}`;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-2 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-3.5 animate-relay-in"
              >
                <div className="flex items-start gap-2">
                  <ColourDot color={item.color} pulse className="mt-1" label="Needs a decision" />
                  <p className="m-0 min-w-0 flex-1 text-[12px] text-[var(--relay-ink-muted)]">
                    {item.jiraKey ? <span className="font-mono">{item.jiraKey}</span> : null}
                    {item.jiraKey ? " · " : null}
                    <span className="text-[var(--relay-warning)]">{item.summary}</span>
                  </p>
                </div>
                <h3 className="m-0 text-[14.5px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
                  <Link href={href} className="text-inherit no-underline hover:underline">
                    {item.title}
                  </Link>
                </h3>
                {item.detail ? <p className="m-0 text-[13px] text-[var(--relay-ink-body)]">{item.detail}</p> : null}
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  {item.kind === "question" && actions.mode === "demo"
                    ? item.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className="rl-btn-second rl-btn-tiny"
                          onClick={() => actions.answerQuestion(wsId, option)}
                        >
                          {option}
                        </button>
                      ))
                    : null}
                  {item.kind === "approval" && actions.mode === "demo" ? (
                    <button type="button" className="rl-btn-primary rl-btn-tiny" onClick={() => actions.approvePlan(wsId)}>
                      Approve plan
                    </button>
                  ) : null}
                  {item.kind === "merge" && actions.mode === "demo" ? (
                    <button type="button" className="rl-btn-primary rl-btn-tiny" onClick={() => actions.mergePr(wsId)}>
                      Merge
                    </button>
                  ) : null}
                  <Link href={href} className="rl-btn-second rl-btn-tiny inline-flex items-center gap-1 no-underline">
                    {item.kind === "question" ? "Open" : item.actionLabel}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WorkstreamTimelines(props: { rows: WorkstreamRowRow[]; stage: StepperStage | null; onClear: () => void }) {
  return (
    <section aria-labelledby="rl-relay-h" className="rl-sheet rl-sheet-elevated flex max-h-[640px] min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--relay-border)] px-4 py-3">
        <h2 id="rl-relay-h" className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
          Workstream timelines
          {props.stage ? (
            <button type="button" onClick={props.onClear} className="ml-2 rounded-full bg-[var(--relay-brand-soft)] px-2 py-0.5 text-[11.5px] font-medium capitalize text-[var(--relay-brand-fg)]">
              {props.stage === "pr" ? "Pull request" : props.stage} · clear
            </button>
          ) : null}
        </h2>
        <TimelineLegend compact />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1.5">
        {props.rows.length === 0 ? (
          <p className="m-0 px-3 py-5 text-[13px] text-[var(--relay-ink-muted)]">No workstreams at this stage.</p>
        ) : null}
        {props.rows.map((row) => {
          const segs = segsForStage(row.stage, row.progressTone);
          const tone = row.progressTone === "waiting" ? "w" : row.progressTone === "done" ? "d" : row.progressTone === "active" ? "a" : "p";
          return (
            <Link
              key={row.id}
              href={`/workstreams/${row.id}`}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] px-3 py-2 text-left text-[var(--relay-ink)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_4%,transparent)]"
            >
              <ColourDot
                color={row.color}
                pulse={row.progressTone === "waiting"}
                className="mt-1.5"
                label={row.progressTone === "waiting" ? "Needs a decision" : undefined}
              />
              <span className="flex min-w-0 flex-[1_1_160px] flex-col gap-0.5">
                <span className="truncate text-[13.5px] font-medium">{row.title}</span>
                <span className="truncate text-[12px] text-[var(--relay-ink-muted)]">
                  <span className="font-mono">{row.jiraKey ?? row.id.slice(0, 8)}</span>
                  {" · "}
                  {row.ownerName}
                </span>
              </span>
              <TimelineTrack segs={segs} ariaLabel={`${row.title}. ${row.progressLabel}.`} className="h-3 flex-[1.4_1_200px]" />
              <span className="flex min-w-0 flex-[0_1_140px] flex-col gap-0.5 text-[12px]">
                <span className={statusToneClass(tone)}>{row.progressLabel}</span>
                <span className="text-[11px] text-[var(--relay-ink-muted)]" suppressHydrationWarning>
                  {formatRelativeTime(row.updatedAt)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
