import type { Connector, ConnectorHealth, SourceItem } from "@relay/core";
import { config, isMockMode } from "@relay/core";
import {
  CONNECTOR_LABELS,
  SOURCE_CONNECTOR_IDS,
  connectorLabel,
  type SourceConnectorId,
} from "./ids";
import { createLiveConnector } from "./live-connector";
import { createMockConnector } from "./mock-connector";

export type { SourceConnectorId };
export { SOURCE_CONNECTOR_IDS, CONNECTOR_LABELS, connectorLabel };

export function listConnectorIds(): SourceConnectorId[] {
  return [...SOURCE_CONNECTOR_IDS];
}

export function getConnectorMode(): "mock" | "live" {
  return isMockMode() || config.relayMode !== "live" ? "mock" : "live";
}

const cache = new Map<SourceConnectorId, Connector>();

export function getConnector(id: SourceConnectorId): Connector {
  const existing = cache.get(id);
  if (existing) return existing;

  const mode = getConnectorMode();
  const connector =
    mode === "live" ? createLiveConnector(id) : createMockConnector(id);
  cache.set(id, connector);
  return connector;
}

/** Clear cached connectors (tests / mode switches). */
export function resetConnectorCache(): void {
  cache.clear();
}

export type ConnectorHealthRow = {
  id: SourceConnectorId;
  ok: boolean;
  mode: "mock" | "live";
  detail?: string;
  label: string;
};

export async function healthAll(): Promise<ConnectorHealthRow[]> {
  const rows = await Promise.all(
    listConnectorIds().map(async (id) => {
      const health: ConnectorHealth = await getConnector(id).health();
      return {
        id,
        ok: health.ok,
        mode: health.mode,
        detail: health.detail,
        label: connectorLabel(id),
      };
    }),
  );
  return rows;
}

export type KnowledgeSearchOptions = {
  query: string;
  sources?: SourceConnectorId[];
  limitPerSource?: number;
  limit?: number;
};

export async function searchKnowledge(
  opts: KnowledgeSearchOptions,
): Promise<SourceItem[]> {
  const query = opts.query.trim();
  const sources = opts.sources?.length ? opts.sources : listConnectorIds();
  const limitPerSource = opts.limitPerSource ?? 5;
  const limit = opts.limit ?? 20;

  if (!query) return [];

  const batches = await Promise.all(
    sources.map((id) => getConnector(id).search(query, { limit: limitPerSource })),
  );

  return batches
    .flat()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

export { MOCK_CORPUS, allMockDocs } from "./mock-corpus";
