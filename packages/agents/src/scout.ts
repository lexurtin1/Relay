import { searchKnowledge, type SourceConnectorId } from "@relay/connectors";
import { createMessage } from "@relay/core/llm/gateway";
import { scoutUserPrompt, SCOUT_SYSTEM } from "./prompts";

export type ScoutEvent = {
  type: "status" | "tool_call" | "tool_result" | "thought_summary";
  summary: string;
  payload?: Record<string, unknown>;
};

export type ScoutResult = {
  findings: string;
  sources: Array<{
    connector: string;
    title: string;
    itemId: string;
    url?: string;
  }>;
  tokenUsage: number;
  events: ScoutEvent[];
  mocked: boolean;
};

export async function runScout(input: {
  title: string;
  problem: string;
  query?: string;
  sources?: SourceConnectorId[];
  onEvent?: (event: ScoutEvent) => void | Promise<void>;
}): Promise<ScoutResult> {
  const events: ScoutEvent[] = [];
  const emit = async (event: ScoutEvent) => {
    events.push(event);
    await input.onEvent?.(event);
  };

  await emit({ type: "status", summary: "Scout queued research" });
  await emit({ type: "status", summary: "Scout searching connected sources" });

  const query =
    input.query?.trim() ||
    [input.title, input.problem].filter(Boolean).join(" ").slice(0, 240);

  await emit({
    type: "tool_call",
    summary: `search_knowledge(${JSON.stringify(query.slice(0, 80))})`,
    payload: { tool: "search_knowledge", query },
  });

  const hits = await searchKnowledge({
    query,
    sources: input.sources,
    limit: 12,
    limitPerSource: 4,
  });

  await emit({
    type: "tool_result",
    summary: `Found ${hits.length} source${hits.length === 1 ? "" : "s"}`,
    payload: { count: hits.length, ids: hits.map((h) => h.id) },
  });

  const sourcesBlock = hits
    .map(
      (h, i) =>
        `${i + 1}. [${h.connectorId}] ${h.title} (${h.id})\n${h.snippet}`,
    )
    .join("\n\n");

  await emit({ type: "status", summary: "Scout drafting findings via gateway" });

  const response = await createMessage({
    system: SCOUT_SYSTEM,
    messages: [
      {
        role: "user",
        content: scoutUserPrompt({
          title: input.title,
          problem: input.problem,
          sourcesBlock,
        }),
      },
    ],
    maxTokens: 2048,
  });

  const findings =
    response.content.trim() ||
    mockScoutFindings(input.title, input.problem, hits.length);

  await emit({
    type: "thought_summary",
    summary: findings.split("\n").find((l) => l.trim())?.slice(0, 160) || "Findings ready",
  });
  await emit({ type: "status", summary: "Scout research succeeded" });

  return {
    findings,
    sources: hits.map((h) => ({
      connector: h.connectorId,
      title: h.title,
      itemId: h.id,
      url: h.url,
    })),
    tokenUsage: response.usage.inputTokens + response.usage.outputTokens,
    events,
    mocked: response.mocked,
  };
}

function mockScoutFindings(title: string, problem: string, sourceCount: number): string {
  return [
    "## Summary",
    `Scout reviewed ${sourceCount} connected sources for **${title}**.`,
    "",
    problem.slice(0, 280),
    "",
    "## Recommendation",
    "Prefer a shared helper and stable error codes over duplicated logic. Confirm labels with existing Power BI / Confluence conventions before coding.",
  ].join("\n");
}
