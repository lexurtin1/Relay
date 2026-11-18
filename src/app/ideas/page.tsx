import Link from "next/link";
import { CommandBar } from "@/components/command-bar";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const draft = (params.draft ?? "").trim();

  return (
    <div className="flex flex-col gap-6">
      <CommandBar defaultMode="idea" initialDraft={draft} />

      <div>
        <h1 className="m-0 text-[clamp(26px,3vw,36px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          Ideas
        </h1>
        <p className="mt-2 max-w-[68ch] text-[var(--relay-ink-muted)]">
          Friction log and external signals land in Milestone 6. Seed data already includes six
          ideas. Use the bar above to capture a draft.
        </p>
      </div>

      <div className="rl-sheet p-6 text-sm text-[var(--relay-ink-body)]">
        <p className="m-0">
          This surface ships in a later milestone. Use{" "}
          <Link href="/" className="text-[var(--relay-brand-fg)] hover:underline">
            Overview
          </Link>{" "}
          to continue working.
        </p>
      </div>
    </div>
  );
}
