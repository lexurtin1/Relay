import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuditWrite } from "@relay/core/audit";
import { createCredentialBroker } from "./broker";
import type { GooseLaunch, GooseRunResult } from "./goose";
import { processRunnerJob, type RunnerJobContext, type RunnerSink, type RunnerStatusName } from "./processor";
import { openWorkspace } from "./sandbox";

const ctx: RunnerJobContext = {
  jobId: "job-123456",
  workstreamId: "ws-1",
  planId: "plan-1",
  ownerId: "owner-1",
  planStatus: "approved",
  approvalCount: 1,
  planMarkdown: "Add a fixture helper.",
  additionalInstructions: "model:claude-opus-5-5\nprofile:default",
};

function memorySink(seed: RunnerStatusName[] = ["queued"]) {
  const statuses = [...seed];
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const questions: Array<{ text: string; options: string[] }> = [];
  const audits: AuditWrite[] = [];
  const stages: string[] = [];
  const sink: RunnerSink = {
    async status(status) {
      statuses.push(status);
    },
    async stage(stage) {
      stages.push(stage);
    },
    async event(type, payload) {
      events.push({ type, payload });
    },
    async question(text, options) {
      questions.push({ text, options });
    },
    async audit(row) {
      audits.push(row);
    },
  };
  return { sink, statuses, events, questions, audits, stages };
}

describe("processRunnerJob", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  async function workspace(commands?: Record<string, { code: number; stdout?: string }>) {
    const root = await mkdtemp(join(tmpdir(), "relay-runner-"));
    roots.push(root);
    return openWorkspace({
      jobId: ctx.jobId,
      mode: "mock",
      broker: createCredentialBroker(),
      root,
      commands,
    });
  }

  it("moves queued to provisioning to running to succeeded without spawning goose", async () => {
    const spawnGoose = vi.fn(async (_launch: GooseLaunch): Promise<GooseRunResult> => ({ code: 0, stdout: "", stderr: "" }));
    const record = memorySink();
    const result = await processRunnerJob(ctx, {
      sink: record.sink,
      workspace: await workspace(),
      mode: "mock",
      shimHost: "http://127.0.0.1:8787",
      toolshedUrl: "http://127.0.0.1:8788/mcp",
    });

    expect(result.outcome).toBe("succeeded");
    expect(result.gooseSpawns).toBe(0);
    expect(spawnGoose).not.toHaveBeenCalled();
    expect(record.statuses).toEqual(["queued", "provisioning", "running", "succeeded"]);
    expect(record.stages).toEqual(["pr_open"]);
    expect(record.events.length).toBeGreaterThan(0);
    expect(record.audits.some((row) => row.action === "model_call")).toBe(true);
    expect(record.audits.some((row) => row.action === "tool_call")).toBe(true);
    expect(record.questions).toHaveLength(0);
  });

  it("asks a person after two fix attempts and spawns goose only for plan, edit, and the two fixes", async () => {
    const spawnGoose = vi.fn(async (_launch: GooseLaunch): Promise<GooseRunResult> => ({
      code: 0,
      stdout: `${JSON.stringify({ type: "text", text: "working" })}\n`,
      stderr: "",
    }));
    const record = memorySink();
    const result = await processRunnerJob(ctx, {
      sink: record.sink,
      workspace: await workspace({ "pnpm test": { code: 1, stdout: "1 failed" }, "pnpm lint": { code: 0, stdout: "ok" } }),
      mode: "mock",
      shimHost: "http://127.0.0.1:8787",
      toolshedUrl: "http://127.0.0.1:8788/mcp",
      spawnGoose,
    });

    expect(result.outcome).toBe("awaiting_input");
    expect(result.gooseSpawns).toBe(4);
    expect(spawnGoose).toHaveBeenCalledTimes(4);
    const prompts = spawnGoose.mock.calls.map((call) => call[0].argv.at(-1) ?? "");
    expect(prompts[0]).toContain("implementation note");
    expect(prompts[1]).toContain("Implement the approved plan");
    expect(prompts[2]).toContain("attempt 1 of 2");
    expect(prompts[3]).toContain("attempt 2 of 2");
    expect(record.questions).toHaveLength(1);
    expect(record.statuses.at(-1)).toBe("awaiting_input");
    expect(record.stages).toEqual(["awaiting_input"]);
    expect(prompts.some((prompt) => prompt.includes("attempt 3"))).toBe(false);
  });
});
