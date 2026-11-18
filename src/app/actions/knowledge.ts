"use server";

import { prisma } from "@relay/core";
import { AuditAction } from "@prisma/client";
import {
  runKnowledgeSearch,
  type SourceConnectorId,
  type SourceItem,
} from "@/lib/knowledge";
import { getCurrentUser } from "@/lib/session";
import { useDemoFixtures } from "@/lib/db";

export async function searchKnowledgeAction(input: {
  query: string;
  sources?: SourceConnectorId[];
  log?: boolean;
}): Promise<SourceItem[]> {
  const items = await runKnowledgeSearch(input);

  if (input.log !== false && input.query.trim()) {
    await logKnowledgeSearch(input.query.trim(), items);
  }

  return items;
}

async function logKnowledgeSearch(query: string, items: SourceItem[]) {
  if (useDemoFixtures()) return;
  try {
    const user = await getCurrentUser();
    await prisma.auditLog.create({
      data: {
        action: AuditAction.connector_access,
        userId: user?.id,
        detail: `Knowledge search: ${query}`,
        connectorItemsAccessed: items.slice(0, 12).map((item) => ({
          connector: item.connectorId,
          title: item.title,
          itemId: item.id,
        })),
      },
    });
  } catch {
    // Search still succeeds if audit write fails (e.g. no DB).
  }
}
