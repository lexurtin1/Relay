import type { AuditWrite } from "../audit";

export class HandOffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandOffError";
  }
}

export interface HandOffUser {
  id: string;
  role: string;
}

export interface HandOffPlan {
  id: string;
  status: string;
  approvalCount: number;
}

export interface HandOffWorkstream {
  id: string;
  ownerId: string;
}

export interface HandOffJobInput {
  workstreamId: string;
  planId: string;
  additionalInstructions: string;
}

export interface HandOffDeps {
  createJob: (input: HandOffJobInput) => Promise<{ id: string }>;
  markBuilding: (workstreamId: string) => Promise<void>;
  audit: (row: AuditWrite) => Promise<void>;
  enqueue: (jobId: string) => Promise<void>;
}

export interface HandOffRequest {
  user: HandOffUser;
  workstream: HandOffWorkstream | null;
  plan: HandOffPlan | null;
  additionalContext: string;
  modelId: string;
  profile: string;
}

/**
 * Owner-only hand-off of an approved plan. Creates the job, writes the
 * hand_off audit row, and enqueues exactly one Runner job.
 */
export async function handOffToRunnerJob(request: HandOffRequest, deps: HandOffDeps): Promise<{ jobId: string }> {
  if (!request.workstream) {
    throw new HandOffError("Workstream not found.");
  }
  if (request.user.role === "viewer" || request.user.id !== request.workstream.ownerId) {
    throw new HandOffError("You can only hand off workstreams you own.");
  }
  if (!request.plan || request.plan.status !== "approved" || request.plan.approvalCount < 1) {
    throw new HandOffError("Needs an architect-approved plan.");
  }

  const additionalInstructions = [
    request.additionalContext.trim() || null,
    `model:${request.modelId}`,
    `profile:${request.profile}`,
  ]
    .filter(Boolean)
    .join("\n");

  const job = await deps.createJob({
    workstreamId: request.workstream.id,
    planId: request.plan.id,
    additionalInstructions,
  });

  await deps.audit({
    action: "hand_off",
    userId: request.user.id,
    workstreamId: request.workstream.id,
    planId: request.plan.id,
    runnerJobId: job.id,
    modelId: request.modelId,
    detail: `Handed off to the Runner (${request.profile})`,
  });

  await deps.markBuilding(request.workstream.id);
  await deps.enqueue(job.id);
  return { jobId: job.id };
}
