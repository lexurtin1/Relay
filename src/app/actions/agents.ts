"use server";

import { createMessage } from "@relay/core/llm/gateway";
import {
  draftPlanFromTemplate,
  parsePlanDraft,
  type PlanDraft,
  type PlanTemplateInput,
} from "@relay/core/agents/planner-template";

export type DraftPlanResult = {
  draft: PlanDraft;
  modelId: string;
  usage: { inputTokens: number; outputTokens: number };
  mocked: boolean;
};

const SYSTEM = [
  "You are the Planner in Relay, an internal agent workspace.",
  "Turn research findings and review comments into a short implementation plan.",
  "Reply with JSON only: {\"markdown\": string, \"steps\": [{\"title\", \"description\", \"filesLikelyTouched\", \"testsToAdd\", \"riskLevel\", \"needsConfirmation\"}]}.",
  "Three to five steps. No production data. Every write needs a named person.",
].join(" ");

/**
 * Stateless Planner call. Works without a database, so the demo store on
 * Vercel can use it. In mock mode the gateway echoes the prompt, so the
 * deterministic template supplies the plan and the gateway supplies usage.
 */
export async function draftPlan(input: PlanTemplateInput): Promise<DraftPlanResult> {
  const template = draftPlanFromTemplate(input);
  const prompt = [
    `Title: ${input.title}`,
    `Problem: ${input.problemStatement}`,
    input.findings ? `Findings: ${input.findings}` : "",
    input.feedback?.length
      ? `Review comments:\n${input.feedback.map((f) => `- ${f.body}`).join("\n")}`
      : "",
    input.previousSteps?.length
      ? `Previous steps:\n${input.previousSteps.map((s) => `${s.order}. ${s.title}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await createMessage({
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2_000,
    });
    const parsed = response.mocked ? null : parsePlanDraft(response.content);
    return {
      draft: parsed ?? template,
      modelId: response.model,
      usage: response.usage,
      mocked: response.mocked,
    };
  } catch {
    return {
      draft: template,
      modelId: "template",
      usage: { inputTokens: Math.ceil(prompt.length / 4), outputTokens: Math.ceil(template.markdown.length / 4) },
      mocked: true,
    };
  }
}
