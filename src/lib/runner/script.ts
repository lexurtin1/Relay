export type RunnerScriptEvent = {
  delayMs: number;
  type: "status" | "file_edit" | "test_run" | "thought_summary" | "question";
  summary: string;
  payload?: Record<string, unknown>;
  /** When set, Runner pauses after emitting this event. */
  pause?: boolean;
};

/** Deterministic mock Runner progression for Milestone 5. */
export function buildRunnerScript(input: {
  title: string;
  workstreamId: string;
}): RunnerScriptEvent[] {
  const branch = `relay/${input.workstreamId.slice(0, 8)}-isin`;
  return [
    {
      delayMs: 400,
      type: "status",
      summary: "Provisioning isolated worktree in demo-repos/ops-tools",
      payload: { workspacePath: "demo-repos/ops-tools", branch },
    },
    {
      delayMs: 700,
      type: "status",
      summary: `Checked out branch ${branch}`,
    },
    {
      delayMs: 900,
      type: "thought_summary",
      summary: `Starting build for “${input.title.slice(0, 72)}”`,
    },
    {
      delayMs: 1100,
      type: "file_edit",
      summary: "Created packages/mcp/src/isin.ts",
      payload: { path: "packages/mcp/src/isin.ts", action: "create" },
    },
    {
      delayMs: 1000,
      type: "file_edit",
      summary: "Updated packages/mcp/src/tools.ts",
      payload: { path: "packages/mcp/src/tools.ts", action: "edit" },
    },
    {
      delayMs: 900,
      type: "test_run",
      summary: "isin.test.ts — 4 passed",
      payload: { suite: "isin.test.ts", passed: 4, failed: 0 },
    },
    {
      delayMs: 800,
      type: "question",
      summary: "Should threshold breaches reuse Power BI semantic labels, or a new MCP enum?",
      payload: {
        questionText:
          "Should threshold breaches reuse Power BI semantic labels, or a new MCP enum?",
        options: ["Reuse Power BI labels", "New MCP enum", "Ask architect"],
      },
      pause: true,
    },
  ];
}

export function buildRunnerResumeScript(): RunnerScriptEvent[] {
  return [
    {
      delayMs: 500,
      type: "status",
      summary: "Resuming Runner after human answer",
    },
    {
      delayMs: 900,
      type: "file_edit",
      summary: "Documented tool usage in README",
      payload: { path: "README.md", action: "edit" },
    },
    {
      delayMs: 1000,
      type: "test_run",
      summary: "tools.isin.test.ts — 3 passed",
      payload: { suite: "tools.isin.test.ts", passed: 3, failed: 0 },
    },
    {
      delayMs: 800,
      type: "status",
      summary: "Opened draft PR for review",
      payload: {
        prUrl: "https://github.com/example-calastone/ops-tools/pull/42",
      },
    },
  ];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
