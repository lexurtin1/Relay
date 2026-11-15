"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuditAction } from "@prisma/client";
import type { AuditRowView } from "@/lib/audit";
import { cn, formatRelativeTime } from "@/lib/utils";

const ACTIONS: Array<AuditAction | "all"> = [
  "all",
  "model_call",
  "approval",
  "hand_off",
  "connector_access",
  "role_switch",
  "seed",
];

export function AuditLogView(props: { rows: AuditRowView[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = (searchParams.get("action") as AuditAction | "all" | null) ?? "all";
  const q = searchParams.get("q") ?? "";

  function update(next: { action?: string; q?: string }) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const a = next.action ?? action;
    const query = next.q ?? q;
    if (!a || a === "all") params.delete("action");
    else params.set("action", a);
    if (!query.trim()) params.delete("q");
    else params.set("q", query.trim());
    const qs = params.toString();
    router.replace(qs ? `/audit?${qs}` : "/audit");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="m-0 text-sm text-[var(--relay-ink-muted)]">
          <Link href="/metrics" className="text-[var(--relay-brand-fg)] hover:underline">
            Metrics
          </Link>
          {" / "}
          Audit
        </p>
        <h1 className="mt-2 m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          Audit
        </h1>
        <p className="mt-2 max-w-[64ch] text-[17px] text-[var(--relay-ink-body)]">
          Approvals, hand-offs, model calls, connector access, and role switches. Filter by action
          or search detail text.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              className={cn("rl-chip", action === a && "rl-chip-on")}
              onClick={() => update({ action: a })}
            >
              {a === "all" ? "All actions" : a.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            update({ q: String(data.get("q") ?? "") });
          }}
        >
          <label className="sr-only" htmlFor="audit-q">
            Search audit
          </label>
          <input
            id="audit-q"
            name="q"
            defaultValue={q}
            className="rl-input min-w-0 flex-[1_1_240px]"
            placeholder="Search detail, user, or action…"
          />
          <button type="submit" className="rl-btn-second">
            Filter
          </button>
        </form>
      </div>

      <div className="rl-sheet overflow-x-auto p-2">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--relay-border)] text-[12px] uppercase tracking-[0.05em] text-[var(--relay-ink-subtle)]">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Detail</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-[var(--relay-ink-muted)]">
                  No audit rows match this filter.
                </td>
              </tr>
            ) : (
              props.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--relay-border)] align-top last:border-0"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-[var(--relay-ink-muted)]">
                    {formatRelativeTime(row.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-[8px] border border-[var(--relay-border)] px-1.5 py-0.5 text-[12px] capitalize text-[var(--relay-ink)]">
                      {row.action.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--relay-ink)]">
                    {row.userName ?? "System"}
                  </td>
                  <td className="px-3 py-3 text-[var(--relay-ink-body)]">
                    <div>{row.detail ?? "-"}</div>
                    {row.workstreamId ? (
                      <Link
                        href={`/workstreams/${row.workstreamId}`}
                        className="mt-1 inline-block font-mono text-[12px] text-[var(--relay-brand-fg)] hover:underline"
                      >
                        {row.workstreamId.slice(0, 12)}
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 tabular text-[var(--relay-ink-muted)]">
                    {row.tokens != null ? row.tokens.toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
