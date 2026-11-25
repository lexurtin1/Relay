import { createMessage, type GatewayRequest, type GatewayResponse } from "@relay/core/llm/gateway";
import { parseRunnerInstructions } from "@relay/core/runner/instructions";
import { runBlueprint, type CheckResult } from "@relay/core/runner/blueprint";
import type { AuditWrite } from "@relay/core/audit";
import { buildGooseLaunch, parseGooseStream, type GooseLaunch, type GooseRunResult, type RunnerEventType } from "./goose";
import type { JobWorkspace } from "./sandbox";

export type RunnerStatusName =
  | "queued"
  | "provisioning"
  | "running"
  | "awaiting_input"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "paused_budget";

export interface RunnerJobContext {
  jobId: string;
  workstreamId: string;
  planId: string;
  ownerId: string;
  planStatus: string;
  approvalCount: number;
  planMarkdown: string;
  additionalInstructions: string | null;
}

export interface StatusPatch {
  branch?: string;
  prUrl?: string;
  workspacePath?: string;
  finished?: boolean;
  tokenUsage?: number;
}

export interface RunnerSink {
  status(status: RunnerStatusName, extra?: StatusPatch): Promise<void>;
  stage(stage: string): Promise<void>;
  event(type: RunnerEventType, payload: Record<string, unknown>): Promise<void>;
  question(text: string, options: string[]): Promise<void>;
  audit(row: AuditWrite): Promise<void>;
}

export interface ProcessDeps {
  sink: RunnerSink;
  workspace: JobWorkspace;
  mode: "mock" | "live";
  shimHost: string;
  toolshedUrl: string;
  spawnGoose?: (launch: GooseLaunch) => Promise<GooseRunResult>;
  createMessage?: (request: GatewayRequest) => Promise<GatewayResponse>;
}

export interface ProcessResult {
  outcome: "succeeded" | "awaiting_input" | "failed";
  gooseSpawns: number;
}

const ASK_TEXT = "Lint or tests are still failing after 2 fix attempts. A person needs to take the next step.";
const ASK_OPTIONS = ["I will take it from here", "Stop this run"];

function auditBase(ctx: RunnerJobContext): Pick<AuditWrite, "workstreamId" | "planId" | "runnerJobId"> {
  return { workstreamId: ctx.workstreamId, planId: ctx.planId, runnerJobId: ctx.jobId };
}

async function recordCommand(sink: RunnerSink, ctx: RunnerJobContext, command: string, result: { code: number; stdout: string; stderr: string }, kind: "tool" | "test"): Promise<void> {
  const text = `${command} (exit ${result.code})`;
  await sink.event(kind === "test" ? "test_run" : "tool_call", {
    text,
    kind,
    command,
    exitCode: result.code,
    stdout: result.stdout.slice(0, 2000),
    stderr: result.stderr.slice(0, 2000),
  });
  await sink.audit({
    action: "tool_call",
    detail: text,
    ...auditBase(ctx),
  });
}

/**
 * Run one Runner job. Mock mode calls the gateway stub and does not spawn goose
 * unless a spawn function is injected. Live mode runs goose inside the workspace.
 */
export async function processRunnerJob(ctx: RunnerJobContext, deps: ProcessDeps): Promise<ProcessResult> {
  let gooseSpawns = 0;
  let tokens = 0;
  const instructions = parseRunnerInstructions(ctx.additionalInstructions);

  if (ctx.planStatus !== "approved" || ctx.approvalCount < 1) {
    await deps.sink.status("failed", { finished: true });
    await deps.sink.event("status", { text: "Hand-off rejected. The plan is not approved.", kind: "info" });
    return { outcome: "failed", gooseSpawns };
  }

  const complete = deps.createMessage ?? createMessage;

  const runAgent = async (node: "plan" | "edit" | "fix", prompt: string, attempt?: number): Promise<string> => {
    const useGoose = Boolean(deps.spawnGoose) || deps.mode === "live";
    if (!useGoose) {
      const response = await complete({
        system: "You are the Relay Runner. Work only inside this isolated workspace. Do not touch production systems.",
        messages: [{ role: "user", content: prompt }],
      });
      tokens += response.usage.inputTokens + response.usage.outputTokens;
      await deps.sink.audit({
        action: "model_call",
        modelId: response.model,
        tokenInput: response.usage.inputTokens,
        tokenOutput: response.usage.outputTokens,
        detail: node,
        ...auditBase(ctx),
      });
      await deps.sink.event("thought_summary", { text: response.content, kind: "info", node, attempt });
      return response.content;
    }

    const token = deps.workspace.jobToken;
    if (!token) throw new Error("Job token is missing");
    gooseSpawns += 1;
    const launch = buildGooseLaunch({
      model: instructions.model,
      prompt,
      shimHost: deps.shimHost,
      jobToken: token,
      toolshedUrl: deps.toolshedUrl,
      cwd: deps.workspace.workspacePath,
    });
    const spawn = deps.spawnGoose ?? ((item: GooseLaunch) => deps.workspace.exec(item.argv, item.env));
    const result = await spawn(launch);
    const events = parseGooseStream(result.stdout);
    let note = "";
    for (const event of events) {
      await deps.sink.event(event.type, event.payload);
      if (event.type === "thought_summary" && !note) note = event.payload.text;
      if (event.type === "tool_call") {
        await deps.sink.audit({
          action: "tool_call",
          detail: event.payload.text,
          ...auditBase(ctx),
        });
      }
    }
    if (!note) note = result.stderr.slice(0, 500) || `${node} finished`;
    return note;
  };

  const command = async (line: string, kind: "tool" | "test") => {
    const result = await deps.workspace.run(line);
    await recordCommand(deps.sink, ctx, line, result, kind);
    return result;
  };

  try {
    await deps.workspace.create();
    await deps.sink.status("provisioning", { workspacePath: deps.workspace.workspacePath });

    const blueprint = await runBlueprint({
      clone: async () => {
        await deps.workspace.clone();
        await recordCommand(deps.sink, ctx, "git clone", { code: 0, stdout: deps.workspace.workspacePath, stderr: "" }, "tool");
      },
      install: async () => {
        await deps.workspace.install();
        await recordCommand(deps.sink, ctx, "pnpm install", { code: 0, stdout: "ok", stderr: "" }, "tool");
      },
      plan: async () => {
        await deps.sink.status("running");
        const prompt = [
          "Read the approved plan and write a short implementation note. Do not edit files yet.",
          "",
          instructions.context ? `Hand-off context:\n${instructions.context}` : "",
          "",
          ctx.planMarkdown,
        ]
          .filter(Boolean)
          .join("\n");
        return runAgent("plan", prompt);
      },
      edit: async (planNote) => {
        const prompt = [
          "Implement the approved plan in this workspace. You may edit files and call Toolshed.",
          "",
          `Implementation note:\n${planNote}`,
          "",
          ctx.planMarkdown,
        ].join("\n");
        await runAgent("edit", prompt);
      },
      lint: async (): Promise<CheckResult> => {
        const result = await command("pnpm lint", "tool");
        return { ok: result.code === 0, output: `${result.stdout}\n${result.stderr}`.trim() };
      },
      test: async (): Promise<CheckResult> => {
        const result = await command("pnpm test", "test");
        return { ok: result.code === 0, output: `${result.stdout}\n${result.stderr}`.trim() };
      },
      fix: async (attempt, failure) => {
        const prompt = [
          `Fix the failing lint or tests. This is attempt ${attempt} of 2.`,
          "",
          failure.slice(0, 4000),
        ].join("\n");
        await runAgent("fix", prompt, attempt);
      },
      ask: async () => {
        await deps.sink.question(ASK_TEXT, ASK_OPTIONS);
        await deps.sink.event("question", { text: ASK_TEXT, kind: "question" });
        await deps.sink.status("awaiting_input", { finished: true, tokenUsage: tokens });
        await deps.sink.stage("awaiting_input");
      },
      openPullRequest: async () => {
        const branch = `relay/runner-${ctx.jobId.slice(-6)}`;
        const prUrl = `sandbox://jobs/${ctx.jobId}`;
        await deps.sink.event("status", { text: `Branch ${branch} is ready at ${prUrl}`, kind: "pr" });
        await deps.sink.status("succeeded", { branch, prUrl, finished: true, tokenUsage: tokens });
        await deps.sink.stage("pr_open");
      },
    });

    if (blueprint.outcome === "failed") {
      await deps.sink.status("failed", { finished: true, tokenUsage: tokens });
      await deps.sink.event("status", { text: blueprint.error ?? "Runner failed", kind: "info" });
    }
    return { outcome: blueprint.outcome, gooseSpawns };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Runner failed";
    await deps.sink.status("failed", { finished: true, tokenUsage: tokens });
    await deps.sink.event("status", { text: message, kind: "info" });
    return { outcome: "failed", gooseSpawns };
  } finally {
    await deps.workspace.destroy();
  }
}
