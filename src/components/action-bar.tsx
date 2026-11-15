"use client";

import { useTransition } from "react";
import {
  approvePlanAction,
  handOffAction,
  revisePlanAction,
} from "@/app/actions/review";
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

export function ActionBar(props: {
  workstreamId: string;
  planId: string | null;
  state: ActionBarState;
  role: string;
}) {
  const [pending, startTransition] = useTransition();

  const statusLeft =
    props.state.openCommentCount > 0
      ? `${props.state.openCommentCount} comment${props.state.openCommentCount === 1 ? "" : "s"} must be resolved before approval.`
      : props.state.canHandOff
        ? "Plan approved. Hand it off to start the build."
        : props.state.canApprove
          ? "All comments resolved. The plan can be approved."
          : "Actions apply to the current plan version.";

  const actions: Array<{
    id: string;
    label: string;
    enabled: boolean;
    reason: string;
    primary?: boolean;
    run: () => Promise<void>;
  }> = [
    {
      id: "revise",
      label: pending ? "Revising…" : "Revise plan using comments",
      enabled: props.state.canRevise && !pending,
      reason: props.state.reviseReason ?? "Open comments are required to revise.",
      run: async () => {
        await revisePlanAction(props.workstreamId);
      },
    },
    {
      id: "approve",
      label: pending ? "Approving…" : "Approve plan",
      enabled: props.state.canApprove && Boolean(props.planId) && !pending,
      reason:
        props.state.approveReason ??
        (props.role !== "architect" && props.role !== "lead"
          ? "Only architects and leads can approve plans."
          : "Plan must be in review with comments addressed."),
      run: async () => {
        if (!props.planId) return;
        await approvePlanAction({
          workstreamId: props.workstreamId,
          planId: props.planId,
        });
      },
    },
    {
      id: "handoff",
      label: pending ? "Handing off…" : "Hand off to Runner",
      enabled: props.state.canHandOff && !pending,
      reason:
        props.state.handOffReason ??
        "Requires an architect-approved plan for a workstream you own.",
      primary: true,
      run: async () => {
        await handOffAction(props.workstreamId);
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="rl-glass sticky bottom-24 z-20 mx-auto mt-6 flex max-w-[1120px] flex-col gap-3 rounded-[22px] p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto text-sm text-[var(--relay-ink-muted)]">{statusLeft}</div>
          {actions.map((action) => {
            const button = (
              <button
                key={action.id}
                type="button"
                disabled={!action.enabled}
                className={cn(
                  action.primary ? "rl-btn-primary" : "rl-btn-second",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                onClick={() => {
                  startTransition(async () => {
                    await action.run();
                  });
                }}
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
