import { mapStageToStepper, type StepperStage } from "@relay/core/domain";
import type { StageCount } from "@/lib/demo-store/selectors";
import type { WorkstreamRowRow } from "@/lib/overview";

const META: Record<StepperStage, Pick<StageCount, "label" | "holder" | "holderLabel">> = {
  research: { label: "Research", holder: "agent", holderLabel: "Scout" },
  plan: { label: "Plan", holder: "agent", holderLabel: "Planner" },
  review: { label: "Review", holder: "person", holderLabel: "Architect" },
  build: { label: "Build", holder: "agent", holderLabel: "Runner" },
  pr: { label: "Pull request", holder: "person", holderLabel: "Owner" },
};

/** Stage counts for database mode, where only row summaries are available. */
export function stageCountsFromRows(rows: WorkstreamRowRow[]): StageCount[] {
  const live = rows.filter((r) => r.stage !== "merged" && r.stage !== "killed");
  return (Object.keys(META) as StepperStage[]).map((key) => {
    const inStage = live.filter((r) => mapStageToStepper(r.stage) === key);
    return {
      key,
      ...META[key],
      count: inStage.length,
      blocked: inStage.filter((r) => r.progressTone === "waiting").length,
      agentActive: inStage.filter((r) => r.progressTone === "active").length,
    };
  });
}

