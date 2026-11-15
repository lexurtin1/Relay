import { describe, expect, it } from "vitest";
import { buildRunnerResumeScript, buildRunnerScript } from "./script";

describe("runner scripts", () => {
  it("pauses once for ask_human on the initial script", () => {
    const steps = buildRunnerScript({
      title: "Add ISIN validation tool",
      workstreamId: "demo-ws-isin",
    });
    const pauses = steps.filter((s) => s.pause);
    expect(pauses).toHaveLength(1);
    expect(pauses[0]?.type).toBe("question");
    expect(steps.some((s) => s.type === "file_edit")).toBe(true);
  });

  it("finishes resume without another pause", () => {
    const steps = buildRunnerResumeScript();
    expect(steps.every((s) => !s.pause)).toBe(true);
    expect(steps.some((s) => s.payload?.prUrl)).toBe(true);
  });
});
