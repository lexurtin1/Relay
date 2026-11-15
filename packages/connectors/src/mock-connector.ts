import type {
  Connector,
  ConnectorHealth,
  ConnectorId,
  SourceDocument,
  SourceItem,
} from "@relay/core";
import { docsFor } from "./mock-corpus";
import { scoreDocument, toSourceItem } from "./score";

type SourceId = Exclude<ConnectorId, "ontology">;

export function createMockConnector(id: SourceId): Connector {
  const docs = docsFor(id);

  return {
    id,
    async search(query: string, opts?: { limit?: number }): Promise<SourceItem[]> {
      const limit = opts?.limit ?? 8;
      const ranked = docs
        .map((doc) => ({ doc, score: scoreDocument(query, doc) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      return ranked.map((row) => toSourceItem(row.doc, row.score));
    },
    async get(itemId: string): Promise<SourceDocument> {
      const doc = docs.find((d) => d.id === itemId);
      if (!doc) {
        throw new Error(`Mock ${id}: document not found: ${itemId}`);
      }
      return doc;
    },
    async health(): Promise<ConnectorHealth> {
      return {
        ok: true,
        mode: "mock",
        detail: `${docs.length} demo documents`,
      };
    },
  };
}
