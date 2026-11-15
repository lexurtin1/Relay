import {
  healthAll,
  searchKnowledge,
  type ConnectorHealthRow,
  type SourceConnectorId,
} from "@relay/connectors";
import type { SourceItem } from "@relay/core";

export type { ConnectorHealthRow, SourceConnectorId, SourceItem };
export { connectorLabel, listConnectorIds } from "@/lib/knowledge-shared";

export async function getConnectorHealth(): Promise<ConnectorHealthRow[]> {
  return healthAll();
}

export async function runKnowledgeSearch(input: {
  query: string;
  sources?: SourceConnectorId[];
}): Promise<SourceItem[]> {
  return searchKnowledge({
    query: input.query,
    sources: input.sources,
    limit: 24,
    limitPerSource: 6,
  });
}
