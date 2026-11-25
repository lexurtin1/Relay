import { describe, expect, it, vi } from "vitest";
import { assertFixAllowed, nextFixDecision, runBlueprint, type BlueprintHooks, type CheckResult } from "./blueprint";

function checks(lintOk: boolean, testOk: boolean): Pick<BlueprintHooks, "lint" | "test"> {
  return {
    lint: vi.fn(async (): Promise<CheckResult> => ({ ok: lintOk, output: lintOk ? "" : "lint failed" })),
    test: vi.fn(async (): Promise<CheckResult> => ({ ok: testOk, output: testOk ? "" : "test failed" })),
  };
}

function hooks(partial: Partial<BlueprintHooks>): BlueprintHooks {
  return {
    clone: vi.fn(async () => {}),
    install: vi.fn(async () => {}),
    plan: vi.fn(async () => "note"),
    edit: vi.fn(async () => {}),
    lint: vi.fn(async () => ({ ok: true, output: "" })),
    test: vi.fn(async () => ({ ok: true, output: "" })),
    fix: vi.fn(async () => {}),
    ask: vi.fn(async () => {}),
    openPullRequest: vi.fn(async () => {}),
    ...partial,
  };
}

describe("runBlueprint", () => {
  it("visits plan and edit and never visits fix when lint and test pass", async () => {
    const used = hooks(checks(true, true));
    const result = await runBlueprint(used);

    expect(result.outcome).toBe("succeeded");
    expect(result.fixAttempts).toBe(0);
    expect(result.steps.map((step) => step.node)).toEqual([
      "clone",
      "install",
      "plan",
      "edit",
      "lint",
      "test",
      "open_pr",
    ]);
    expect(result.steps.find((step) => step.node === "fix")).toBeUndefined();
    expect(used.fix).not.toHaveBeenCalled();
    expect(used.ask).not.toHaveBeenCalled();
    expect(used.plan).toHaveBeenCalledOnce();
    expect(used.edit).toHaveBeenCalledWith("note");
  });

  it("runs fix twice and then asks a person when the suite stays red", async () => {
    const used = hooks(checks(true, false));
    const result = await runBlueprint(used);

    expect(result.outcome).toBe("awaiting_input");
    expect(result.fixAttempts).toBe(2);
    const fixes = result.steps.filter((step) => step.node === "fix");
    expect(fixes).toEqual([
      { node: "fix", kind: "agent", attempt: 1 },
      { node: "fix", kind: "agent", attempt: 2 },
    ]);
    expect(used.fix).toHaveBeenCalledTimes(2);
    expect(used.fix).toHaveBeenNthCalledWith(1, 1, "test failed");
    expect(used.fix).toHaveBeenNthCalledWith(2, 2, "test failed");
    expect(used.ask).toHaveBeenCalledOnce();
    expect(used.openPullRequest).not.toHaveBeenCalled();
    expect(result.steps.filter((step) => step.node === "fix")).toHaveLength(2);
  });

  it("fails the job when install exits non-zero and does not call the model", async () => {
    const used = hooks({
      install: vi.fn(async () => {
        throw new Error("install failed");
      }),
    });
    const result = await runBlueprint(used);
    expect(result.outcome).toBe("failed");
    expect(result.error).toBe("install failed");
    expect(used.plan).not.toHaveBeenCalled();
    expect(used.fix).not.toHaveBeenCalled();
  });
});

describe("fix cap", () => {
  it("makes a third fix impossible", () => {
    expect(nextFixDecision(0)).toBe("fix");
    expect(nextFixDecision(1)).toBe("fix");
    expect(nextFixDecision(2)).toBe("ask");
    expect(nextFixDecision(3)).toBe("ask");
    expect(() => assertFixAllowed(2)).toThrow(/CI fix cap is 2/);
  });
});
