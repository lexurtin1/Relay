import { prisma } from "@relay/core";
import { withDatabase } from "@/lib/db";
import { getDemoOverviewData } from "@/lib/demo-data";

export async function listWorkstreamCommandItems() {
  return withDatabase(
    () =>
      prisma.workstream.findMany({
        select: { id: true, title: true, jiraKey: true, stage: true },
        orderBy: { lastActivityAt: "desc" },
      }),
    () => getDemoOverviewData().commandItems,
  );
}
