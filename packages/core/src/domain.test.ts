import { describe, expect, it } from "vitest";
import {
  computeDashboardCounts,
  initialsFromName,
  mapStageToStepper,
  resolveWorkstreamColour,
  WORKSTREAM_COLOURS,
} from "./domain";

describe("computeDashboardCounts", () => {
  it("counts stages used by the dashboard", () => {
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

describe("initialsFromName", () => {
  it("builds two-letter initials", () => {
    expect(initialsFromName("Alex Curtin")).toBe("AC");
  });
});

describe("mapStageToStepper", () => {
  it("maps workstream stages onto the five-step rail", () => {
    expect(mapStageToStepper("in_review")).toBe("review");
    expect(mapStageToStepper("awaiting_input")).toBe("build");
    expect(mapStageToStepper("pr_open")).toBe("pr");
  });
});

describe("resolveWorkstreamColour", () => {
  it("resolves hex and named keys, falling back to neutral", () => {
    expect(resolveWorkstreamColour("#0D9488")).toBe("#0D9488");
    expect(resolveWorkstreamColour("trust")).toBe(WORKSTREAM_COLOURS.trust);
    expect(resolveWorkstreamColour(null)).toBe(WORKSTREAM_COLOURS.neutral);
  });
});
