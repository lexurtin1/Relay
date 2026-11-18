"use client";

import { useState } from "react";
import { continueResearch } from "@/app/actions/ideas";
import { cn } from "@/lib/utils";

export type ResearchStepView = {
  id: string;
  title: string;
  rationale?: string;
  disclosureLabel?: string;
  disclosureDetail?: string;
};

export function ResearchActivity(props: {
  workstreamId: string;
  userAsk: string;
  steps: ResearchStepView[];
  liveToolsLine?: string | null;
  color?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(props.steps[0]?.id ?? null);

  return (
    <section
      className="rl-sheet flex flex-col gap-4 p-5"
      aria-labelledby="rl-research-h"
      style={
        props.color
          ? {
              borderTop: `3px solid ${props.color}`,
            }
          : undefined
      }
    >
      <div>
        <h2 id="rl-research-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
          Research activity
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--relay-ink-muted)]">
          Scout uses the same company sources as the chatbot.
        </p>
      </div>

      <div className="rounded-[16px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] px-4 py-3">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">
          You asked
        </p>
        <p className="m-0 mt-1.5 text-[14.5px] text-[var(--relay-ink)]">{props.userAsk}</p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {props.steps.length === 0 ? (
          <li className="text-sm text-[var(--relay-ink-muted)]">
            No research steps yet. Ask a follow-up below to start Scout.
          </li>
        ) : (
          props.steps.map((step, index) => {
            const open = openId === step.id;
            return (
              <li
                key={step.id}
                className="rounded-[14px] border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-ink)_3%,transparent)] px-3.5 py-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ background: props.color ?? "var(--relay-brand-fg)" }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[14.5px] font-medium text-[var(--relay-ink)]">
                      {step.title}
                    </p>
                    {step.rationale ? (
                      <p className="m-0 mt-1 text-[13px] text-[var(--relay-ink-body)]">
                        {step.rationale}
                      </p>
                    ) : null}
                    {step.disclosureLabel ? (
                      <button
                        type="button"
                        className="mt-2 text-[12.5px] font-medium text-[var(--relay-brand-fg)] hover:underline"
                        onClick={() => setOpenId(open ? null : step.id)}
                        aria-expanded={open}
                      >
                        {step.disclosureLabel}
                        {open ? " <" : " >"}
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
          })
        )}
      </ol>

      {props.liveToolsLine ? (
        <p
          className={cn(
            "m-0 truncate font-mono text-[12px] text-[var(--relay-ink-subtle)]",
          )}
          title={props.liveToolsLine}
        >
          Tools: {props.liveToolsLine}
        </p>
      ) : null}

      <form action={continueResearch} className="mt-1 flex flex-wrap gap-2">
        <input type="hidden" name="workstreamId" value={props.workstreamId} />
        <label className="sr-only" htmlFor="research-ask">
          Ask anything
        </label>
        <input
          id="research-ask"
          name="question"
          className="rl-input rl-input-compact min-w-0 flex-[1_1_200px]"
          placeholder="Ask anything…"
          autoComplete="off"
        />
        <button type="submit" className="rl-btn-second rl-btn-compact">
          Send
        </button>
      </form>
    </section>
  );
}
