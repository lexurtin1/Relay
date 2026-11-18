import { AuditContainer } from "@/components/containers/metrics-audit-containers";
import { AuditView } from "@/components/audit-view";
import { isDemoMode } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AuditPage() {
  return isDemoMode() ? <AuditContainer /> : <AuditView rows={null} />;
}
