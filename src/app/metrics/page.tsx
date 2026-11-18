import { MetricsContainer } from "@/components/containers/metrics-audit-containers";
import { MetricsView } from "@/components/metrics-view";
import { isDemoMode } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function MetricsPage() {
  return isDemoMode() ? <MetricsContainer /> : <MetricsView metrics={null} />;
}
