"use client";

import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ActionBarState = {
  canGeneratePlan: boolean;
  canRequestReview: boolean;
  canApprove: boolean;
  canHandOff: boolean;
  generateReason?: string;
  reviewReason?: string;
  approveReason?: string;
  handOffReason?: string;
};

export function ActionBar(props: {
  state: ActionBarState;
  role: string;
}) {
  const actions: Array<{
    id: string;
    label: string;
    enabled: boolean;
    reason: string;
    primary?: boolean;
  }> = [
    {
      id: "generate",
      label: "Generate plan",
      enabled: props.state.canGeneratePlan,
      reason: props.state.generateReason ?? "Research findings are required first.",
    },
    {
      id: "review",
      label: "Request review",
      enabled: props.state.canRequestReview,
      reason: props.state.reviewReason ?? "A draft plan is required.",
    },
    {
      id: "approve",
      label: "Approve",
      enabled: props.state.canApprove,
      reason:
        props.state.approveReason ??
        (props.role !== "architect" && props.role !== "lead"
          ? "Only architects and leads can approve plans."
          : "Plan must be in review."),
    },
    {
      id: "handoff",
      label: "Hand off to Runner",
      enabled: props.state.canHandOff,
      reason:
        props.state.handOffReason ??
        "Requires an architect-approved plan for a workstream you own.",
      primary: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="sticky bottom-0 z-20 border-t border-[var(--relay-border)] bg-[var(--relay-surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3">
          <div className="mr-auto text-xs text-[var(--relay-ink-muted)]">
            Actions apply to the current plan version.
          </div>
          {actions.map((action) => {
            const button = (
              <button
                key={action.id}
                type="button"
                disabled={!action.enabled}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium transition-relay",
                  action.primary
                    ? "bg-[var(--relay-primary)] text-[var(--relay-primary-fg)] hover:bg-[var(--relay-primary-hover)] disabled:bg-[var(--relay-border)] disabled:text-[var(--relay-ink-subtle)]"
                    : "border border-[var(--relay-border)] bg-[var(--relay-surface)] text-[var(--relay-ink)] hover:border-[var(--relay-primary)] disabled:text-[var(--relay-ink-subtle)]",
                )}
              >
                {action.label}
              </button>
            );

            if (action.enabled) return button;

            return (
              <Tooltip key={action.id} content={action.reason}>
                <span className="inline-flex">{button}</span>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
