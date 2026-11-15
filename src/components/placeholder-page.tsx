import type { ReactNode } from "react";
import Link from "next/link";

export function PlaceholderPage(props: {
  title: string;
  body: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          {props.title}
        </h1>
        <p className="mt-2 max-w-[68ch] text-[var(--relay-ink-muted)]">{props.body}</p>
      </div>
      <div className="rl-sheet p-6 text-sm text-[var(--relay-ink-body)]">
        {props.footer ?? (
          <p className="m-0">
            This surface ships in a later milestone. Use{" "}
            <Link href="/" className="text-[var(--relay-brand-fg)] hover:underline">
              Overview
            </Link>{" "}
            to continue working.
          </p>
        )}
      </div>
    </div>
  );
}
