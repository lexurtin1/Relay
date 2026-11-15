"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approvePlan,
  handOff,
  requestReview,
  revisePlan,
  type ActionResult,
} from "@/app/actions/workstream";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ActionBarState = {
  canGeneratePlan: boolean;
  canRequestReview: boolean;
  canApprove: boolean;
  canHandOff: boolean;
  canRevise: boolean;
  openCommentCount: number;
  generateReason?: string;
  reviewReason?: string;
  approveReason?: string;
  handOffReason?: string;
  reviseReason?: string;
};

type PrimaryId = "revise" | "requestReview" | "approve" | "handOff";

/** Next-step panel (replaces the old sticky glass action bar). */
export function ActionBar(props: {
  workstreamId: string;
  state: ActionBarState;
  role: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const primary: PrimaryId | null = props.state.canRevise
    ? "revise"
    : props.state.canApprove
      ? "approve"
      : props.state.canHandOff
        ? "handOff"
        : props.state.canRequestReview
          ? "requestReview"
          : null;

  const message = props.state.canRevise
    ? `${props.state.openCommentCount} comment${props.state.openCommentCount === 1 ? "" : "s"} must be resolved before an architect can approve.`
    : props.state.canApprove
      ? "All comments resolved. An architect or lead can approve this plan."
      : props.state.canHandOff
        ? "Plan approved. Hand it off to start the build."
        : props.state.canRequestReview
          ? "Draft plan ready. Request review when you want architects looking."
          : "No action required from you on this plan right now.";

  const actions: Array<{
    id: PrimaryId;
    label: string;
    enabled: boolean;
    reason: string;
  }> = [
    {
      id: "revise",
      label: "Revise plan using comments",
      enabled: props.state.canRevise,
      reason: props.state.reviseReason ?? "Open comments are required to revise.",
    },
    {
      id: "requestReview",
      label: "Request review",
      enabled: props.state.canRequestReview,
      reason: props.state.reviewReason ?? "Plan must be a draft in planning.",
    },
    {
      id: "approve",
      label: "Approve plan",
      enabled: props.state.canApprove,
      reason:
        props.state.approveReason ??
        (props.role !== "architect" && props.role !== "lead"
          ? "Only architects and leads can approve plans."
          : "Plan must be in review with comments addressed."),
    },
    {
      id: "handOff",
      label: "Hand off to Runner",
      enabled: props.state.canHandOff,
      reason:
        props.state.handOffReason ??
        "Requires an architect-approved plan for a workstream you own.",
    },
  ];

  const primaryAction = actions.find((a) => a.id === primary) ?? null;
  const secondary = actions.filter((a) => a.id !== primary);

  function run(id: PrimaryId) {
    startTransition(async () => {
      let result: ActionResult;
      switch (id) {
        case "revise":
          result = await revisePlan(props.workstreamId);
          break;
        case "requestReview":
          result = await requestReview(props.workstreamId);
          break;
        case "approve":
          result = await approvePlan(props.workstreamId);
          break;
        case "handOff":
          result = await handOff(props.workstreamId);
          break;
      }
      if (result.ok) {
        toast.success("Updated");
        setMoreOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <TooltipProvider>
      <section
        aria-labelledby="rl-next-h"
        className="rl-sheet flex flex-col gap-3 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2
              id="rl-next-h"
              className="m-0 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[var(--relay-ink-muted)]"
            >
              Next step
            </h2>
            <p className="mt-1.5 m-0 text-[14px] text-[var(--relay-ink)]">{message}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {primaryAction ? (
              <button
                type="button"
                disabled={!primaryAction.enabled || pending}
                className={cn(
                  "rl-btn-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                onClick={() => run(primaryAction.id)}
              >
                {primaryAction.label}
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                className="rl-btn-second"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                More
              </button>
              {moreOpen ? (
                <div className="absolute right-0 z-20 mt-2 min-w-[220px] rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface)] p-1.5 shadow-lg">
                  {secondary.map((action) => {
                    const button = (
                      <button
                        key={action.id}
                        type="button"
                        disabled={!action.enabled || pending}
                        className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm text-[var(--relay-ink)] hover:bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => run(action.id)}
                      >
                        {action.label}
                      </button>
                    );
                    if (action.enabled) return button;
                    return (
                      <Tooltip key={action.id} content={action.reason}>
                        <span className="block">{button}</span>
                      </Tooltip>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
