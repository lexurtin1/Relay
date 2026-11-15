import { describe, expect, it } from "vitest";
import {
  canTransition,
  computeDashboardCounts,
  getActionCapabilities,
  initialsFromName,
  mapStageToStepper,
  nextStepCopy,
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

describe("canTransition", () => {
  it("allows the happy-path Orbit edges for engineers", () => {
    expect(canTransition("idea", "research", "engineer")).toBe(true);
    expect(canTransition("research", "planning", "engineer")).toBe(true);
    expect(canTransition("planning", "in_review", "engineer")).toBe(true);
    expect(canTransition("in_review", "planning", "engineer")).toBe(true);
    expect(canTransition("awaiting_input", "building", "engineer")).toBe(true);
  });

  it("restricts approval to architect and lead", () => {
    expect(canTransition("in_review", "approved", "engineer")).toBe(false);
    expect(canTransition("in_review", "approved", "architect")).toBe(true);
    expect(canTransition("in_review", "approved", "lead")).toBe(true);
    expect(canTransition("approved", "building", "engineer")).toBe(true);
  });

  it("blocks viewers and illegal edges", () => {
    expect(canTransition("idea", "research", "viewer")).toBe(false);
    expect(canTransition("merged", "building", "lead")).toBe(false);
    expect(canTransition("idea", "approved", "lead")).toBe(false);
  });
});

describe("getActionCapabilities", () => {
  it("enables revise when in review with open comments", () => {
    const caps = getActionCapabilities({
      stage: "in_review",
      role: "engineer",
      owns: true,
      openCommentCount: 3,
      hasPlan: true,
      planStatus: "in_review",
    });
    expect(caps.canRevise).toBe(true);
    expect(caps.canApprove).toBe(false);
    expect(nextStepCopy(caps).primary).toBe("revise");
  });

  it("enables approve for architects when comments are clear", () => {
    const caps = getActionCapabilities({
      stage: "in_review",
      role: "architect",
      owns: false,
      openCommentCount: 0,
      hasPlan: true,
      planStatus: "in_review",
    });
    expect(caps.canApprove).toBe(true);
    expect(nextStepCopy(caps).primary).toBe("approve");
  });

  it("enables hand-off only for the owner on an approved plan", () => {
    const owner = getActionCapabilities({
      stage: "approved",
      role: "engineer",
      owns: true,
      openCommentCount: 0,
      hasPlan: true,
      planStatus: "approved",
    });
    const other = getActionCapabilities({
      stage: "approved",
      role: "engineer",
      owns: false,
      openCommentCount: 0,
      hasPlan: true,
      planStatus: "approved",
    });
    expect(owner.canHandOff).toBe(true);
    expect(other.canHandOff).toBe(false);
  });
});
