import type { SourceDocument, SourceItem } from "@relay/core";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/** Simple lexical score for mock search. Higher is better. */
export function scoreDocument(query: string, doc: SourceDocument): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0.15;

  const hay = `${doc.title}\n${doc.body}\n${JSON.stringify(doc.metadata ?? {})}`.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) hits += 1;
    if (doc.title.toLowerCase().includes(token)) hits += 0.5;
  }
  return hits / tokens.length;
}

export function toSourceItem(doc: SourceDocument, score: number): SourceItem {
  const snippet =
    doc.body.length > 180 ? `${doc.body.slice(0, 177).trimEnd()}…` : doc.body;
  return {
    id: doc.id,
    connectorId: doc.connectorId,
    title: doc.title,
    snippet,
    url: doc.url,
    score,
    metadata: doc.metadata,
  };
}
