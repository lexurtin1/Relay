"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorkstreamStage } from "@relay/core";
import { StageStepper } from "@/components/stage-stepper";
import { PlanDocument, type PlanCommentView, type PlanStepView } from "@/components/plan-document";
import { ActionBar, type ActionBarState } from "@/components/action-bar";
import { StatusPill } from "@/components/ui/status-pill";
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
  planVersion: number | null;
  planTotalVersions: number;
  planMarkdown: string | null;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  researchSummary: string | null;
  sources: ResearchSourceView[];
  history: HistoryItemView[];
  openQuestion: string | null;
  actionState: ActionBarState;
}) {
  const [hoverCommentId, setHoverCommentId] = useState<string | null>(null);
  const openComments = props.comments.filter((c) => !c.resolved).length;

  return (
    <div className="pb-24">
      <div className="space-y-4">
        <div>
          <div className="text-xs text-[var(--relay-ink-muted)]">
            <Link href="/workstreams" className="hover:text-[var(--relay-ink)]">
              Workstreams
            </Link>
            {props.jiraKey ? (
              <>
                {" / "}
                <span className="font-mono">{props.jiraKey}</span>
              </>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-[var(--relay-ink)]">
                {props.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--relay-ink-muted)]">
                <span>
                  Owner {props.ownerName} · Origin: {props.origin.replaceAll("_", " ")} ·{" "}
                  {props.jiraKey ? (
                    <>
                      Jira <span className="font-mono">{props.jiraKey}</span> ·{" "}
                    </>
                  ) : null}
                  Priority {props.priority}
                </span>
              </div>
            </div>
            <StatusPill stage={props.stage} />
          </div>
          <div className="mt-4">
            <StageStepper stage={props.stage} />
          </div>
        </div>

        {props.openQuestion ? (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--relay-warning)_30%,white)] bg-[var(--relay-warning-soft)] p-4 shadow-sm">
            <div className="text-sm font-semibold text-[var(--relay-warning)]">
              Runner needs you
            </div>
            <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">{props.openQuestion}</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1.25fr)_280px]">
          <section aria-labelledby="research-heading" className="space-y-4">
            <div>
              <h2
                id="research-heading"
                className="font-display mb-2 text-sm font-semibold text-[var(--relay-ink)]"
              >
                Research
              </h2>
              <div className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] p-3 text-sm text-[var(--relay-ink-muted)] shadow-sm">
                {props.researchSummary ?? props.problemStatement}
              </div>
            </div>

            <div>
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
                      className="rounded-xl border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3 py-2 text-sm shadow-sm"
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

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-subtle)]">
                History
              </h3>
              <ol className="space-y-2 border-l border-[var(--relay-border)] pl-3">
                {props.history.length === 0 ? (
                  <li className="text-sm text-[var(--relay-ink-muted)]">No history yet.</li>
                ) : (
                  props.history.map((item) => (
                    <li key={item.id} className="text-sm">
                      <div className="text-[var(--relay-ink)]">{item.label}</div>
                      <div className="text-xs text-[var(--relay-ink-subtle)]">
                        {formatRelativeTime(item.at)}
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </section>

          <section aria-labelledby="plan-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2
                id="plan-heading"
                className="font-display text-sm font-semibold text-[var(--relay-ink)]"
              >
                Implementation plan
              </h2>
              {props.planVersion ? (
                <div className="text-xs text-[var(--relay-ink-muted)]">
                  Version {props.planVersion} of {props.planTotalVersions}
                  {props.planTotalVersions > 1 ? (
                    <button
                      type="button"
                      className="ml-2 text-[var(--relay-primary)] hover:underline"
                    >
                      Compare with v{props.planVersion - 1}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {props.planMarkdown ? (
              <div className="rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 shadow-sm">
                <PlanDocument
                  markdown={props.planMarkdown}
                  steps={props.steps}
                  comments={props.comments}
                  highlightedCommentId={hoverCommentId}
                  onHoverAnchor={setHoverCommentId}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 text-sm text-[var(--relay-ink-muted)]">
                <p className="font-medium text-[var(--relay-ink)]">No plan yet</p>
                <p className="mt-1">
                  Generate a plan after research finishes. Structured steps, risks, and files will
                  appear here.
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="comments-heading">
            <h2
              id="comments-heading"
              className="font-display mb-3 text-sm font-semibold text-[var(--relay-ink)]"
            >
              Comments {openComments > 0 ? `${openComments} open` : ""}
            </h2>
            {props.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 text-sm text-[var(--relay-ink-muted)]">
                <p className="font-medium text-[var(--relay-ink)]">No comments yet</p>
                <p className="mt-1">
                  Select text in the plan to leave an anchored note for teammates or the Planner.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {props.comments.map((comment) => (
                  <li
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={cn(
                      "rounded-2xl border bg-[var(--relay-surface)] p-3 text-sm shadow-sm transition-relay scroll-mt-24",
                      hoverCommentId === comment.id
                        ? "border-[var(--relay-primary)]"
                        : "border-[var(--relay-border)]",
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
                    <div className="mt-2 flex gap-3 text-xs font-medium text-[var(--relay-primary)]">
                      <button type="button" className="hover:underline">
                        Reply
                      </button>
                      <button type="button" className="hover:underline">
                        Resolve
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ActionBar state={props.actionState} role={props.role} />
    </div>
  );
}
