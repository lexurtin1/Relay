"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WorkstreamStage } from "@relay/core";
import { StageStepper } from "@/components/stage-stepper";
import { PlanDocument, type PlanCommentView, type PlanStepView } from "@/components/plan-document";
import { ActivityTimeline, type ActivityEventView } from "@/components/activity-timeline";
import { ActionBar, type ActionBarState } from "@/components/action-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

export function WorkstreamDetail(props: {
  id: string;
  title: string;
  problemStatement: string;
  stage: WorkstreamStage;
  ownerName: string;
  jiraKey: string | null;
  role: string;
  planVersion: number | null;
  planMarkdown: string | null;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  events: ActivityEventView[];
  openQuestion: string | null;
  actionState: ActionBarState;
}) {
  const [hoverCommentId, setHoverCommentId] = useState<string | null>(null);

  const commentsByStep = useMemo(() => {
    const map = new Map<string | "general", PlanCommentView[]>();
    for (const comment of props.comments) {
      const key = comment.stepId ?? "general";
      const list = map.get(key) ?? [];
      list.push(comment);
      map.set(key, list);
    }
    return map;
  }, [props.comments]);

  return (
    <div className="pb-24">
      <div className="space-y-4">
        <div>
          <Link
            href="/"
            className="text-xs text-[var(--relay-ink-muted)] transition-relay hover:text-[var(--relay-ink)]"
          >
            Back to dashboard
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-[var(--relay-ink)]">
                {props.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--relay-ink-muted)]">
                <StatusPill stage={props.stage} />
                <span>{props.ownerName}</span>
                {props.jiraKey ? (
                  <span className="font-mono text-[var(--relay-ink-muted)]">{props.jiraKey}</span>
                ) : null}
                {props.planVersion ? (
                  <span className="text-[var(--relay-ink-subtle)]">Plan v{props.planVersion}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <StageStepper stage={props.stage} />
          </div>
        </div>

        <p className="rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 text-sm text-[var(--relay-ink-muted)]">
          {props.problemStatement}
        </p>

        {props.openQuestion ? (
          <div className="rounded border border-[color-mix(in_srgb,var(--relay-warning)_30%,white)] bg-[var(--relay-warning-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--relay-warning)]">
              Runner needs you
            </div>
            <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">{props.openQuestion}</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1.2fr)_260px]">
          <section aria-labelledby="activity-heading">
            <h2
              id="activity-heading"
              className="font-display mb-3 text-sm font-semibold text-[var(--relay-ink)]"
            >
              Activity
            </h2>
            <ActivityTimeline events={props.events} />
          </section>

          <section aria-labelledby="plan-heading">
            <h2
              id="plan-heading"
              className="font-display mb-3 text-sm font-semibold text-[var(--relay-ink)]"
            >
              Plan
            </h2>
            {props.planMarkdown ? (
              <div className="rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] p-4">
                <PlanDocument
                  markdown={props.planMarkdown}
                  steps={props.steps}
                  comments={props.comments}
                  highlightedCommentId={hoverCommentId}
                  onHoverAnchor={setHoverCommentId}
                />
              </div>
            ) : (
              <div className="rounded border border-dashed border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 text-sm text-[var(--relay-ink-muted)]">
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
              Comments
            </h2>
            {props.comments.length === 0 ? (
              <div className="rounded border border-dashed border-[var(--relay-border)] bg-[var(--relay-surface)] p-4 text-sm text-[var(--relay-ink-muted)]">
                <p className="font-medium text-[var(--relay-ink)]">No comments yet</p>
                <p className="mt-1">
                  Select text in the plan to leave an anchored note for teammates or the Planner.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {props.comments.map((comment) => {
                  const step = props.steps.find((s) => s.id === comment.stepId);
                  return (
                    <li
                      key={comment.id}
                      id={`comment-${comment.id}`}
                      className={cn(
                        "rounded border bg-[var(--relay-surface)] p-3 text-sm transition-relay scroll-mt-24",
                        hoverCommentId === comment.id
                          ? "border-[var(--relay-primary)]"
                          : "border-[var(--relay-border)]",
                      )}
                      onMouseEnter={() => setHoverCommentId(comment.id)}
                      onMouseLeave={() => setHoverCommentId(null)}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--relay-ink-subtle)]">
                        <span>{comment.authorName}</span>
                        <span>{comment.resolved ? "resolved" : "open"}</span>
                      </div>
                      {step ? (
                        <a
                          href={`#step-${step.id}`}
                          className="mt-1 inline-block text-[11px] text-[var(--relay-primary)] hover:underline"
                        >
                          Step {step.order}: {step.title}
                        </a>
                      ) : null}
                      {comment.anchorText ? (
                        <a
                          href={`#anchor-${comment.id}`}
                          className="mt-1 block text-xs italic text-[var(--relay-ink-muted)] hover:underline"
                          onMouseEnter={() => setHoverCommentId(comment.id)}
                        >
                          “{comment.anchorText}”
                        </a>
                      ) : null}
                      <p className="mt-1.5 text-[var(--relay-ink)]">{comment.body}</p>
                    </li>
                  );
                })}
                {[...commentsByStep.keys()].length === 0 ? null : null}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ActionBar state={props.actionState} role={props.role} />
    </div>
  );
}
