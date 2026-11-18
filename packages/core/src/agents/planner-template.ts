/**
 * Deterministic Planner output used in mock mode, and as a fallback when the
 * AI Gateway is unreachable. Pure: no I/O, no clock, so it is safe to call from
 * the server seed, a server action, or the browser.
 */

export type PlannedRisk = "low" | "medium" | "high";

export interface PlannedStep {
  order: number;
  title: string;
  description: string;
  filesLikelyTouched: string[];
  testsToAdd: string[];
  riskLevel: PlannedRisk;
  needsConfirmation: boolean;
}

export interface PlanDraft {
  markdown: string;
  steps: PlannedStep[];
}

export interface PlanFeedback {
  body: string;
  anchorText?: string | null;
  authorName?: string;
}

export interface PlanTemplateInput {
  title: string;
  problemStatement: string;
  findings?: string | null;
  version?: number;
  /** Open review comments to fold into a revision. */
  feedback?: PlanFeedback[];
  /** Steps of the previous version, kept stable across revisions. */
  previousSteps?: PlannedStep[];
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "change"
  );
}

function sentence(value: string, max = 220): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}.`;
}

export function defaultPlanSteps(title: string): PlannedStep[] {
  const area = slug(title);
  return [
    {
      order: 1,
      title: "Confirm the read path",
      description:
        "Expose the data this change needs through a read-only tool, using the same company sources as Scout.",
      filesLikelyTouched: [`packages/mcp/src/tools/${area}.ts`],
      testsToAdd: [`packages/mcp/src/tools/${area}.test.ts`],
      riskLevel: "low",
      needsConfirmation: false,
    },
    {
      order: 2,
      title: "Build the change behind a flag",
      description:
        "Implement the smallest useful version, off by default, with a named owner for every write.",
      filesLikelyTouched: [`apps/ops/src/${area}/index.ts`, "packages/flags/src/index.ts"],
      testsToAdd: [`apps/ops/src/${area}/index.test.ts`],
      riskLevel: "medium",
      needsConfirmation: true,
    },
    {
      order: 3,
      title: "Measure and report",
      description:
        "Add a short weekly measure of time saved and errors avoided so the team can decide whether to widen it.",
      filesLikelyTouched: [`apps/ops/src/${area}/metrics.ts`],
      testsToAdd: [],
      riskLevel: "low",
      needsConfirmation: false,
    },
  ];
}

function renderMarkdown(
  input: PlanTemplateInput,
  steps: PlannedStep[],
  version: number,
): string {
  const lines: string[] = [];
  lines.push(`# Plan: ${input.title}`);
  lines.push("");
  lines.push("## Goal");
  lines.push(sentence(input.problemStatement));
  if (input.findings) {
    lines.push("");
    lines.push("## What Scout found");
    lines.push(sentence(input.findings, 320));
  }
  lines.push("");
  lines.push("## Steps");
  for (const step of steps) {
    lines.push(`${step.order}. ${step.title}: ${step.description}`);
  }
  if (input.feedback && input.feedback.length > 0) {
    lines.push("");
    lines.push(`## Changes in v${version}`);
    for (const item of input.feedback) {
      const who = item.authorName ? `${item.authorName}: ` : "";
      lines.push(`- ${who}${sentence(item.body, 160)}`);
    }
  }
  lines.push("");
  lines.push("## Guardrails");
  lines.push("No production data in the Runner workspace. Every write needs a named person.");
  return lines.join("\n");
}

/** Build a plan version. Revisions keep step order and note how feedback was addressed. */
export function draftPlanFromTemplate(input: PlanTemplateInput): PlanDraft {
  const version = input.version ?? 1;
  const base =
    input.previousSteps && input.previousSteps.length > 0
      ? input.previousSteps.map((s) => ({ ...s }))
      : defaultPlanSteps(input.title);

  const feedback = input.feedback ?? [];
  const placed = new Set<PlanFeedback>();
  const steps = base.map((step) => {
    const related = feedback.filter((f) => {
      if (!f.anchorText || placed.has(f)) return false;
      const anchor = f.anchorText.toLowerCase();
      return (
        step.title.toLowerCase().includes(anchor) ||
        step.description.toLowerCase().includes(anchor)
      );
    });
    if (related.length === 0) return step;
    related.forEach((r) => placed.add(r));
    return {
      ...step,
      description: `${step.description} Addressed: ${related
        .map((r) => sentence(r.body, 90))
        .join(" ")}`,
    };
  });

  const unplaced = feedback.filter((f) => !placed.has(f));
  if (unplaced.length > 0 && steps.length > 0) {
    const last = steps[steps.length - 1]!;
    steps[steps.length - 1] = {
      ...last,
      description: `${last.description} Also covers: ${unplaced
        .map((f) => sentence(f.body, 90))
        .join(" ")}`,
    };
  }

  return { markdown: renderMarkdown(input, steps, version), steps };
}

/** Parse a model reply of the form {"markdown": "...", "steps": [...]}. Returns null if unusable. */
export function parsePlanDraft(text: string): PlanDraft | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as {
      markdown?: unknown;
      steps?: unknown;
    };
    if (typeof raw.markdown !== "string" || !Array.isArray(raw.steps)) return null;
    const steps: PlannedStep[] = raw.steps
      .map((s, i): PlannedStep | null => {
        if (!s || typeof s !== "object") return null;
        const o = s as Record<string, unknown>;
        if (typeof o.title !== "string") return null;
        const risk = o.riskLevel === "high" || o.riskLevel === "medium" ? o.riskLevel : "low";
        return {
          order: i + 1,
          title: o.title,
          description: typeof o.description === "string" ? o.description : "",
          filesLikelyTouched: Array.isArray(o.filesLikelyTouched)
            ? o.filesLikelyTouched.filter((f): f is string => typeof f === "string")
            : [],
          testsToAdd: Array.isArray(o.testsToAdd)
            ? o.testsToAdd.filter((f): f is string => typeof f === "string")
            : [],
          riskLevel: risk,
          needsConfirmation: o.needsConfirmation === true,
        };
      })
      .filter((s): s is PlannedStep => s !== null);
    if (steps.length === 0) return null;
    return { markdown: raw.markdown, steps };
  } catch {
    return null;
  }
}
