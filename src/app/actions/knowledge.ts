"use server";

import { recordAudit } from "@/lib/audit";
import {
  runKnowledgeSearch,
  type SourceConnectorId,
  type SourceItem,
} from "@/lib/knowledge";
import { getCurrentUser } from "@/lib/session";

export async function searchKnowledgeAction(input: {
  query: string;
  sources?: SourceConnectorId[];
}): Promise<SourceItem[]> {
  const results = await runKnowledgeSearch(input);
  const user = await getCurrentUser();
  const sources =
    input.sources && input.sources.length > 0
      ? input.sources.join(", ")
      : "all connectors";
  await recordAudit({
    action: "connector_access",
    userId: user?.id ?? null,
    userName: user?.name ?? null,
    detail: `Knowledge search "${input.query.trim().slice(0, 80)}" via ${sources} (${results.length} hits)`,
    connectorItemsAccessed: results.slice(0, 12).map((item) => ({
      id: item.id,
      connectorId: item.connectorId,
      title: item.title,
    })),
  });
  return results;
}
