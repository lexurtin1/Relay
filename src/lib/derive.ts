import type { WorkstreamStage } from "@relay/core/domain";

export type ProgressTone = "active" | "waiting" | "done" | "neutral";

export type ProgressInput = {
  stage: WorkstreamStage;
  questionOpen: boolean;
  runnerActive: boolean;
  stepsCompleted: number;
  stepsTotal: number;
  researchRunning: boolean;
  planDrafting: boolean;
  planVersion: number | null;
  planStatus: "draft" | "in_review" | "approved" | "superseded" | null;
  openComments: number;
  prChecks: "running" | "passed" | null;
  findingsReady: boolean;
};

/** One status line per workstream. Shared by the database loader and the demo store. */
export function deriveProgress(p: ProgressInput): { label: string; tone: ProgressTone } {
  const steps = `step ${Math.min(p.stepsCompleted + 1, Math.max(p.stepsTotal, 1))} of ${Math.max(p.stepsTotal, 1)}`;
  if (p.questionOpen || p.stage === "awaiting_input") return { label: "Paused, waiting on you", tone: "waiting" };
  if (p.planDrafting) return { label: "Planner drafting", tone: "active" };
  if (p.runnerActive) return { label: `Runner, ${steps}`, tone: "active" };
  if (p.researchRunning) return { label: "Scout researching", tone: "active" };
  if (p.stage === "pr_open") {
    return p.prChecks === "passed"
      ? { label: "PR ready to merge", tone: "waiting" }
      : { label: "PR open, checks running", tone: "active" };
  }
  if (p.stage === "merged") return { label: "Merged", tone: "done" };
  if (p.stage === "killed") return { label: "Stopped", tone: "neutral" };
  if (p.stage === "in_review") {
    const v = `Plan v${p.planVersion ?? 1}`;
    return p.openComments > 0
      ? { label: `${v}, ${p.openComments} comment${p.openComments === 1 ? "" : "s"}`, tone: "waiting" }
      : { label: `${v}, awaiting approval`, tone: "waiting" };
  }
  if (p.stage === "approved") return { label: "Approved, ready to hand off", tone: "waiting" };
  if (p.planStatus === "draft") return { label: `Plan v${p.planVersion ?? 1} draft`, tone: "neutral" };
  if (p.findingsReady) return { label: "Findings ready", tone: "neutral" };
  if (p.stage === "research") return { label: "In research", tone: "active" };
  return { label: "Not started", tone: "neutral" };
}
