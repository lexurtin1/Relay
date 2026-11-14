"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export type PlanStepView = {
  id: string;
  order: number;
  title: string;
  description: string;
  filesLikelyTouched: string[];
  testsToAdd: string[];
  riskLevel: "low" | "medium" | "high";
  completed: boolean;
  needsConfirmation: boolean;
};

export type PlanCommentView = {
  id: string;
  stepId: string | null;
  anchorText: string | null;
  body: string;
  authorName: string;
  resolved: boolean;
};

const riskClass = {
  low: "border-[var(--relay-border)] text-[var(--relay-ink-muted)]",
  medium:
    "border-[color-mix(in_srgb,var(--relay-warning)_35%,white)] text-[var(--relay-warning)]",
  high: "border-[color-mix(in_srgb,var(--relay-danger)_35%,white)] text-[var(--relay-danger)]",
} as const;

export function PlanDocument(props: {
  markdown: string;
  steps: PlanStepView[];
  comments: PlanCommentView[];
  highlightedCommentId?: string | null;
  onHoverAnchor?: (commentId: string | null) => void;
}) {
  const anchors = props.comments
    .filter((c) => c.anchorText)
    .map((c) => ({ id: c.id, text: c.anchorText as string }));

  return (
    <div className="space-y-5">
      <article className="prose-relay text-sm leading-relaxed text-[var(--relay-ink)]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="font-display mb-3 text-xl font-semibold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="font-display mb-2 mt-4 text-base font-semibold">{children}</h2>
            ),
            p: ({ children }) => {
              const text = stringifyChildren(children);
              const hits = anchors.filter((a) => text.includes(a.text));
              if (hits.length === 0) {
                return <p className="mb-3 text-[var(--relay-ink-muted)]">{children}</p>;
              }
              return (
                <p className="mb-3 text-[var(--relay-ink-muted)]">
                  {renderWithHighlights(text, hits, props.highlightedCommentId, props.onHoverAnchor)}
                </p>
              );
            },
            li: ({ children }) => (
              <li className="mb-1 text-[var(--relay-ink-muted)]">{children}</li>
            ),
            code: ({ children }) => (
              <code className="rounded bg-[var(--relay-surface-sunken)] px-1 py-0.5 font-mono text-[12px] text-[var(--relay-ink)]">
                {children}
              </code>
            ),
          }}
        >
          {props.markdown}
        </ReactMarkdown>
      </article>

      <div className="space-y-2">
        <h2 className="font-display text-sm font-semibold text-[var(--relay-ink)]">
          Structured steps
        </h2>
        <ol className="space-y-2">
          {props.steps.map((step) => (
            <li
              id={`step-${step.id}`}
              key={step.id}
              className="rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] p-3 scroll-mt-24"
            >
              <div className="flex flex-wrap items-start gap-2">
                <span className="tabular inline-flex h-5 w-5 items-center justify-center rounded bg-[var(--relay-surface-sunken)] text-[11px] font-semibold text-[var(--relay-ink-muted)]">
                  {step.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--relay-ink)]">
                      {step.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                        riskClass[step.riskLevel],
                      )}
                    >
                      {step.riskLevel} risk
                    </span>
                    {step.completed ? (
                      <span className="text-[11px] text-[var(--relay-success)]">Done</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
                    {step.description}
                  </p>
                  {step.filesLikelyTouched.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {step.filesLikelyTouched.map((file) => (
                        <code
                          key={file}
                          className="rounded border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--relay-ink-muted)]"
                        >
                          {file}
                        </code>
                      ))}
                    </div>
                  ) : null}
                  {step.testsToAdd.length > 0 ? (
                    <p className="mt-2 text-xs text-[var(--relay-ink-subtle)]">
                      Tests:{" "}
                      <span className="font-mono text-[var(--relay-ink-muted)]">
                        {step.testsToAdd.join(", ")}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
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

function renderWithHighlights(
  text: string,
  anchors: Array<{ id: string; text: string }>,
  highlightedCommentId: string | null | undefined,
  onHoverAnchor?: (commentId: string | null) => void,
) {
  const sorted = [...anchors].sort((a, b) => b.text.length - a.text.length);
  const first = sorted[0];
  if (!first) return text;
  const idx = text.indexOf(first.text);
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const after = text.slice(idx + first.text.length);
  const active = highlightedCommentId === first.id;
  return (
    <>
      {before}
      <mark
        id={`anchor-${first.id}`}
        className={cn(
          "rounded px-0.5 transition-relay",
          active
            ? "bg-[color-mix(in_srgb,var(--relay-primary)_28%,white)]"
            : "bg-[color-mix(in_srgb,var(--relay-warning)_22%,white)]",
        )}
        onMouseEnter={() => onHoverAnchor?.(first.id)}
        onMouseLeave={() => onHoverAnchor?.(null)}
      >
        <a href={`#comment-${first.id}`} className="no-underline">
          {first.text}
        </a>
      </mark>
      {after}
    </>
  );
}
