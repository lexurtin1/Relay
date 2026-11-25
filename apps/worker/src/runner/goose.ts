export type RunnerEventType =
  | "thought_summary"
  | "tool_call"
  | "tool_result"
  | "file_edit"
  | "test_run"
  | "question"
  | "answer"
  | "status";

export interface GooseLaunch {
  argv: string[];
  env: Record<string, string>;
  cwd: string;
}

export interface GooseRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface AgentEventDraft {
  type: RunnerEventType;
  payload: {
    text: string;
    kind: "info" | "tool" | "test" | "question" | "answer" | "pr";
    name?: string;
    path?: string;
  };
}

const BLOCKED_ENV = ["AI_GATEWAY_API_KEY", "AI_GATEWAY_BASE_URL", "GITHUB_TOKEN", "DATABASE_URL"];

export function buildGooseLaunch(opts: {
  model: string;
  prompt: string;
  shimHost: string;
  jobToken: string;
  toolshedUrl: string;
  cwd: string;
  maxTurns?: number;
}): GooseLaunch {
  const env: Record<string, string> = {
    ANTHROPIC_HOST: opts.shimHost,
    ANTHROPIC_API_KEY: opts.jobToken,
    GOOSE_PROVIDER: "anthropic",
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "/tmp",
  };
  for (const key of BLOCKED_ENV) {
    delete env[key];
  }
  return {
    cwd: opts.cwd,
    env,
    argv: [
      "goose",
      "run",
      "--no-session",
      "--no-profile",
      "--provider",
      "anthropic",
      "--model",
      opts.model,
      "--max-turns",
      String(opts.maxTurns ?? 30),
      "--output-format",
      "stream-json",
      "--with-builtin",
      "developer",
      "--with-streamable-http-extension",
      opts.toolshedUrl,
      "-t",
      opts.prompt,
    ],
  };
}

interface GooseLine {
  type?: string;
  text?: string;
  content?: string;
  name?: string;
  tool?: string;
  arguments?: unknown;
  result?: string;
  path?: string;
}

function asLine(value: unknown): GooseLine | null {
  if (!value || typeof value !== "object") return null;
  return value as GooseLine;
}

/** Map goose `--output-format stream-json` lines onto AgentEvent rows. */
export function parseGooseStream(stdout: string): AgentEventDraft[] {
  const events: AgentEventDraft[] = [];
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const row = asLine(parsed);
    if (!row?.type) continue;
    if (row.type === "text" || row.type === "message") {
      const text = row.text ?? row.content ?? "";
      if (!text) continue;
      events.push({ type: "thought_summary", payload: { text, kind: "info" } });
      continue;
    }
    if (row.type === "tool_call" || row.type === "tool_request") {
      const name = row.name ?? row.tool ?? "tool";
      events.push({
        type: "tool_call",
        payload: { text: name, kind: "tool", name },
      });
      continue;
    }
    if (row.type === "tool_result" || row.type === "tool_response") {
      const name = row.name ?? row.tool ?? "tool";
      const text = row.result ?? row.content ?? "";
      events.push({
        type: "tool_result",
        payload: { text: text || name, kind: "tool", name },
      });
      continue;
    }
    if (row.type === "file_edit") {
      const path = row.path ?? "file";
      events.push({
        type: "file_edit",
        payload: { text: path, kind: "tool", path },
      });
    }
  }
  return events;
}
