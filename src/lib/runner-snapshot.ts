import { parseRunnerInstructions } from "@relay/core/runner/instructions";
import type { RunnerView } from "@/lib/view-models";

export type RunnerEventRow = {
  type: string;
  payload: unknown;
  createdAt: Date | string;
};

export type RunnerQuestionRow = {
  questionText: string;
  options: string[];
  answer: string | null;
  answeredByName?: string | null;
};

export type RunnerJobRow = {
  status: string;
  branch: string | null;
  prUrl: string | null;
  additionalInstructions: string | null;
  events: RunnerEventRow[];
  questions: RunnerQuestionRow[];
};

const KINDS = new Set<RunnerView["log"][number]["kind"]>(["info", "tool", "test", "question", "answer", "pr"]);

function payloadOf(event: RunnerEventRow): { text?: string; kind?: string } {
  if (!event.payload || typeof event.payload !== "object") return {};
  return event.payload as { text?: string; kind?: string };
}

function lineText(event: RunnerEventRow): string {
  const text = payloadOf(event).text;
  if (typeof text === "string" && text.trim()) return text;
  return event.type.replaceAll("_", " ");
}

function lineKind(event: RunnerEventRow): RunnerView["log"][number]["kind"] {
  const kind = payloadOf(event).kind;
  if (kind && KINDS.has(kind as RunnerView["log"][number]["kind"])) {
    return kind as RunnerView["log"][number]["kind"];
  }
  switch (event.type) {
    case "tool_call":
    case "tool_result":
    case "file_edit":
      return "tool";
    case "test_run":
      return "test";
    case "question":
      return "question";
    case "answer":
      return "answer";
    default:
      return "info";
  }
}

export function toRunnerView(job: RunnerJobRow, stepsCompleted: number, stepsTotal: number): RunnerView {
  const instructions = parseRunnerInstructions(job.additionalInstructions);
  const open = job.questions.find((question) => !question.answer);
  const question = open ?? job.questions[job.questions.length - 1] ?? null;
  const hasPr = Boolean(job.prUrl);
  const status: RunnerView["status"] =
    job.status === "awaiting_input" || job.status === "failed" || job.status === "cancelled"
      ? "awaiting_input"
      : job.status === "succeeded"
        ? hasPr
          ? "pr_open"
          : "merged"
        : job.status === "provisioning" || job.status === "queued"
          ? "provisioning"
          : "running";

  return {
    status,
    model: instructions.model,
    profile: instructions.profile,
    branch: job.branch ?? "relay/runner",
    context: instructions.context,
    log: job.events.map((event) => ({
      at: typeof event.createdAt === "string" ? event.createdAt : event.createdAt.toISOString(),
      text: lineText(event),
      kind: lineKind(event),
    })),
    question: question
      ? {
          text: question.questionText,
          options: question.options,
          answer: question.answer,
          answeredBy: question.answeredByName ?? null,
        }
      : null,
    pr: job.prUrl ? { number: 1, checks: "passed" } : null,
    stepsCompleted,
    stepsTotal,
  };
}

export function runnerIsWorking(status: string): boolean {
  return status === "queued" || status === "provisioning" || status === "running";
}
