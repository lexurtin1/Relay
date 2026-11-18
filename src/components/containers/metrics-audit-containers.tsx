"use client";

import { AuditView } from "@/components/audit-view";
import { MetricsView } from "@/components/metrics-view";
import { useDemo } from "@/lib/demo-store/provider";
import { selectAudit, selectMetrics } from "@/lib/demo-store/selectors";

export function MetricsContainer() {
  const metrics = useDemo((s) => selectMetrics(s, Date.now()));
  return <MetricsView metrics={metrics} />;
}

export function AuditContainer() {
  const rows = useDemo(selectAudit);
  return <AuditView rows={rows} />;
}
