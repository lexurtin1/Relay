import Link from "next/link";
import { getOverviewData } from "@/lib/overview";
import { WorkstreamsTable } from "@/components/overview";

export const dynamic = "force-dynamic";

export default async function WorkstreamsPage() {
  const data = await getOverviewData();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--relay-ink)]">
            Workstreams
          </h1>
          <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
            All active and recent work across Innovation and Strategy.
          </p>
        </div>
        <Link
          href="/workstreams/new"
          className="rounded-xl bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-white transition-relay hover:bg-[var(--relay-primary-hover)]"
        >
          New workstream
        </Link>
      </div>
      <WorkstreamsTable rows={data.rows} />
    </div>
  );
}
