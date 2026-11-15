import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function MetricsPage() {
  return (
    <PlaceholderPage
      title="Metrics"
      body="Cycle-time and token charts arrive in Milestone 6."
      footer={
        <div className="flex flex-col gap-3">
          <p className="m-0">
            Agent and person time share, plus per-workstream bars, will live here.
          </p>
          <section aria-labelledby="rl-audit-h">
            <h2 id="rl-audit-h" className="m-0 text-base font-medium text-[var(--relay-ink)]">
              Audit log
            </h2>
            <p className="mt-1 text-[var(--relay-ink-muted)]">
              Approvals, hand-offs and model calls are recorded for compliance review.{" "}
              <Link href="/audit" className="text-[var(--relay-brand-fg)] hover:underline">
                Open Audit
              </Link>
            </p>
          </section>
        </div>
      }
    />
  );
}
