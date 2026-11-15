import type { PlanStepDraft, ScoutResult } from "@relay/agents";

export type DemoAgentEvent = {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
};

export type DemoWorkstreamAgentState = {
  stage?: string;
  researchSummary?: string | null;
  sources?: Array<{ connector: string; title: string; itemId?: string }>;
  history?: Array<{ id: string; label: string; at: string }>;
  events?: DemoAgentEvent[];
  planMarkdown?: string | null;
  planSteps?: PlanStepDraft[];
  planVersion?: number;
  researchStatus?: "idle" | "running" | "succeeded" | "failed";
  planStatus?: "idle" | "running" | "succeeded" | "failed";
};

const globalStore = globalThis as typeof globalThis & {
  __relayDemoAgentStore?: Map<string, DemoWorkstreamAgentState>;
};

function store(): Map<string, DemoWorkstreamAgentState> {
  if (!globalStore.__relayDemoAgentStore) {
    globalStore.__relayDemoAgentStore = new Map();
  }
  return globalStore.__relayDemoAgentStore;
}

export function getDemoAgentState(id: string): DemoWorkstreamAgentState {
  return store().get(id) ?? {};
}

export function patchDemoAgentState(
  id: string,
  patch: Partial<DemoWorkstreamAgentState>,
): DemoWorkstreamAgentState {
  const next = { ...getDemoAgentState(id), ...patch };
  store().set(id, next);
  return next;
}

export function appendDemoEvent(
  id: string,
  event: Omit<DemoAgentEvent, "id" | "createdAt"> & { id?: string },
): DemoAgentEvent {
  const row: DemoAgentEvent = {
    id: event.id ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: event.type,
    summary: event.summary,
    createdAt: new Date().toISOString(),
  };
  const state = getDemoAgentState(id);
  const events = [...(state.events ?? []), row];
  patchDemoAgentState(id, { events });
  return row;
}

export function applyScoutToDemo(id: string, result: ScoutResult): void {
  const now = new Date().toISOString();
  patchDemoAgentState(id, {
    researchStatus: "succeeded",
    researchSummary: result.findings,
    sources: result.sources.map((s) => ({
      connector: s.connector,
      title: s.title,
      itemId: s.itemId,
    })),
    stage: "research",
    history: [
      { id: `h_research_${Date.now()}`, label: "Research completed", at: now },
      ...(getDemoAgentState(id).history ?? []),
    ],
  });
}
