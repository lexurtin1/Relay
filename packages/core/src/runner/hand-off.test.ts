import { describe, expect, it, vi } from "vitest";
import { handOffToRunnerJob, type HandOffDeps, type HandOffRequest } from "./hand-off";

function request(overrides: Partial<HandOffRequest> = {}): HandOffRequest {
  return {
    user: { id: "owner-1", role: "engineer" },
    workstream: { id: "ws-1", ownerId: "owner-1" },
    plan: { id: "plan-1", status: "approved", approvalCount: 1 },
    additionalContext: "Use the fixture account",
    modelId: "claude-opus-5-5",
    profile: "default",
    ...overrides,
  };
}

function deps(): HandOffDeps & { created: unknown[]; audits: unknown[]; enqueued: string[] } {
  const created: unknown[] = [];
  const audits: unknown[] = [];
  const enqueued: string[] = [];
  return {
    created,
    audits,
    enqueued,
    createJob: vi.fn(async (input) => {
      created.push(input);
      return { id: "job-1" };
    }),
    markBuilding: vi.fn(async () => {}),
    audit: vi.fn(async (row) => {
      audits.push(row);
    }),
    enqueue: vi.fn(async (jobId: string) => {
      enqueued.push(jobId);
    }),
  };
}

describe("handOffToRunner", () => {
  it("creates the row, writes hand_off, and adds one job", async () => {
    const side = deps();
    const result = await handOffToRunnerJob(request(), side);

    expect(result.jobId).toBe("job-1");
    expect(side.created).toEqual([
      {
        workstreamId: "ws-1",
        planId: "plan-1",
        additionalInstructions: "Use the fixture account\nmodel:claude-opus-5-5\nprofile:default",
      },
    ]);
    expect(side.audits).toEqual([
      expect.objectContaining({
        action: "hand_off",
        userId: "owner-1",
        workstreamId: "ws-1",
        planId: "plan-1",
        runnerJobId: "job-1",
      }),
    ]);
    expect(side.enqueued).toEqual(["job-1"]);
    expect(side.markBuilding).toHaveBeenCalledWith("ws-1");
  });

  it("rejects a viewer and does not add a job", async () => {
    const side = deps();
    await expect(
      handOffToRunnerJob(request({ user: { id: "view-1", role: "viewer" }, workstream: { id: "ws-1", ownerId: "view-1" } }), side),
    ).rejects.toThrow(/only hand off workstreams you own/);
    expect(side.createJob).not.toHaveBeenCalled();
    expect(side.enqueue).not.toHaveBeenCalled();
    expect(side.audits).toHaveLength(0);
  });

  it("rejects an unapproved plan and does not add a job", async () => {
    const side = deps();
    await expect(
      handOffToRunnerJob(request({ plan: { id: "plan-1", status: "in_review", approvalCount: 0 } }), side),
    ).rejects.toThrow(/architect-approved/);
    expect(side.createJob).not.toHaveBeenCalled();
    expect(side.enqueue).not.toHaveBeenCalled();
  });
});
