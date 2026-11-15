import { createMessage } from "@relay/core/llm/gateway";
import { plannerUserPrompt, PLANNER_SYSTEM } from "./prompts";

export type PlannerEvent = {
  type: "status" | "thought_summary";
  summary: string;
  payload?: Record<string, unknown>;
};

export type PlanStepDraft = {
  order: number;
  title: string;
  description: string;
  filesLikelyTouched: string[];
  testsToAdd: string[];
  riskLevel: "low" | "medium" | "high";
};

export type PlannerResult = {
  markdownBody: string;
  steps: PlanStepDraft[];
  tokenUsage: number;
  events: PlannerEvent[];
  mocked: boolean;
};

export async function runPlanner(input: {
  title: string;
  problem: string;
  findings: string;
  version?: number;
  comments?: Array<{ body: string; anchorText?: string | null; authorName?: string }>;
  onEvent?: (event: PlannerEvent) => void | Promise<void>;
}): Promise<PlannerResult> {
  const events: PlannerEvent[] = [];
  const emit = async (event: PlannerEvent) => {
    events.push(event);
    await input.onEvent?.(event);
  };

  const version = input.version ?? 1;
  const fromComments = (input.comments?.length ?? 0) > 0;
  await emit({
    type: "status",
    summary: fromComments
      ? `Planner revising plan to v${version} from comments`
      : `Planner drafting plan v${version}`,
  });

  const commentsBlock = (input.comments ?? [])
    .map((c, i) => {
      const anchor = c.anchorText ? ` (on "${c.anchorText}")` : "";
      const who = c.authorName ? `${c.authorName}: ` : "";
      return `${i + 1}. ${who}${c.body}${anchor}`;
    })
    .join("\n");

  const response = await createMessage({
    system: PLANNER_SYSTEM,
    messages: [
      {
        role: "user",
        content: plannerUserPrompt({
          title: input.title,
          problem: input.problem,
          findings: input.findings,
          version,
          commentsBlock,
        }),
      },
    ],
    maxTokens: 3072,
  });

  const markdownBody =
    response.content.trim() ||
    mockPlanMarkdown(input.title, input.problem, version, fromComments);
  const steps = extractSteps(markdownBody);

  await emit({
    type: "thought_summary",
    summary: `Drafted ${steps.length} implementation steps`,
  });
  await emit({
    type: "status",
    summary: fromComments
      ? `Planner plan v${version} ready from comments`
      : `Planner plan v${version} ready`,
  });

  return {
    markdownBody,
    steps,
    tokenUsage: response.usage.inputTokens + response.usage.outputTokens,
    events,
    mocked: response.mocked,
  };
}

function extractSteps(markdown: string): PlanStepDraft[] {
  const lines = markdown.split("\n");
  const steps: PlanStepDraft[] = [];
  const stepRe = /^\s*\d+\.\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(stepRe);
    if (!match?.[1]) continue;
    const title = match[1].replace(/\*\*/g, "").trim();
    if (title.length < 3) continue;
    steps.push({
      order: steps.length + 1,
      title: title.slice(0, 120),
      description: title,
      filesLikelyTouched: guessFiles(title),
      testsToAdd: guessTests(title),
      riskLevel: /test|doc/i.test(title) ? "low" : /api|auth|migrat/i.test(title) ? "high" : "medium",
    });
    if (steps.length >= 5) break;
  }

  if (steps.length === 0) {
    return [
      {
        order: 1,
        title: "Spike shared helper",
        description: "Extract shared logic into a module.",
        filesLikelyTouched: ["packages/mcp/src/helper.ts"],
        testsToAdd: ["helper.test.ts"],
        riskLevel: "medium",
      },
      {
        order: 2,
        title: "Wire tool or API surface",
        description: "Expose the helper through the agreed interface.",
        filesLikelyTouched: ["packages/mcp/src/tools.ts"],
        testsToAdd: ["tools.test.ts"],
        riskLevel: "medium",
      },
      {
        order: 3,
        title: "Tests and docs",
        description: "Add unit tests and a short usage note.",
        filesLikelyTouched: ["README.md"],
        testsToAdd: [],
        riskLevel: "low",
      },
    ];
  }

  return steps;
}

function guessFiles(title: string): string[] {
  if (/test/i.test(title)) return [];
  if (/doc/i.test(title)) return ["README.md"];
  if (/isin/i.test(title)) return ["packages/mcp/src/isin.ts"];
  return ["packages/mcp/src/tools.ts"];
}

function guessTests(title: string): string[] {
  if (/doc/i.test(title)) return [];
  if (/isin/i.test(title)) return ["isin.test.ts"];
  return ["tools.test.ts"];
}

function mockPlanMarkdown(
  title: string,
  problem: string,
  version = 1,
  fromComments = false,
): string {
  return [
    `# Plan: ${title}`,
    "",
    "## Goal",
    problem.slice(0, 240) || "Deliver a small, reviewable change.",
    fromComments
      ? "Address open review comments while keeping the change small and testable."
      : "",
    "",
    `## Steps (v${version})`,
    "1. Extract shared helper module",
    "2. Register the tool or API with structured errors",
    "3. Add unit tests for happy path and edge cases",
    "4. Document usage in Confluence / README",
    "",
    "## Risks",
    "- **medium** — callers may expect different error shapes",
    "- **low** — documentation drift",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
}
