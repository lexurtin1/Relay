import { describe, expect, it } from "vitest";
import { auditStoredApproval, createMemoryAuditStore, writeAudit } from "./audit";

describe("writeAudit", () => {
  it("writes model_call, tool_call, and approval and reads them back", async () => {
    const store = createMemoryAuditStore();

    await writeAudit(
      {
        action: "model_call",
        modelId: "claude-opus-5-5",
        tokenInput: 12,
        tokenOutput: 8,
        workstreamId: "ws-1",
        planId: "plan-1",
        runnerJobId: "job-1",
        detail: "plan",
      },
      store,
    );
    await writeAudit(
      {
        action: "tool_call",
        runnerJobId: "job-1",
        workstreamId: "ws-1",
        detail: "pnpm test exit 0",
        connectorItemsAccessed: [{ connectorId: "jira", id: "INNO-214" }],
      },
      store,
    );
    await auditStoredApproval({ userId: "user-1", planId: "plan-1", workstreamId: "ws-1" }, store);

    const rows = await store.list();
    expect(rows.map((row) => row.action)).toEqual(["model_call", "tool_call", "approval"]);

    expect(rows[0]).toMatchObject({
      action: "model_call",
      modelId: "claude-opus-5-5",
      tokenInput: 12,
      tokenOutput: 8,
      userId: null,
      workstreamId: "ws-1",
      planId: "plan-1",
      runnerJobId: "job-1",
      detail: "plan",
      connectorItemsAccessed: null,
    });
    expect(rows[0]?.id).toMatch(/^audit_/);
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);

    expect(rows[1]).toMatchObject({
      action: "tool_call",
      detail: "pnpm test exit 0",
      connectorItemsAccessed: [{ connectorId: "jira", id: "INNO-214" }],
    });

    expect(rows[2]).toMatchObject({
      action: "approval",
      userId: "user-1",
      planId: "plan-1",
      detail: "Plan approved",
    });
  });
});
