"use client";

import { HandOffModal } from "@/components/hand-off-modal";
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

export function planActionStatus(state: ActionBarState): string {
  if (state.openCommentCount > 0) {
    return `${state.openCommentCount} comment${state.openCommentCount === 1 ? "" : "s"} must be resolved before approval.`;
  }
  if (state.canHandOff) {
    return "Plan approved. Hand it off to start the build.";
  }
  if (state.canApprove) {
    return "All comments resolved. The plan can be approved.";
  }
  return "Actions apply to the current plan version.";
}

export function ActionBar(props: {
  state: ActionBarState;
  role: string;
  workstreamId: string;
  planId: string | null;
  color?: string;
}) {
  const secondary: Array<{
    id: string;
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
      id: "approve",
      label: "Approve plan",
      enabled: props.state.canApprove,
      reason:
        props.state.approveReason ??
        (props.role !== "architect" && props.role !== "lead"
          ? "Only architects and leads can approve plans."
          : "Plan must be in review with comments addressed."),
    },
  ];

  return (
    <TooltipProvider>
      <div className="rl-glass sticky bottom-4 z-20 mx-auto mt-6 flex max-w-[1120px] flex-col gap-3 rounded-[22px] p-3.5">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {secondary.map((action) => {
            const button = (
              <button
                key={action.id}
                type="button"
                disabled={!action.enabled}
                className={cn(
                  "rl-btn-second",
                  "disabled:cursor-not-allowed disabled:opacity-50",
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
          <HandOffModal
            workstreamId={props.workstreamId}
            planId={props.planId}
            canHandOff={props.state.canHandOff}
            handOffReason={props.state.handOffReason}
            color={props.color}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
