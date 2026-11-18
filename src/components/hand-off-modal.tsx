"use client";

import { useState } from "react";
import { handOffToRunner } from "@/app/actions/ideas";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
];

const PROFILES = [
  { id: "default", label: "default" },
  { id: "careful", label: "careful" },
  { id: "fast", label: "fast" },
];

export function HandOffModal(props: {
  workstreamId: string;
  planId: string | null;
  canHandOff: boolean;
  handOffReason?: string;
  color?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!props.canHandOff) {
    return (
      <button
        type="button"
        disabled
        title={props.handOffReason}
        className="rl-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Hand off to Runner
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="rl-btn-primary"
        onClick={() => setOpen(true)}
        style={
          props.color
            ? { boxShadow: `0 8px 20px -12px ${props.color}` }
            : undefined
        }
      >
        Hand off to Runner
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--relay-ink)_35%,transparent)] p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="handoff-title"
            className="rl-sheet rl-sheet-elevated w-full max-w-[520px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="handoff-title"
                  className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[var(--relay-ink)]"
                >
                  Hand off to Runner
                </h2>
                <p className="mt-1.5 text-[13.5px] text-[var(--relay-ink-muted)]">
                  A new workspace for your Runner will be created.
                </p>
              </div>
              <button
                type="button"
                className="rl-btn-second rl-btn-tiny"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <form
              action={async (fd) => {
                await handOffToRunner(fd);
                setOpen(false);
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <input type="hidden" name="workstreamId" value={props.workstreamId} />
              <input type="hidden" name="planId" value={props.planId ?? ""} />
              <label className="sr-only" htmlFor="handoff-context">
                Additional context
              </label>
              <textarea
                id="handoff-context"
                name="additionalContext"
                className="rl-input min-h-[120px] py-3"
                placeholder="Add additional context (optional)"
              />
              <div className="flex flex-wrap gap-2">
                <select
                  name="modelId"
                  className="rl-input rl-input-compact max-w-[200px] text-[13px]"
                  defaultValue={MODELS[0]!.id}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  name="profile"
                  className="rl-input rl-input-compact max-w-[160px] text-[13px]"
                  defaultValue={PROFILES[0]!.id}
                >
                  {PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className="rl-btn-second"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cn("rl-btn-primary")}
                  style={
                    props.color
                      ? { background: props.color, borderColor: props.color }
                      : undefined
                  }
                >
                  Hand off
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
