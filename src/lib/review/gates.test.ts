import { describe, expect, it } from "vitest";
import { computeReviewGates } from "./gates";

describe("computeReviewGates", () => {
  it("blocks approve while comments remain open", () => {
    const gates = computeReviewGates({
      role: "architect",
      owns: false,
      hasPlan: true,
      planStatus: "in_review",
      openCommentCount: 2,
      hasArchitectApproval: false,
    });
    expect(gates.canApprove).toBe(false);
    expect(gates.canRevise).toBe(true);
  });

  it("allows architect approve when comments are clear", () => {
    const gates = computeReviewGates({
      role: "architect",
      owns: false,
      hasPlan: true,
      planStatus: "in_review",
      openCommentCount: 0,
      hasArchitectApproval: false,
    });
    expect(gates.canApprove).toBe(true);
    expect(gates.canHandOff).toBe(false);
  });

  it("allows owner handoff after approval", () => {
    const gates = computeReviewGates({
      role: "engineer",
      owns: true,
      hasPlan: true,
      planStatus: "approved",
      openCommentCount: 0,
      hasArchitectApproval: true,
    });
    expect(gates.canHandOff).toBe(true);
    expect(gates.canApprove).toBe(false);
  });

  it("keeps viewers read-only", () => {
    const gates = computeReviewGates({
      role: "viewer",
      owns: true,
      hasPlan: true,
      planStatus: "in_review",
      openCommentCount: 0,
      hasArchitectApproval: false,
    });
    expect(gates.canRevise).toBe(false);
    expect(gates.canApprove).toBe(false);
    expect(gates.canHandOff).toBe(false);
  });
});
