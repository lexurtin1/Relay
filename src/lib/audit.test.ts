import { describe, expect, it } from "vitest";
import { appendDemoAudit, listDemoAudit } from "./demo-audit";

describe("audit demo store", () => {
  it("lists seeded rows including approvals", () => {
    const rows = listDemoAudit();
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.some((r) => r.action === "approval")).toBe(true);
  });

  it("appends role_switch and connector_access rows", () => {
    appendDemoAudit({
      action: "role_switch",
      userId: "demo-aisha",
      userName: "Aisha Rahman",
      detail: "Switched session to Aisha Rahman",
      workstreamId: null,
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
    });
    appendDemoAudit({
      action: "connector_access",
      userId: "demo-alex",
      userName: "Alex Curtin",
      detail: 'Knowledge search "ISIN" via all connectors (3 hits)',
      workstreamId: null,
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
    });
    const rows = listDemoAudit();
    expect(rows.some((r) => r.action === "role_switch" && r.detail?.includes("Aisha"))).toBe(
      true,
    );
    expect(rows.some((r) => r.action === "connector_access" && r.detail?.includes("ISIN"))).toBe(
      true,
    );
  });
});
