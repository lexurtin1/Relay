"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, CornerDownRight, MessageSquarePlus } from "lucide-react";
import { Avatar } from "@/components/ui/astryx";
import type { ActionGate, CommentView } from "@/lib/view-models";
import { cn, formatRelativeTime } from "@/lib/utils";

export type CommentDraftTarget = { anchorText: string | null; stepId: string | null } | null;

/**
 * Review thread for a plan version. New comments can anchor to selected text
 * or to a step; replies thread under a comment; resolve closes the thread.
 */
export function CommentsRail(props: {
  comments: CommentView[];
  commentGate: ActionGate;
  resolveGate: ActionGate;
  target: CommentDraftTarget;
  onClearTarget: () => void;
  onAdd: (input: { body: string; anchorText: string | null; stepId: string | null; parentId: string | null }) => boolean;
  onResolve: (commentId: string) => void;
  highlightedId: string | null;
  onHover: (id: string | null) => void;
}) {
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (props.target) inputRef.current?.focus();
  }, [props.target]);

  const open = props.comments.filter((c) => !c.resolved);
  const resolved = props.comments.filter((c) => c.resolved);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = props.onAdd({
      body,
      anchorText: props.target?.anchorText ?? null,
      stepId: props.target?.stepId ?? null,
      parentId: null,
    });
    if (ok) {
      setBody("");
      props.onClearTarget();
    }
  };

  const submitReply = (e: FormEvent, parentId: string) => {
    e.preventDefault();
    if (props.onAdd({ body: reply, anchorText: null, stepId: null, parentId })) {
      setReply("");
      setReplyTo(null);
    }
  };

  return (
    <section className="rl-sheet flex flex-col gap-3 p-4" aria-labelledby="comments-h">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="comments-h" className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">
          Review comments
        </h2>
        <span className="text-[12px] tabular text-[var(--relay-ink-muted)]">{open.length} open</span>
      </div>

      {props.commentGate.ok ? (
        <form onSubmit={submit} className="flex flex-col gap-2 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-2.5">
          {props.target?.anchorText ? (
            <div className="flex items-start justify-between gap-2 text-[12px] text-[var(--relay-ink-muted)]">
              <span className="min-w-0">
                On <mark className="rounded bg-[color-mix(in_srgb,var(--relay-warning)_22%,transparent)] px-1 text-[var(--relay-ink)]">{props.target.anchorText}</mark>
              </span>
              <button type="button" className="shrink-0 underline-offset-2 hover:underline" onClick={props.onClearTarget}>
                Clear
              </button>
            </div>
          ) : (
            <p className="m-0 flex items-center gap-1.5 text-[12px] text-[var(--relay-ink-muted)]">
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
              Select text in the plan, or use Comment on a step, to anchor a note.
            </p>
          )}
          <label htmlFor="new-comment" className="sr-only">
            New comment
          </label>
          <textarea
            id="new-comment"
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rl-input min-h-[64px] py-2 text-[13px]"
            placeholder="What should change before this is approved?"
          />
          <div className="flex justify-end">
            <button type="submit" className="rl-btn-primary rl-btn-tiny" disabled={!body.trim()}>
              Comment
            </button>
          </div>
        </form>
      ) : props.commentGate.reason ? (
        <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">{props.commentGate.reason}</p>
      ) : null}

      {open.length === 0 && resolved.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">No comments on this version yet.</p>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {open.map((c) => (
          <li
            key={c.id}
            id={`comment-${c.id}`}
            onMouseEnter={() => props.onHover(c.id)}
            onMouseLeave={() => props.onHover(null)}
            className={cn(
              "scroll-mt-24 rounded-[14px] border p-3 text-[13px] transition-relay",
              "border-[color-mix(in_srgb,var(--relay-warning)_30%,transparent)] bg-[var(--relay-warning-soft)]",
              props.highlightedId === c.id && "border-[var(--relay-brand-fg)]",
            )}
          >
            <CommentBody c={c} />
            {c.replies.map((r) => (
              <div key={r.id} className="mt-2 flex gap-2 border-l-2 border-[var(--relay-border-strong)] pl-2.5">
                <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--relay-ink-subtle)]" aria-hidden />
                <CommentBody c={r} />
              </div>
            ))}
            {replyTo === c.id ? (
              <form onSubmit={(e) => submitReply(e, c.id)} className="mt-2 flex gap-2">
                <label htmlFor={`reply-${c.id}`} className="sr-only">
                  Reply
                </label>
                <input
                  id={`reply-${c.id}`}
                  autoFocus
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="rl-input rl-input-compact min-w-0 flex-1 text-[13px]"
                  placeholder="Reply"
                />
                <button type="submit" className="rl-btn-second rl-btn-tiny" disabled={!reply.trim()}>
                  Send
                </button>
              </form>
            ) : null}
            <div className="mt-2 flex gap-3 text-[12px] font-medium">
              {props.commentGate.ok ? (
                <button type="button" className="text-[var(--relay-brand-fg)] hover:underline" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
                  {replyTo === c.id ? "Cancel" : "Reply"}
                </button>
              ) : null}
              <button
                type="button"
                className="text-[var(--relay-brand-fg)] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                onClick={() => props.onResolve(c.id)}
                disabled={!props.resolveGate.ok}
                title={props.resolveGate.reason}
              >
                Resolve
              </button>
            </div>
          </li>
        ))}
      </ul>

      {resolved.length > 0 ? (
        <div>
          <button type="button" className="text-[12.5px] text-[var(--relay-ink-muted)] hover:underline" onClick={() => setShowResolved((v) => !v)} aria-expanded={showResolved}>
            {showResolved ? "Hide" : "Show"} {resolved.length} resolved
          </button>
          {showResolved ? (
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {resolved.map((c) => (
                <li key={c.id} className="rounded-[14px] border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-success)_6%,transparent)] p-3 text-[13px]">
                  <CommentBody c={c} />
                  <p className="m-0 mt-1.5 flex items-center gap-1 text-[12px] text-[var(--relay-success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {c.resolution ?? "Resolved"}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function CommentBody(props: { c: CommentView }) {
  const { c } = props;
  return (
    <div className="flex min-w-0 gap-2">
      <Avatar name={c.authorName} size="sm" tooltip={false} />
      <div className="min-w-0">
        <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">
          <span className="font-medium text-[var(--relay-ink)]">{c.authorName}</span>
          <span suppressHydrationWarning> · {formatRelativeTime(c.createdAt)}</span>
          {c.anchorText ? (
            <>
              {" · on "}
              <a href={`#anchor-${c.id}`} className="text-[var(--relay-warning)] hover:underline">
                {c.anchorText}
              </a>
            </>
          ) : null}
        </p>
        <p className="m-0 mt-0.5 text-[var(--relay-ink)]">{c.body}</p>
      </div>
    </div>
  );
}
