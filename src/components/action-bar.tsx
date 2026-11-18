"use client";

import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import type { ActionGate, ActionVerb, PlanView } from "@/lib/view-models";
import { cn } from "@/lib/utils";

/** Legacy shape used by the database page; maps onto gates. */
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

const LABELS: Partial<Record<ActionVerb, string>> = {
  generate_plan: "Generate plan",
  request_review: "Request review",
  revise_plan: "Revise from comments",
  approve_plan: "Approve plan",
  hand_off: "Hand off to Runner",
};

/** Which plan actions apply at this point, in workflow order. */
export function applicableVerbs(plan: PlanView | null, hasRunner: boolean, researchDone: boolean, drafting: boolean): ActionVerb[] {
  if (drafting) return [];
  if (!plan) return researchDone ? ["generate_plan"] : [];
  if (plan.status === "draft") return plan.openComments > 0 ? ["revise_plan", "request_review"] : ["request_review"];
  if (plan.status === "in_review") return plan.openComments > 0 ? ["revise_plan", "approve_plan"] : ["approve_plan"];
  if (plan.status === "approved" && !hasRunner) return ["hand_off"];
  return [];
}

export function planActionStatus(plan: PlanView | null, drafting: boolean): string {
  if (drafting) return "The Planner is drafting. This takes a few seconds.";
  if (!plan) return "No plan yet. Generate one from Scout's findings.";
  if (plan.status === "draft") return `Plan v${plan.version} is a draft. Send it for review when it reads right.`;
  if (plan.status === "in_review") {
    return plan.openComments > 0
      ? `${plan.openComments} open comment${plan.openComments === 1 ? "" : "s"}. Resolve them or let the Planner revise.`
      : "All comments resolved. An architect or lead can approve.";
  }
  if (plan.status === "approved") return `Plan v${plan.version} approved by ${plan.approvals.map((a) => a.name).join(", ") || "an architect"}.`;
  return `Plan v${plan.version}.`;
}

export function ActionBar(props: {
  verbs: ActionVerb[];
  gates: Record<ActionVerb, ActionGate>;
  status: string;
  primary: ActionVerb | null;
  onRun: (verb: ActionVerb) => void;
  onSwitch: (userId: string) => void;
  color?: string;
}) {
  if (props.verbs.length === 0) return null;
  const blocked = props.verbs.map((v) => props.gates[v]).find((g) => !g.ok && g.switchTo);

  return (
    <TooltipProvider>
      <div className="rl-glass sticky bottom-4 z-20 mx-auto mt-2 flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 rounded-[22px] p-3.5">
        <p className="m-0 min-w-0 flex-1 text-[13px] text-[var(--relay-ink-body)]">
          {props.status}
          {blocked?.switchTo ? (
            <button type="button" className="ml-2 font-medium text-[var(--relay-brand-fg)] hover:underline" onClick={() => props.onSwitch(blocked.switchTo!.id)}>
              Switch to {blocked.switchTo.name} ({blocked.switchTo.role})
            </button>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {props.verbs.map((verb) => {
            const gate = props.gates[verb];
            const isPrimary = verb === props.primary || props.verbs.length === 1;
            const button = (
              <button
                key={verb}
                type="button"
                disabled={!gate.ok}
                onClick={() => props.onRun(verb)}
                className={cn(isPrimary ? "rl-btn-primary" : "rl-btn-second", "disabled:cursor-not-allowed disabled:opacity-50")}
                style={isPrimary && gate.ok && props.color && verb === "hand_off" ? { background: props.color, borderColor: props.color } : undefined}
              >
                {LABELS[verb] ?? verb}
              </button>
            );
            if (gate.ok) return button;
            return (
              <Tooltip key={verb} content={gate.reason ?? "Not available"}>
                <span className="inline-flex">{button}</span>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
