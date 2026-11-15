import { describe, expect, it } from "vitest";
import { runPlanner } from "./planner";
import { runScout } from "./scout";

describe("agents", () => {
  it("runs Scout against mock connectors", async () => {
    const result = await runScout({
      title: "Add ISIN validation tool",
      problem: "Duplicate ISIN checks across MCP tools.",
    });
    expect(result.findings.length).toBeGreaterThan(20);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.events.some((e) => e.type === "tool_call")).toBe(true);
    expect(result.mocked).toBe(true);
  });

  it("runs Planner from findings", async () => {
    const result = await runPlanner({
      title: "Add ISIN validation tool",
      problem: "Share one ISIN validator.",
      findings: "Sources show duplicated regex and MCP error conventions.",
    });
    expect(result.markdownBody).toMatch(/Plan|Goal|Steps/i);
    expect(result.steps.length).toBeGreaterThanOrEqual(3);
    expect(result.mocked).toBe(true);
  });
});
