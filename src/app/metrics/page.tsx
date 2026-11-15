import { MetricsDashboard } from "@/components/metrics-dashboard";
import { getMetricsSnapshot } from "@/lib/metrics";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  const data = await getMetricsSnapshot();
  return <MetricsDashboard data={data} />;
}
