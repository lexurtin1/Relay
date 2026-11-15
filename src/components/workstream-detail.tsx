"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { WorkstreamStage } from "@relay/core";
import { addCommentAction, resolveCommentAction } from "@/app/actions/review";
import { StageStepper } from "@/components/stage-stepper";
import { PlanDocument, type PlanCommentView, type PlanStepView } from "@/components/plan-document";
import { ActionBar, type ActionBarState } from "@/components/action-bar";
import { AgentSessionPanel } from "@/components/agent-session";
import type { ActivityEventView } from "@/components/activity-timeline";
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

export type ApprovalView = {
  id: string;
  approverName: string;
  approverRole: string;
  createdAt: string;
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
  planId: string | null;
  planVersion: number | null;
  planTotalVersions: number;
  planMarkdown: string | null;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  approvals?: ApprovalView[];
  researchSummary: string | null;
  sources: ResearchSourceView[];
  history: HistoryItemView[];
  openQuestion: string | null;
  actionState: ActionBarState;
  agentEvents?: ActivityEventView[];
  canResearch?: boolean;
  canPlan?: boolean;
}) {
  const [hoverCommentId, setHoverCommentId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [anchorText, setAnchorText] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const canComment = props.role !== "viewer" && Boolean(props.planId);
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
        <h1 className="mt-1.5 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          {props.title}
        </h1>
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

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <AgentSessionPanel
            workstreamId={props.id}
            initialEvents={
              props.agentEvents ??
              props.history.map((item) => ({
                id: item.id,
                type: "status",
                summary: item.label,
                createdAt: item.at,
              }))
            }
            canResearch={props.canResearch ?? true}
            canPlan={props.canPlan ?? Boolean(props.researchSummary)}
            researchSummary={props.researchSummary}
          />
          <section className="rl-sheet p-5" aria-labelledby="sources-h">
            <h3
              id="sources-h"
              className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-subtle)]"
            >
              Sources read by Scout
            </h3>
            {props.sources.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--relay-ink-muted)]">
                No sources yet. Start research to populate this list.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
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
          </section>
        </div>

        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <section className="rl-sheet flex flex-col gap-5 p-7" aria-labelledby="plan-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="plan-heading" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
                Plan
              </h2>
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
                canComment={canComment}
                onAnchorComment={(text) => {
                  setAnchorText(text);
                  setReplyTo(null);
                  setFlash(`Commenting on “${text.slice(0, 48)}${text.length > 48 ? "…" : ""}”`);
                }}
              />
            ) : (
              <div className="text-sm text-[var(--relay-ink-muted)]">
                <p className="m-0 font-medium text-[var(--relay-ink)]">No plan yet</p>
                <p className="mt-1">
                  {props.researchSummary ?? props.problemStatement}
                </p>
              </div>
            )}
            {(props.approvals?.length ?? 0) > 0 ? (
              <div className="rounded-[14px] border border-[color-mix(in_srgb,var(--relay-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--relay-success)_8%,transparent)] px-3 py-2 text-sm text-[var(--relay-ink)]">
                Approved by{" "}
                {props.approvals!
                  .map((a) => `${a.approverName} (${a.approverRole})`)
                  .join(", ")}
              </div>
            ) : null}
          </section>

          <section className="rl-sheet p-6" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
              Comments {openComments > 0 ? `· ${openComments} open` : ""}
            </h2>
            {canComment ? (
              <form
                className="mt-4 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!props.planId || !draft.trim()) return;
                  const body = draft.trim();
                  const parentId = replyTo;
                  const anchor = anchorText;
                  startTransition(async () => {
                    await addCommentAction({
                      workstreamId: props.id,
                      planId: props.planId!,
                      body,
                      anchorText: parentId ? null : anchor,
                      parentId,
                    });
                    setDraft("");
                    setAnchorText(null);
                    setReplyTo(null);
                    setFlash(parentId ? "Reply added." : "Comment added.");
                  });
                }}
              >
                {flash ? (
                  <p className="m-0 text-[13px] text-[var(--relay-brand-fg)]">{flash}</p>
                ) : null}
                {replyTo ? (
                  <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">
                    Replying to a comment.{" "}
                    <button
                      type="button"
                      className="text-[var(--relay-brand-fg)] hover:underline"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel reply
                    </button>
                  </p>
                ) : null}
                {anchorText && !replyTo ? (
                  <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">
                    Anchor: “{anchorText}”.{" "}
                    <button
                      type="button"
                      className="text-[var(--relay-brand-fg)] hover:underline"
                      onClick={() => setAnchorText(null)}
                    >
                      Clear
                    </button>
                  </p>
                ) : null}
                <label className="sr-only" htmlFor="rl-comment-body">
                  Comment
                </label>
                <textarea
                  id="rl-comment-body"
                  className="rl-input w-full py-3"
                  rows={3}
                  value={draft}
                  disabled={pending}
                  placeholder={
                    replyTo
                      ? "Write a reply…"
                      : anchorText
                        ? "Write an anchored comment…"
                        : "Add a comment, or select plan text to anchor one…"
                  }
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="rl-btn-second self-start"
                  disabled={pending || !draft.trim()}
                >
                  {pending ? "Saving…" : replyTo ? "Post reply" : "Post comment"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-[var(--relay-ink-muted)]">
                Viewers can read comments but cannot add or resolve them.
              </p>
            )}
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
                    ) : canComment ? (
                      <div className="mt-2 flex gap-3 text-xs font-medium text-[var(--relay-brand-fg)]">
                        <button
                          type="button"
                          className="hover:underline"
                          disabled={pending}
                          onClick={() => {
                            setReplyTo(comment.id);
                            setAnchorText(null);
                            setFlash(`Replying to ${comment.authorName}`);
                          }}
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          className="hover:underline"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              await resolveCommentAction({
                                workstreamId: props.id,
                                commentId: comment.id,
                              });
                              setFlash("Comment resolved.");
                            });
                          }}
                        >
                          Resolve
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ActionBar
        workstreamId={props.id}
        planId={props.planId}
        state={props.actionState}
        role={props.role}
      />
    </div>
  );
}
