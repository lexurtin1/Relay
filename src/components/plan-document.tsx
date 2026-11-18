"use client";

import { useRef, useState, type MouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentView, PlanStepView } from "@/lib/view-models";

export type { PlanStepView } from "@/lib/view-models";
/** Kept for older imports; comments now carry replies and timestamps. */
export type PlanCommentView = Pick<CommentView, "id" | "stepId" | "anchorText" | "body" | "authorName" | "resolved">;

const riskClass = {
  low: "border-[var(--relay-border)] text-[var(--relay-ink-muted)]",
  medium: "border-[color-mix(in_srgb,var(--relay-warning)_35%,transparent)] text-[var(--relay-warning)]",
  high: "border-[color-mix(in_srgb,var(--relay-danger)_35%,transparent)] text-[var(--relay-danger)]",
} as const;

export function PlanDocument(props: {
  markdown: string;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  highlightedCommentId?: string | null;
  onHoverAnchor?: (commentId: string | null) => void;
  /** When set, selecting text or using a step's Comment button starts a comment. */
  onCommentTarget?: (target: { anchorText: string | null; stepId: string | null }) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);

  const anchors = props.comments
    .filter((c) => c.anchorText && !c.resolved)
    .map((c) => ({ id: c.id, text: c.anchorText as string }));

  const onMouseUp = (_e: MouseEvent) => {
    if (!props.onCommentTarget) return;
    const sel = window.getSelection();
    const text = sel?.toString().trim().replace(/\s+/g, " ") ?? "";
    const wrap = wrapRef.current;
    if (!sel || !wrap || text.length < 3 || text.length > 140 || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!wrap.contains(range.commonAncestorContainer)) return;
    const rect = range.getBoundingClientRect();
    const box = wrap.getBoundingClientRect();
    setSelection({ text, top: rect.top - box.top - 40, left: Math.min(Math.max(rect.left - box.left, 0), box.width - 190) });
  };

  return (
    <div className="space-y-5">
      <div ref={wrapRef} className="relative" onMouseUp={onMouseUp}>
        {selection ? (
          <button
            type="button"
            className="rl-btn-primary rl-btn-tiny absolute z-10 inline-flex items-center gap-1.5 shadow-lg animate-relay-in"
            style={{ top: Math.max(selection.top, -8), left: selection.left }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              props.onCommentTarget?.({ anchorText: selection.text, stepId: null });
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
            Comment on selection
          </button>
        ) : null}
        <article className="prose-relay text-sm leading-relaxed text-[var(--relay-ink)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="mb-3 text-xl font-medium tracking-tight">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-medium tracking-tight">{children}</h2>,
              p: ({ children }) => (
                <p className="mb-3 text-[var(--relay-ink-body)]">
                  {highlight(stringifyChildren(children), anchors, props.highlightedCommentId, props.onHoverAnchor) ?? children}
                </p>
              ),
              li: ({ children }) => (
                <li className="mb-1 ml-5 list-disc text-[var(--relay-ink-body)]">
                  {highlight(stringifyChildren(children), anchors, props.highlightedCommentId, props.onHoverAnchor) ?? children}
                </li>
              ),
              ol: ({ children }) => <ol className="mb-3 ml-1 list-decimal [&>li]:list-decimal">{children}</ol>,
              code: ({ children }) => (
                <code className="rounded-md bg-[var(--relay-surface-sunken)] px-1 py-0.5 font-mono text-[12px] text-[var(--relay-ink)]">{children}</code>
              ),
            }}
          >
            {props.markdown}
          </ReactMarkdown>
        </article>
      </div>

      <div className="space-y-2">
        <h3 className="m-0 text-sm font-semibold text-[var(--relay-ink)]">Structured steps</h3>
        <ol className="m-0 list-none space-y-2 p-0">
          {props.steps.map((step) => {
            const count = props.comments.filter((c) => c.stepId === step.id && !c.resolved).length;
            return (
              <li
                id={`step-${step.id}`}
                key={step.id}
                className="scroll-mt-24 rounded-2xl border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-3"
              >
                <div className="flex flex-wrap items-start gap-2">
                  <span
                    className={cn(
                      "tabular inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      step.completed ? "bg-[var(--relay-success)] text-white" : "bg-[var(--relay-surface-sunken)] text-[var(--relay-ink-muted)]",
                    )}
                    aria-hidden
                  >
                    {step.completed ? <Check className="h-3.5 w-3.5" /> : step.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="m-0 text-sm font-semibold text-[var(--relay-ink)]">{step.title}</h4>
                      <span className={cn("rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide", riskClass[step.riskLevel])}>
                        {step.riskLevel} risk
                      </span>
                      {step.needsConfirmation ? (
                        <span className="rounded-md border border-[var(--relay-border)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[var(--relay-ink-muted)]">
                          Runner asks first
                        </span>
                      ) : null}
                      {step.completed ? <span className="text-[11px] text-[var(--relay-success)]">Done</span> : null}
                      {count > 0 ? (
                        <span className="text-[11px] text-[var(--relay-warning)]">
                          {count} comment{count === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--relay-ink-body)]">{step.description}</p>
                    {step.filesLikelyTouched.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {step.filesLikelyTouched.map((file) => (
                          <code
                            key={file}
                            className="rounded-md border border-[var(--relay-border)] bg-[var(--relay-surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--relay-ink-muted)]"
                          >
                            {file}
                          </code>
                        ))}
                      </div>
                    ) : null}
                    {step.testsToAdd.length > 0 ? (
                      <p className="mt-2 text-xs text-[var(--relay-ink-subtle)]">
                        Tests: <span className="font-mono text-[var(--relay-ink-muted)]">{step.testsToAdd.join(", ")}</span>
                      </p>
                    ) : null}
                  </div>
                  {props.onCommentTarget ? (
                    <button
                      type="button"
                      className="rl-btn-second rl-btn-tiny inline-flex shrink-0 items-center gap-1"
                      onClick={() => props.onCommentTarget?.({ anchorText: step.title, stepId: step.id })}
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
                      Comment
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function stringifyChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(stringifyChildren).join("");
  return "";
}

/** Wrap the first matching comment anchor in a highlight. Returns null when nothing matches. */
function highlight(
  text: string,
  anchors: Array<{ id: string; text: string }>,
  highlightedCommentId: string | null | undefined,
  onHoverAnchor?: (commentId: string | null) => void,
) {
  if (!text) return null;
  const hit = [...anchors]
    .sort((a, b) => b.text.length - a.text.length)
    .find((a) => text.toLowerCase().includes(a.text.toLowerCase()));
  if (!hit) return null;
  const idx = text.toLowerCase().indexOf(hit.text.toLowerCase());
  const active = highlightedCommentId === hit.id;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        id={`anchor-${hit.id}`}
        className={cn(
          "rounded px-0.5 text-[var(--relay-ink)] transition-relay",
          active
            ? "bg-[color-mix(in_srgb,var(--relay-brand)_28%,transparent)]"
            : "bg-[color-mix(in_srgb,var(--relay-warning)_22%,transparent)]",
        )}
        onMouseEnter={() => onHoverAnchor?.(hit.id)}
        onMouseLeave={() => onHoverAnchor?.(null)}
      >
        <a href={`#comment-${hit.id}`} className="text-inherit no-underline">
          {text.slice(idx, idx + hit.text.length)}
        </a>
      </mark>
      {text.slice(idx + hit.text.length)}
    </>
  );
}
