"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorkstreamStage } from "@relay/core/domain";
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
  const segs = segsForStage(
    props.stage,
    props.openQuestion
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
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <Link
          href="/workstreams"
          className="inline-flex min-h-11 items-center rounded-[10px] px-2.5 text-sm text-[var(--relay-ink-muted)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] hover:text-[var(--relay-ink)]"
        >
          Back to workstreams
        </Link>
        <p className="mt-2 text-[13px] text-[var(--relay-ink-muted)]">
          {props.jiraKey ? (
            <span className="font-mono">{props.jiraKey}</span>
          ) : (
            <span className="font-mono">{props.id.slice(0, 8)}</span>
          )}
          {" · Owner "}
          {props.ownerName}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <ColourDot
            color={props.color}
            pulse={Boolean(props.openQuestion)}
            size="md"
            label={props.openQuestion ? "Needs a decision" : undefined}
          />
          <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
            {props.title}
          </h1>
        </div>
        <p
          className={cn(
            "mt-2.5 text-[17px] capitalize",
            props.openQuestion
              ? "text-[var(--relay-warning)]"
              : "text-[var(--relay-brand-fg)]",
          )}
        >
          {statusLine}
        </p>
      </div>

      <StageStepper stage={props.stage} />

      <div>
        <TimelineTrack
          segs={segs}
          ariaLabel={`${props.title} timeline`}
          large
        />
        <p className="mt-2.5 text-[13px] text-[var(--relay-ink-muted)]">
          Timeline · Updated {formatRelativeTime(props.history[0]?.at ?? new Date().toISOString())}
        </p>
      </div>

      {props.openQuestion ? (
        <section className="rl-sheet flex flex-col gap-3 p-7" aria-labelledby="rl-q-h">
          <h2 id="rl-q-h" className="m-0 text-xl font-medium text-[var(--relay-warning)]">
            Question from the Runner
          </h2>
          <p className="m-0 text-[17px] text-[var(--relay-ink)]">{props.openQuestion}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rl-btn-second">
              Answer in workstream
            </button>
          </div>
        </section>
      ) : null}

      <ResearchActivity
        workstreamId={props.id}
        userAsk={props.problemStatement}
        steps={props.researchSteps}
        liveToolsLine={props.liveToolsLine}
        color={props.color}
      />

      <div className="flex flex-wrap items-start gap-6">
        <section
          className="rl-sheet min-w-0 flex-[1_1_300px] p-6"
          aria-labelledby="rl-sess-h"
        >
          <h2 id="rl-sess-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
            Agent session
          </h2>
          <p className="mt-1.5 text-[13px] text-[var(--relay-ink-muted)]">
            Everything Scout, the Runner and people did on this workstream, newest first.
          </p>
          <ol className="mt-4 flex list-none flex-col gap-3.5 p-0">
            {props.history.length === 0 ? (
              <li className="text-sm text-[var(--relay-ink-muted)]">No history yet.</li>
            ) : (
              props.history.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded bg-[var(--relay-seg-agent)]"
                    aria-hidden
                  />
                  <span>
                    <span className="block">
                      <span className="mr-2 inline-block text-[11.5px] uppercase tracking-[0.06em] text-[var(--relay-brand-fg)]">
                        Event
                      </span>
                      {item.label}
                    </span>
                    <span className="text-[13px] text-[var(--relay-ink-muted)]">
                      {formatRelativeTime(item.at)}
                    </span>
                  </span>
                </li>
              ))
            )}
          </ol>

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-subtle)]">
              Sources read by Scout
            </h3>
            {props.sources.length === 0 ? (
              <p className="text-sm text-[var(--relay-ink-muted)]">
                No sources yet. Start research to populate this list.
              </p>
            ) : (
              <ul className="space-y-2">
                {props.sources.map((source) => (
                  <li
                    key={`${source.connector}-${source.itemId ?? source.title}`}
                    className="rounded-[14px] border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-ink)_4%,transparent)] px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-[var(--relay-ink)]">{source.title}</div>
                    <div className="text-xs capitalize text-[var(--relay-ink-subtle)]">
                      {source.connector}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <section className="rl-sheet flex flex-col gap-5 p-7" aria-labelledby="plan-heading">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">{actionStatus}</p>
                <h2
                  id="plan-heading"
                  className="m-0 mt-1 text-xl font-medium text-[var(--relay-ink)]"
                >
                  Plan
                </h2>
              </div>
              {props.planVersion ? (
                <div className="text-[13px] text-[var(--relay-ink-muted)]">
                  Version {props.planVersion} of {props.planTotalVersions}
                </div>
              ) : null}
            </div>
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
                <p className="mt-1">
                  {props.researchSummary ?? props.problemStatement}
                </p>
              </div>
            )}
          </section>

          <section className="rl-sheet p-6" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
              Comments {openComments > 0 ? `· ${openComments} open` : ""}
            </h2>
            {props.comments.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--relay-ink-muted)]">
                No comments yet. Select text in the plan to leave an anchored note.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {props.comments.map((comment) => (
                  <li
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={cn(
                      "rounded-[14px] border p-3.5 text-sm transition-relay scroll-mt-24",
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
                      {comment.anchorText ? (
                        <>
                          {" · on \u201c"}
                          <a
                            href={`#anchor-${comment.id}`}
                            className="text-[var(--relay-warning)] hover:underline"
                          >
                            {comment.anchorText}
                          </a>
                          {"\u201d"}
                        </>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[var(--relay-ink)]">{comment.body}</p>
                    {comment.resolved ? (
                      <p className="mt-2 text-[13px] text-[var(--relay-success)]">Resolved</p>
                    ) : (
                      <div className="mt-2 flex gap-3 text-xs font-medium text-[var(--relay-brand-fg)]">
                        <button type="button" className="hover:underline">
                          Reply
                        </button>
                        <button type="button" className="hover:underline">
                          Resolve
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ActionBar
        state={props.actionState}
        role={props.role}
        workstreamId={props.id}
        planId={props.planId}
        color={props.color}
      />
    </div>
  );
}
