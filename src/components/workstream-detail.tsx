"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorkstreamStage } from "@relay/core";
import { StageStepper } from "@/components/stage-stepper";
import { PlanDocument, type PlanCommentView, type PlanStepView } from "@/components/plan-document";
import {
  ActionBar,
  planActionStatus,
  type ActionBarState,
} from "@/components/action-bar";
import { ColourDot } from "@/components/colour-dot";
import {
  ResearchActivity,
  type ResearchStepView,
} from "@/components/research-activity";
import {
  segsForStage,
  TimelineTrack,
} from "@/components/timeline-track";
import { cn, formatRelativeTime } from "@/lib/utils";

export type ResearchSourceView = {
  connector: string;
  title: string;
  itemId?: string;
};

export type HistoryItemView = {
  id: string;
  label: string;
  at: string;
};

export function WorkstreamDetail(props: {
  id: string;
  title: string;
  problemStatement: string;
  stage: WorkstreamStage;
  ownerName: string;
  origin: string;
  priority: string;
  jiraKey: string | null;
  role: string;
  color: string;
  planId: string | null;
  planVersion: number | null;
  planTotalVersions: number;
  planMarkdown: string | null;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  researchSummary: string | null;
  sources: ResearchSourceView[];
  researchSteps: ResearchStepView[];
  liveToolsLine: string | null;
  history: HistoryItemView[];
  openQuestion: string | null;
  actionState: ActionBarState;
}) {
  const [hoverCommentId, setHoverCommentId] = useState<string | null>(null);
  const openComments = props.comments.filter((c) => !c.resolved).length;
  const waiting = Boolean(props.openQuestion) || props.stage === "awaiting_input" || props.stage === "in_review";
  const segs = segsForStage(
    props.stage,
    props.openQuestion || props.stage === "awaiting_input"
      ? "waiting"
      : props.stage === "building" || props.stage === "research"
        ? "active"
        : props.stage === "merged" || props.stage === "pr_open"
          ? "done"
          : "neutral",
  );

  const statusLine = props.openQuestion
    ? "Runner paused, waiting on you"
    : props.stage === "in_review"
      ? `Plan in review${openComments ? `, ${openComments} open comments` : ""}`
      : props.stage.replaceAll("_", " ");

  const actionStatus = planActionStatus(props.actionState);

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--relay-ink-muted)]">
            <Link
              href="/workstreams"
              className="inline-flex min-h-9 items-center rounded-[10px] px-2 text-sm text-[var(--relay-ink-muted)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] hover:text-[var(--relay-ink)]"
            >
              Back
            </Link>
            <span aria-hidden>·</span>
            {props.jiraKey ? (
              <span className="font-mono">{props.jiraKey}</span>
            ) : (
              <span className="font-mono">{props.id.slice(0, 8)}</span>
            )}
            <span aria-hidden>·</span>
            <span>{props.ownerName}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <ColourDot
              color={props.color}
              pulse={waiting}
              size="md"
              label={waiting ? "Needs a decision" : undefined}
            />
            <h1 className="m-0 text-[clamp(22px,2.6vw,32px)] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--relay-ink)]">
              {props.title}
            </h1>
          </div>
          <p
            className={cn(
              "m-0 mt-1.5 text-[15px] capitalize",
              waiting ? "text-[var(--relay-warning)]" : "text-[var(--relay-brand-fg)]",
            )}
          >
            {statusLine}
          </p>
        </div>
        <div className="shrink-0">
          <ActionBar
            state={props.actionState}
            role={props.role}
            workstreamId={props.id}
            planId={props.planId}
            color={props.color}
            inline
          />
        </div>
      </div>

      <StageStepper stage={props.stage} />

      <div className="rl-sheet rl-sheet-elevated px-4 py-3">
        <TimelineTrack
          segs={segs}
          ariaLabel={`${props.title} timeline`}
          large
          showLegend
          legendCompact
        />
        <p className="m-0 mt-1.5 text-[12px] text-[var(--relay-ink-muted)]">
          Updated {formatRelativeTime(props.history[0]?.at ?? new Date().toISOString())}
        </p>
      </div>

      {props.openQuestion ? (
        <section
          className="rl-sheet flex flex-col gap-2 border-[color-mix(in_srgb,var(--relay-warning)_35%,var(--relay-border))] bg-[var(--relay-warning-soft)] p-4"
          aria-labelledby="rl-q-h"
        >
          <h2 id="rl-q-h" className="m-0 text-[15px] font-medium text-[var(--relay-warning)]">
            Needs your decision
          </h2>
          <p className="m-0 text-[15px] text-[var(--relay-ink)]">{props.openQuestion}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rl-btn-primary rl-btn-compact">
              Answer now
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)]">
        <section className="rl-sheet flex min-h-0 flex-col gap-3 p-4" aria-labelledby="plan-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">{actionStatus}</p>
              <h2
                id="plan-heading"
                className="m-0 mt-0.5 text-[17px] font-medium text-[var(--relay-ink)]"
              >
                Plan
                {props.planVersion
                  ? ` · v${props.planVersion} of ${props.planTotalVersions}`
                  : ""}
              </h2>
            </div>
          </div>
          <div className="min-h-0 max-h-[min(52vh,560px)] overflow-y-auto pr-1">
            {props.planMarkdown ? (
              <PlanDocument
                markdown={props.planMarkdown}
                steps={props.steps}
                comments={props.comments}
                highlightedCommentId={hoverCommentId}
                onHoverAnchor={setHoverCommentId}
              />
            ) : (
              <div className="text-sm text-[var(--relay-ink-muted)]">
                <p className="m-0 font-medium text-[var(--relay-ink)]">No plan yet</p>
                <p className="mt-1">{props.researchSummary ?? props.problemStatement}</p>
              </div>
            )}
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-3">
          <section className="rl-sheet flex min-h-0 flex-1 flex-col p-4" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="m-0 text-[17px] font-medium text-[var(--relay-ink)]">
              Comments {openComments > 0 ? `· ${openComments} open` : ""}
            </h2>
            {props.comments.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--relay-ink-muted)]">
                No comments yet.
              </p>
            ) : (
              <ul className="mt-2 max-h-[min(28vh,280px)] space-y-2 overflow-y-auto p-0">
                {props.comments.map((comment) => (
                  <li
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={cn(
                      "list-none rounded-[12px] border p-3 text-sm transition-relay",
                      comment.resolved
                        ? "border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-success)_8%,transparent)]"
                        : "border-[color-mix(in_srgb,var(--relay-warning)_30%,transparent)] bg-[var(--relay-warning-soft)]",
                      hoverCommentId === comment.id && "border-[var(--relay-brand-fg)]",
                    )}
                    onMouseEnter={() => setHoverCommentId(comment.id)}
                    onMouseLeave={() => setHoverCommentId(null)}
                  >
                    <div className="text-xs text-[var(--relay-ink-subtle)]">
                      {comment.authorName}
                      {comment.anchorText ? ` · on “${comment.anchorText}”` : ""}
                    </div>
                    <p className="mt-1 text-[var(--relay-ink)]">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rl-sheet p-4" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">
              Sources
            </h2>
            {props.sources.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--relay-ink-muted)]">None yet.</p>
            ) : (
              <ul className="mt-2 m-0 max-h-[140px] list-none space-y-1.5 overflow-y-auto p-0">
                {props.sources.map((source) => (
                  <li
                    key={`${source.connector}-${source.itemId ?? source.title}`}
                    className="rounded-[10px] border border-[var(--relay-border)] px-2.5 py-1.5 text-sm"
                  >
                    <div className="truncate font-medium text-[var(--relay-ink)]">{source.title}</div>
                    <div className="text-[11px] capitalize text-[var(--relay-ink-subtle)]">
                      {source.connector}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <details className="rl-sheet p-4">
        <summary className="cursor-pointer text-[15px] font-medium text-[var(--relay-ink)]">
          Research activity
          {props.liveToolsLine ? (
            <span className="ml-2 font-mono text-[12px] font-normal text-[var(--relay-ink-subtle)]">
              {props.liveToolsLine}
            </span>
          ) : null}
        </summary>
        <div className="mt-3">
          <ResearchActivity
            workstreamId={props.id}
            userAsk={props.problemStatement}
            steps={props.researchSteps}
            liveToolsLine={props.liveToolsLine}
            color={props.color}
          />
        </div>
      </details>

      <details className="rl-sheet p-4">
        <summary className="cursor-pointer text-[15px] font-medium text-[var(--relay-ink)]">
          Agent session · {props.history.length} events
        </summary>
        <ol className="mt-3 flex list-none flex-col gap-2.5 p-0">
          {props.history.length === 0 ? (
            <li className="text-sm text-[var(--relay-ink-muted)]">No history yet.</li>
          ) : (
            props.history.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--relay-seg-agent)]"
                  aria-hidden
                />
                <span>
                  <span className="text-[var(--relay-ink)]">{item.label}</span>
                  <span className="ml-2 text-[12px] text-[var(--relay-ink-muted)]">
                    {formatRelativeTime(item.at)}
                  </span>
                </span>
              </li>
            ))
          )}
        </ol>
      </details>
    </div>
  );
}
