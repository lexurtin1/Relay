import { describe, expect, it } from "vitest";
import { computeDashboardCounts } from "./domain";

describe("computeDashboardCounts", () => {
  it("counts stages used by the dashboard top bar", () => {
    const counts = computeDashboardCounts([
      { stage: "research" },
      { stage: "research" },
      { stage: "in_review" },
      { stage: "building" },
      { stage: "awaiting_input" },
      { stage: "pr_open" },
      { stage: "merged" },
    ]);

    expect(counts).toEqual({
      inResearch: 2,
      inReview: 1,
      building: 1,
      awaitingInput: 1,
      prsOpen: 1,
    });
  });
});
