export const SCOUT_SYSTEM = `You are Scout, a research agent for Relay (SS&C Calastone Innovation and Strategy).
You search internal knowledge sources and produce concise findings.
Use only the provided source snippets. Do not invent real clients or production systems.
Respond in markdown with: Summary, Sources, Recommendation.`;

export const PLANNER_SYSTEM = `You are Planner, an implementation planner for Relay.
Given a problem statement and Scout findings, draft a concrete implementation plan.
Do not invent real Calastone clients. Keep steps small and testable.
Respond in markdown with: Goal, Steps (numbered, each with files and tests), Risks.`;

export function scoutUserPrompt(input: {
  title: string;
  problem: string;
  sourcesBlock: string;
}): string {
  return [
    `Workstream: ${input.title}`,
    "",
    "Problem:",
    input.problem,
    "",
    "Sources consulted:",
    input.sourcesBlock || "(none)",
    "",
    "Write research findings for the engineer.",
  ].join("\n");
}

export function plannerUserPrompt(input: {
  title: string;
  problem: string;
  findings: string;
  version?: number;
  commentsBlock?: string;
}): string {
  const version = input.version ?? 1;
  const lines = [
    `Workstream: ${input.title}`,
    "",
    "Problem:",
    input.problem,
    "",
    "Scout findings:",
    input.findings,
  ];

  if (input.commentsBlock?.trim()) {
    lines.push("", "Open review comments to address:", input.commentsBlock.trim());
  }

  lines.push(
    "",
    `Draft implementation plan v${version} with 3 to 5 steps.`,
    input.commentsBlock?.trim()
      ? "Incorporate the review comments explicitly in the steps."
      : "",
  );

  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}
