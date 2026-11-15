import { Suspense } from "react";
import type { AuditAction } from "@prisma/client";
import { AuditLogView } from "@/components/audit-log";
import { listAuditLogs } from "@/lib/audit";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  const params = searchParams ? await searchParams : {};
  const rows = await listAuditLogs({
    action: (params.action as AuditAction | "all" | undefined) ?? "all",
    q: params.q,
  });

  return (
    <Suspense fallback={<p className="text-[var(--relay-ink-muted)]">Loading audit…</p>}>
      <AuditLogView rows={rows} />
    </Suspense>
  );
}
