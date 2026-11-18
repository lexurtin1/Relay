import { Suspense } from "react";
import { KnowledgeChat } from "@/components/knowledge-chat";
import {
  getConnectorHealth,
  runKnowledgeSearch,
  type SourceConnectorId,
} from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; source?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = (params.q ?? "").trim();
  const source = (params.source ?? "All").trim() || "All";

  const health = await getConnectorHealth();
  const sources: SourceConnectorId[] | undefined =
    source !== "All" ? [source as SourceConnectorId] : undefined;
  const initialResults = query
    ? await runKnowledgeSearch({ query, sources })
    : [];

  return (
    <Suspense fallback={<KnowledgeFallback />}>
      <KnowledgeChat
        initialQuery={query}
        initialSource={source}
        health={health}
        initialResults={initialResults}
      />
    </Suspense>
  );
}

function KnowledgeFallback() {
  return (
    <div className="rl-knowledge-chat flex min-h-0 flex-1 items-center justify-center text-[var(--relay-ink-muted)]">
      Loading knowledge…
    </div>
  );
}
