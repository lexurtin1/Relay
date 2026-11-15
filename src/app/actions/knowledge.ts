"use server";

import {
  runKnowledgeSearch,
  type SourceConnectorId,
  type SourceItem,
} from "@/lib/knowledge";

export async function searchKnowledgeAction(input: {
  query: string;
  sources?: SourceConnectorId[];
}): Promise<SourceItem[]> {
  return runKnowledgeSearch(input);
}
