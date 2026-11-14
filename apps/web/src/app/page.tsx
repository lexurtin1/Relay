import {
  AgentsRunningPanel,
  NeedsActionPanel,
  OverviewHeader,
  StatsRow,
  WorkstreamsTable,
} from "@/components/overview";
import { getCurrentUser } from "@/lib/session";
import { getOverviewData } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--relay-border)] bg-white p-6 text-sm text-[var(--relay-ink-muted)]">
        No seeded users found. Run <code className="font-mono">pnpm db:seed</code> or start with
        Docker Compose.
      </div>
    );
  }

  const data = await getOverviewData();

  return (
    <div className="space-y-4">
      <OverviewHeader
        workstreamCount={data.workstreamCount}
        agentsActive={data.agentsActive}
      />
      <StatsRow stats={data.stats} />
      <div className="grid gap-4 lg:grid-cols-2">
        <NeedsActionPanel items={data.needsAction} />
        <AgentsRunningPanel items={data.agentsRunning} />
      </div>
      <WorkstreamsTable rows={data.rows} />
    </div>
  );
}
