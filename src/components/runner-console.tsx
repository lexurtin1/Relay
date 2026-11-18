"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, CircleDashed, GitPullRequest, Loader2, MessageCircleQuestion } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/astryx";
import type { ActionGate, PlanStepView, RunnerView } from "@/lib/view-models";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RunnerView["status"], string> = {
  provisioning: "Creating workspace",
  running: "Building",
  awaiting_input: "Paused for you",
  pr_open: "Pull request open",
  merged: "Merged",
};

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RunnerConsole(props: {
  runner: RunnerView | null;
  steps: PlanStepView[];
  color: string;
  answerGate: ActionGate;
  mergeGate: ActionGate;
  handOffGate: ActionGate;
  onAnswer: (answer: string) => void;
  onMerge: () => void;
  onHandOff: () => void;
}) {
  const logRef = useRef<HTMLOListElement>(null);
  const [free, setFree] = useState("");
  const r = props.runner;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [r?.log.length]);

  if (!r) {
    return (
      <div className="rl-sheet p-6">
        <EmptyState
          title="Not handed off yet"
          description="Once an architect approves the plan, the owner hands it to the Runner. It builds in an isolated workspace with no production data and pauses here if it needs a decision."
          actions={
            <button type="button" className="rl-btn-primary rl-btn-compact" onClick={props.onHandOff} disabled={!props.handOffGate.ok} title={props.handOffGate.reason}>
              Hand off to Runner
            </button>
          }
        />
      </div>
    );
  }

  const pct = r.stepsTotal ? Math.round((r.stepsCompleted / r.stepsTotal) * 100) : 0;
  const working = r.status === "running" || r.status === "provisioning";
  const question = r.question && !r.question.answer ? r.question : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (free.trim()) {
      props.onAnswer(free.trim());
      setFree("");
    }
  };

  return (
    <div className="flex flex-col gap-4" data-tour="runner">
      <section className="rl-sheet rl-sheet-elevated flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="rl-eyebrow">Runner</p>
            <h2 className="m-0 mt-1 text-[18px] font-medium text-[var(--relay-ink)]">{STATUS_LABEL[r.status]}</h2>
            <p className="m-0 mt-1 text-[12.5px] text-[var(--relay-ink-muted)]">
              <span className="font-mono">{r.branch}</span> · {r.model} · {r.profile} profile
            </p>
          </div>
          <div className="flex items-center gap-2">
            {working ? <Loader2 className="h-4 w-4 animate-spin text-[var(--relay-brand-fg)] motion-reduce:animate-none" aria-hidden /> : null}
            <Badge
              variant={r.status === "awaiting_input" ? "warning" : r.status === "merged" ? "success" : "info"}
              label={`${r.stepsCompleted} of ${r.stepsTotal} steps`}
            />
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--relay-surface-sunken)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Plan steps completed">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: props.color }} />
        </div>

        <ol className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
          {props.steps.map((step, i) => {
            const current = !step.completed && i === r.stepsCompleted && working;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-[13px]",
                  step.completed
                    ? "border-[color-mix(in_srgb,var(--relay-success)_30%,transparent)] bg-[var(--relay-success-soft)]"
                    : current
                      ? "border-[color-mix(in_srgb,var(--relay-brand)_35%,transparent)] bg-[var(--relay-brand-soft)]"
                      : "border-[var(--relay-border)]",
                )}
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {step.completed ? (
                    <Check className="h-4 w-4 text-[var(--relay-success)]" />
                  ) : current ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--relay-brand-fg)] motion-reduce:animate-none" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-[var(--relay-ink-subtle)]" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-[var(--relay-ink)]">
                    {step.order}. {step.title}
                  </span>
                  <span className="sr-only">{step.completed ? "done" : current ? "in progress" : "not started"}</span>
                  {step.filesLikelyTouched[0] ? (
                    <span className="block truncate font-mono text-[11.5px] text-[var(--relay-ink-muted)]">{step.filesLikelyTouched[0]}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {question ? (
        <section
          className="rl-sheet flex flex-col gap-3 border-[color-mix(in_srgb,var(--relay-warning)_40%,transparent)] p-5"
          aria-labelledby="runner-q"
          data-tour="question"
        >
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-[var(--relay-warning)]" aria-hidden />
            <h3 id="runner-q" className="m-0 text-[16px] font-medium text-[var(--relay-ink)]">
              The Runner is waiting on you
            </h3>
          </div>
          <p className="m-0 text-[15px] text-[var(--relay-ink)]">{question.text}</p>
          <div className="flex flex-wrap gap-2">
            {question.options.map((o) => (
              <button key={o} type="button" className="rl-btn-second rl-btn-compact" onClick={() => props.onAnswer(o)} disabled={!props.answerGate.ok} title={props.answerGate.reason}>
                {o}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-wrap gap-2">
            <label htmlFor="runner-free" className="sr-only">
              Or write your own answer
            </label>
            <input
              id="runner-free"
              className="rl-input rl-input-compact min-w-0 flex-[1_1_220px]"
              placeholder="Or write your own answer"
              value={free}
              onChange={(e) => setFree(e.target.value)}
              disabled={!props.answerGate.ok}
            />
            <button type="submit" className="rl-btn-primary rl-btn-compact" disabled={!props.answerGate.ok || !free.trim()}>
              Send answer
            </button>
          </form>
          {!props.answerGate.ok && props.answerGate.reason ? (
            <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">{props.answerGate.reason}</p>
          ) : null}
        </section>
      ) : null}

      {r.pr ? (
        <section className="rl-sheet flex flex-wrap items-center justify-between gap-3 p-5" aria-label="Pull request" data-tour="pr">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-6 w-6" style={{ color: props.color }} aria-hidden />
            <div>
              <p className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">Pull request #{r.pr.number}</p>
              <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
                {r.status === "merged"
                  ? "Merged into main"
                  : r.pr.checks === "passed"
                    ? "Lint, unit and contract tests passed"
                    : "Checks running: lint, unit and contract tests"}
              </p>
            </div>
          </div>
          {r.status === "merged" ? (
            <Badge variant="success" label="Merged" />
          ) : (
            <button type="button" className="rl-btn-primary rl-btn-compact" onClick={props.onMerge} disabled={!props.mergeGate.ok} title={props.mergeGate.reason}>
              {r.pr.checks === "passed" ? "Merge pull request" : "Waiting for checks"}
            </button>
          )}
        </section>
      ) : null}

      <section aria-label="Runner log" className="rl-console overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11.5px] text-[#8e9aaf]">
          <span>Runner log</span>
          <span>{r.log.length} lines</span>
        </div>
        <ol ref={logRef} className="m-0 max-h-[300px] list-none overflow-y-auto px-4 py-3" aria-live="polite">
          {r.log.map((line, i) => (
            <li key={`${line.at}-${i}`} className="flex gap-3">
              <span className="shrink-0 text-[#667085]">{time(line.at)}</span>
              <span
                className={cn(
                  line.kind === "tool" && "text-[#8dbbfa]",
                  line.kind === "test" && "text-[#86d9ae]",
                  line.kind === "question" && "text-[#f5b24a]",
                  line.kind === "answer" && "text-[#f2f5fa]",
                  line.kind === "pr" && "text-[#80cbc4]",
                  i === r.log.length - 1 && working && "rl-caret",
                )}
              >
                {line.kind === "tool" ? "$ " : ""}
                {line.text}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
