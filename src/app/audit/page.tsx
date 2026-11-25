import { prisma, resolveWorkstreamColour } from "@relay/core";
import { AuditContainer } from "@/components/containers/metrics-audit-containers";
import { AuditView } from "@/components/audit-view";
import { isDemoMode } from "@/lib/db";
import type { AuditAction, AuditEntry } from "@/lib/demo-store/types";
import type { AuditRow } from "@/lib/demo-store/selectors";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (isDemoMode()) return <AuditContainer />;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });
  const workstreamIds = [...new Set(logs.map((row) => row.workstreamId).filter((id): id is string => Boolean(id)))];
  const workstreams = workstreamIds.length
    ? await prisma.workstream.findMany({
        where: { id: { in: workstreamIds } },
        select: { id: true, title: true, color: true },
      })
    : [];
  const byId = new Map(workstreams.map((ws) => [ws.id, ws]));

  const rows: AuditRow[] = logs.map((row) => {
    const ws = row.workstreamId ? byId.get(row.workstreamId) : undefined;
    const agent = row.user ? null : ("Runner" as const);
    const entry: AuditEntry = {
      id: row.id,
      at: row.createdAt.getTime(),
      action: row.action as AuditAction,
      userId: row.userId,
      agent,
      workstreamId: row.workstreamId,
      modelId: row.modelId,
      tokenInput: row.tokenInput,
      tokenOutput: row.tokenOutput,
      detail: row.detail ?? "",
    };
    return {
      ...entry,
      actorName: row.user?.name ?? "Runner",
      workstreamTitle: ws?.title ?? null,
      workstreamColor: ws ? resolveWorkstreamColour(ws.color) : null,
    };
  });

  return <AuditView rows={rows} />;
}
