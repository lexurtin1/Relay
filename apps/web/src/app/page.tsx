import { DashboardTopBar, WorkstreamBoard } from "@/components/dashboard";
import { getAppName } from "@/lib/config";
import { getCurrentUser } from "@/lib/session";
import { getDashboardData } from "@/lib/workstreams";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const appName = getAppName();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="rounded border border-[var(--relay-border)] bg-white p-6 text-sm text-[var(--relay-ink-muted)]">
        No seeded users found. Run <code>pnpm db:seed</code> or start with Docker Compose.
      </div>
    );
  }

  const { cards, counts } = await getDashboardData();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--relay-ink)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
            {appName} workstreams for Innovation and Strategy. Signed in as {user.name}.
          </p>
        </div>
      </div>
      <DashboardTopBar counts={counts} />
      <WorkstreamBoard cards={cards} />
    </div>
  );
}
