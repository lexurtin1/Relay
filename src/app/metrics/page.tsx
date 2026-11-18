import Link from "next/link";
import { CommandBar } from "@/components/command-bar";

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <CommandBar defaultMode="find" />

      <div>
        <h1 className="m-0 text-[clamp(26px,3vw,36px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          Metrics
        </h1>
        <p className="mt-2 max-w-[68ch] text-[var(--relay-ink-muted)]">
          Cycle-time and token charts arrive in Milestone 6.
        </p>
      </div>

      <div className="rl-sheet p-6 text-sm text-[var(--relay-ink-body)]">
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
      </div>
    </div>
  );
}
