export type ReviewGateInput = {
  role: string;
  owns: boolean;
  hasPlan: boolean;
  planStatus: string | null;
  openCommentCount: number;
  hasArchitectApproval: boolean;
  handedOff?: boolean;
};

export type ReviewGates = {
  canRevise: boolean;
  canApprove: boolean;
  canHandOff: boolean;
  reviseReason?: string;
  approveReason?: string;
  handOffReason?: string;
};

export function computeReviewGates(input: ReviewGateInput): ReviewGates {
  const isReviewer = input.role === "architect" || input.role === "lead";
  const isViewer = input.role === "viewer";
  const inReview = input.planStatus === "in_review";
  const approved =
    input.planStatus === "approved" || input.hasArchitectApproval;

  const canRevise =
    !isViewer &&
    input.hasPlan &&
    input.openCommentCount > 0 &&
    (inReview || input.planStatus === "draft");

  const canApprove =
    !isViewer &&
    isReviewer &&
    input.hasPlan &&
    inReview &&
    input.openCommentCount === 0 &&
    !input.hasArchitectApproval;

  const canHandOff =
    !isViewer &&
    input.owns &&
    input.hasPlan &&
    approved &&
    !input.handedOff;

  return {
    canRevise,
    canApprove,
    canHandOff,
    reviseReason: isViewer
      ? "Viewers cannot revise plans."
      : input.openCommentCount > 0
        ? undefined
        : "Open comments are required before revising from review feedback.",
    approveReason: isViewer
      ? "Viewers cannot approve plans."
      : !isReviewer
        ? "Only architects and leads can approve plans."
        : input.openCommentCount > 0
          ? "Resolve or address open comments before approval."
          : inReview
            ? input.hasArchitectApproval
              ? "This plan is already approved."
              : undefined
            : "Plan must be in review.",
    handOffReason: isViewer
      ? "Viewers cannot hand off workstreams."
      : !input.owns
        ? "You can only hand off workstreams you own."
        : input.handedOff
          ? "Already handed off to Runner."
          : approved
            ? undefined
            : "Needs an architect or lead approval.",
  };
}
