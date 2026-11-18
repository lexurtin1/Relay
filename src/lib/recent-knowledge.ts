/** Client-side log of Overview / Start work searches for Knowledge. */

export const RECENT_KNOWLEDGE_KEY = "relay-recent-knowledge";

export type RecentKnowledgeEntry = {
  id: string;
  query: string;
  at: string;
  sourceCount: number;
  sources: Array<{ title: string; connector: string }>;
};

export function readRecentKnowledge(): RecentKnowledgeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RECENT_KNOWLEDGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentKnowledgeEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeRecentKnowledge(entry: RecentKnowledgeEntry) {
  if (typeof window === "undefined") return;
  const prev = readRecentKnowledge().filter((e) => e.query !== entry.query);
  const next = [entry, ...prev].slice(0, 12);
  window.sessionStorage.setItem(RECENT_KNOWLEDGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("relay-recent-knowledge"));
}
