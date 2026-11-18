import type { ResearchStepView } from "@/components/research-activity";

type EventLike = {
  id: string;
  type: string;
  payload: unknown;
};

export function buildResearchStepsFromEvents(
  events: EventLike[],
  sources: Array<{ connector: string; title: string }>,
): { steps: ResearchStepView[]; liveToolsLine: string | null } {
  const chronological = [...events].reverse();
  const statusEvents = chronological.filter((e) => e.type === "status");
  const toolCalls = chronological.filter((e) => e.type === "tool_call");

  const steps: ResearchStepView[] = statusEvents.map((event, index) => {
    const payload = (event.payload ?? {}) as {
      text?: string;
      summary?: string;
      message?: string;
    };
    const title =
      payload.text ?? payload.summary ?? payload.message ?? `Research step ${index + 1}`;
    const relatedTools = toolCalls
      .slice(index, index + 2)
      .map((t) => {
        const p = (t.payload ?? {}) as { tool?: string; query?: string };
        return p.tool ? `${p.tool}${p.query ? `(${p.query})` : ""}` : null;
      })
      .filter(Boolean);

    const sourceHint =
      sources[index]?.title ??
      sources.map((s) => s.title).slice(0, 2).join(", ") ??
      null;

    return {
      id: event.id,
      title,
      rationale:
        relatedTools.length > 0
          ? `Checking company MCP connectors for related context.`
          : "Interpreting prior findings against the problem statement.",
      disclosureLabel:
        relatedTools.length > 0
          ? "Searching connectors"
          : sourceHint
            ? "Read files"
            : undefined,
      disclosureDetail:
        relatedTools.length > 0
          ? relatedTools.join(" · ")
          : sourceHint
            ? sourceHint
            : undefined,
    };
  });

  if (steps.length === 0 && sources.length > 0) {
    for (const [i, source] of sources.entries()) {
      steps.push({
        id: `source-${source.connector}-${i}`,
        title: `Researching ${source.title}`,
        rationale: `Using the ${source.connector} connector shared with the company chatbot.`,
        disclosureLabel: "Searching connectors",
        disclosureDetail: `${source.connector}.search`,
      });
    }
  }

  const liveTools = toolCalls
    .map((t) => {
      const p = (t.payload ?? {}) as { tool?: string };
      return p.tool;
    })
    .filter(Boolean)
    .slice(-3);

  return {
    steps,
    liveToolsLine: liveTools.length > 0 ? liveTools.join("… ") : null,
  };
}
