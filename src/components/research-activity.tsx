"use client";

import { useState, type FormEvent } from "react";
import { BookOpen, Database, GitBranch, Loader2, Ticket, Activity, type LucideIcon } from "lucide-react";
import { continueResearch } from "@/app/actions/ideas";
import { useRelayActions } from "@/lib/demo-store/provider";
import type { ActionGate, ResearchStepView, SourceView } from "@/lib/view-models";
import { cn } from "@/lib/utils";

export type { ResearchStepView } from "@/lib/view-models";

const CONNECTOR_ICON: Record<string, LucideIcon> = {
  jira: Ticket,
  confluence: BookOpen,
  datadog: Activity,
  github: GitBranch,
};

export function ResearchActivity(props: {
  workstreamId: string;
  userAsk: string;
  steps: ResearchStepView[];
  liveToolsLine?: string | null;
  color?: string;
  status?: "idle" | "running" | "succeeded";
  findings?: string | null;
  sources?: SourceView[];
  askGate?: ActionGate;
  startGate?: ActionGate;
}) {
  const actions = useRelayActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const running = props.status === "running";

  const ask = (e: FormEvent) => {
    e.preventDefault();
    if (actions.askFollowup(props.workstreamId, question)) setQuestion("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <section className="rl-sheet flex flex-col gap-4 p-5" aria-labelledby="rl-research-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="rl-eyebrow">Scout</p>
            <h2 id="rl-research-h" className="m-0 mt-1 text-[18px] font-medium text-[var(--relay-ink)]">
              Research activity
            </h2>
            <p className="m-0 mt-1 text-[13px] text-[var(--relay-ink-muted)]">
              Read only, using the same company sources as the chatbot.
            </p>
          </div>
          {running ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--relay-brand-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--relay-brand-fg)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              Researching
            </span>
          ) : props.status === "succeeded" ? (
            <span className="rounded-full bg-[var(--relay-success-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--relay-success)]">
              Findings ready
            </span>
          ) : null}
        </div>

        <div className="rounded-[16px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] px-4 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">You asked</p>
          <p className="m-0 mt-1.5 text-[14.5px] text-[var(--relay-ink)]">{props.userAsk}</p>
        </div>

        <ol className="m-0 flex list-none flex-col gap-2.5 p-0" aria-live="polite">
          {props.steps.length === 0 && !running ? (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed border-[var(--relay-border-strong)] px-4 py-4 text-sm text-[var(--relay-ink-muted)]">
              Scout has not started yet.
              {props.startGate ? (
                <button
                  type="button"
                  className="rl-btn-primary rl-btn-compact"
                  onClick={() => actions.startResearch(props.workstreamId)}
                  disabled={!props.startGate.ok}
                  title={props.startGate.reason}
                >
                  Start research
                </button>
              ) : null}
            </li>
          ) : null}
          {props.steps.map((step, index) => {
            const open = openId === step.id;
            return (
              <li key={step.id} className="animate-relay-in rounded-[14px] border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-ink)_3%,transparent)] px-3.5 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ background: props.color ?? "var(--relay-brand)" }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[14.5px] font-medium text-[var(--relay-ink)]">{step.title}</p>
                    {step.rationale ? <p className="m-0 mt-1 text-[13px] text-[var(--relay-ink-body)]">{step.rationale}</p> : null}
                    {step.disclosureLabel ? (
                      <button
                        type="button"
                        className="mt-2 text-[12.5px] font-medium text-[var(--relay-brand-fg)] hover:underline"
                        onClick={() => setOpenId(open ? null : step.id)}
                        aria-expanded={open}
                      >
                        {step.disclosureLabel} {open ? "▴" : "▾"}
                      </button>
                    ) : null}
                    {open && step.disclosureDetail ? (
                      <p className="m-0 mt-2 rounded-[10px] bg-[var(--relay-surface-muted)] px-3 py-2 font-mono text-[12px] text-[var(--relay-ink-muted)]">
                        {step.disclosureDetail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
          {running ? (
            <li className="flex items-center gap-3 rounded-[14px] border border-dashed border-[color-mix(in_srgb,var(--relay-brand)_35%,transparent)] px-3.5 py-3 text-[13px] text-[var(--relay-brand-fg)]">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
              {props.liveToolsLine ? <span className="font-mono">{props.liveToolsLine}</span> : "Choosing the next source"}
            </li>
          ) : null}
        </ol>

        {actions.mode === "demo" ? (
          <form onSubmit={ask} className="mt-1 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="research-ask">
              Ask Scout a follow-up
            </label>
            <input
              id="research-ask"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="rl-input rl-input-compact min-w-0 flex-[1_1_200px]"
              placeholder={props.askGate?.ok === false ? props.askGate.reason : "Ask Scout a follow-up"}
              autoComplete="off"
              disabled={props.askGate?.ok === false}
            />
            <button type="submit" className="rl-btn-second rl-btn-compact" disabled={props.askGate?.ok === false || !question.trim()}>
              Ask
            </button>
          </form>
        ) : (
          <form action={continueResearch} className="mt-1 flex flex-wrap gap-2">
            <input type="hidden" name="workstreamId" value={props.workstreamId} />
            <label className="sr-only" htmlFor="research-ask">
              Ask anything
            </label>
            <input id="research-ask" name="question" className="rl-input rl-input-compact min-w-0 flex-[1_1_200px]" placeholder="Ask anything" autoComplete="off" />
            <button type="submit" className="rl-btn-second rl-btn-compact">
              Send
            </button>
          </form>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rl-sheet p-5" aria-labelledby="findings-h">
          <h3 id="findings-h" className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">
            Findings
          </h3>
          {props.findings ? (
            <p className="m-0 mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--relay-ink-body)]">{props.findings}</p>
          ) : (
            <p className="m-0 mt-2 text-[13px] text-[var(--relay-ink-muted)]">
              {running ? "Scout writes a summary once every source is read." : "No findings yet."}
            </p>
          )}
        </section>
        <section className="rl-sheet p-5" aria-labelledby="sources-h">
          <h3 id="sources-h" className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">
            Sources read <span className="tabular text-[var(--relay-ink-muted)]">{props.sources?.length ?? 0}</span>
          </h3>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {(props.sources ?? []).map((source) => {
              const Icon = CONNECTOR_ICON[source.connector] ?? Database;
              return (
                <li key={`${source.connector}-${source.title}`} className={cn("flex items-start gap-2.5 rounded-[12px] border border-[var(--relay-border)] px-3 py-2 text-[13px] animate-relay-in")}>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--relay-brand-fg)]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--relay-ink)]">{source.title}</span>
                    <span className="text-[11.5px] capitalize text-[var(--relay-ink-subtle)]">{source.connector}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </div>
  );
}
