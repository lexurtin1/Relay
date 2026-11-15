import { OverviewPageView } from "@/components/overview";
import { getCurrentUser } from "@/lib/session";
import { getOverviewData } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="rl-sheet p-6 text-sm text-[var(--relay-ink-muted)]">
        No seeded users found. Run <code className="font-mono">pnpm db:seed</code> or start with
        Docker Compose.
      </div>
    );
  }

  const data = await getOverviewData();

  return (
    <OverviewPageView
      stats={data.stats}
      needsAction={data.needsAction}
      rows={data.rows}
      workstreamCount={data.workstreamCount}
      agentsActive={data.agentsActive}
    />
  );
}
