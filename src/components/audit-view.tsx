"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bot, Download } from "lucide-react";
import { ColourDot } from "@/components/colour-dot";
import { PageHero } from "@/components/page-hero";
import { Avatar, Badge, EmptyState, Table, pixel, proportional, type TableColumn } from "@/components/ui/astryx";
import type { AuditRow } from "@/lib/demo-store/selectors";

type Row = AuditRow & Record<string, unknown>;

const ACTION_LABEL: Record<string, string> = {
  model_call: "Model call",
  approval: "Approval",
  hand_off: "Hand-off",
  connector_access: "Source read",
  role_switch: "Role switch",
  comment: "Comment",
  resolve: "Resolved",
  revise: "Revision",
  request_review: "Review requested",
  stage_change: "Stage change",
  question_answered: "Question answered",
  merge: "Merge",
  workstream_created: "Workstream created",
  idea_created: "Idea logged",
  idea_status: "Idea triaged",
  idea_promoted: "Idea promoted",
  seed: "Seed",
  reset: "Reset",
};

const ACTION_VARIANT: Record<string, "info" | "success" | "warning" | "neutral" | "blue" | "teal" | "cyan" | "orange"> = {
  model_call: "blue",
  approval: "success",
  hand_off: "teal",
  merge: "success",
  question_answered: "orange",
  connector_access: "cyan",
};

function csv(rows: AuditRow[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const head = ["time", "actor", "action", "workstream", "model", "tokens_in", "tokens_out", "detail"];
  const body = rows.map((r) =>
    [new Date(r.at).toISOString(), r.actorName, r.action, r.workstreamTitle, r.modelId, r.tokenInput, r.tokenOutput, r.detail].map(esc).join(","),
  );
  return [head.join(","), ...body].join("\n");
}

export function AuditView(props: { rows: AuditRow[] | null }) {
  const all = props.rows ?? [];
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [ws, setWs] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(60);

  const actors = useMemo(() => [...new Set(all.map((r) => r.actorName))].sort(), [all]);
  const actions = useMemo(() => [...new Set(all.map((r) => r.action))].sort(), [all]);
  const streams = useMemo(
    () => [...new Map(all.filter((r) => r.workstreamId).map((r) => [r.workstreamId!, r.workstreamTitle ?? r.workstreamId!])).entries()],
    [all],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (action === "all" || r.action === action) &&
        (actor === "all" || r.actorName === actor) &&
        (ws === "all" || r.workstreamId === ws) &&
        (!q || `${r.detail} ${r.workstreamTitle ?? ""} ${r.actorName}`.toLowerCase().includes(q)),
    );
  }, [all, action, actor, ws, query]);

  const count = (a: string) => all.filter((r) => r.action === a).length;
  const tokens = all.reduce((s, r) => s + (r.tokenInput ?? 0) + (r.tokenOutput ?? 0), 0);

  const download = () => {
    const blob = new Blob([csv(filtered)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relay-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: TableColumn<Row>[] = [
    {
      key: "at",
      header: "When",
      width: pixel(150),
      renderCell: (r) => (
        <span className="tabular text-[12.5px] text-[var(--relay-ink-muted)]">
          {new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "actorName",
      header: "Actor",
      width: proportional(1, { minWidth: 150 }),
      renderCell: (r) => (
        <span className="flex items-center gap-2 text-[13px]">
          {r.agent ? (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--relay-brand-soft)] text-[var(--relay-brand-fg)]">
              <Bot className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : (
            <Avatar name={r.actorName} size="sm" tooltip={false} />
          )}
          {r.actorName}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: pixel(170),
      renderCell: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? "neutral"} label={ACTION_LABEL[r.action] ?? r.action} />,
    },
    {
      key: "workstreamTitle",
      header: "Workstream",
      width: proportional(1.3, { minWidth: 180 }),
      renderCell: (r) =>
        r.workstreamId ? (
          <Link href={`/workstreams/${r.workstreamId}`} className="flex min-w-0 items-center gap-2 text-[13px] no-underline">
            <ColourDot color={r.workstreamColor ?? "#94A3B8"} size="sm" />
            <span className="truncate">{r.workstreamTitle ?? r.workstreamId}</span>
          </Link>
        ) : (
          <span className="text-[12.5px] text-[var(--relay-ink-subtle)]">Workspace</span>
        ),
    },
    {
      key: "detail",
      header: "Detail",
      width: proportional(2, { minWidth: 220 }),
      renderCell: (r) => (
        <span className="text-[13px] text-[var(--relay-ink-body)]">
          {r.detail}
          {r.modelId ? (
            <span className="ml-1.5 font-mono text-[11.5px] text-[var(--relay-ink-muted)]">
              {r.modelId}
              {r.tokenInput != null ? ` · ${(r.tokenInput + (r.tokenOutput ?? 0)).toLocaleString("en-GB")} tok` : ""}
            </span>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHero
        id="audit"
        eyebrow="Audit"
        title="Audit log"
        purpose="Approvals, hand-offs, answers, comments and model calls, with the person or agent responsible. Filter by action, actor or workstream, or export as CSV."
        stats={[
          { label: "Events", value: all.length },
          { label: "Approvals", value: count("approval") },
          { label: "Hand-offs", value: count("hand_off") },
          { label: "Model calls", value: count("model_call"), hint: `${tokens.toLocaleString("en-GB")} tokens` },
        ]}
        actions={
          <button type="button" className="rl-btn-second rl-btn-compact inline-flex items-center gap-1.5" onClick={download} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export CSV
          </button>
        }
      />

      {props.rows === null ? (
        <div className="rl-sheet p-8">
          <EmptyState title="Audit rows need the worker" description="In database mode the audit table fills once actions write AuditLog rows. The demo records every action today." />
        </div>
      ) : (
        <section className="rl-sheet rl-sheet-elevated flex flex-col gap-3 p-4" aria-label="Audit log">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="audit-q">
              Search the audit log
            </label>
            <input id="audit-q" className="rl-input rl-input-compact min-w-0 flex-[1_1_220px]" placeholder="Search details" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select aria-label="Action" className="rl-input rl-input-compact max-w-[200px]" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="all">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a] ?? a}
                </option>
              ))}
            </select>
            <select aria-label="Actor" className="rl-input rl-input-compact max-w-[180px]" value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="all">Everyone</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select aria-label="Workstream" className="rl-input rl-input-compact max-w-[240px]" value={ws} onChange={(e) => setWs(e.target.value)}>
              <option value="all">All workstreams</option>
              {streams.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <span className="ml-auto text-[12.5px] tabular text-[var(--relay-ink-muted)]">
              {filtered.length} of {all.length}
            </span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState isCompact title="No events match" description="Clear a filter or try another search." />
          ) : (
            <div className="overflow-x-auto">
              <Table<Row> data={filtered.slice(0, limit) as Row[]} columns={columns} idKey="id" density="compact" hasHover verticalAlign="middle" />
            </div>
          )}
          {filtered.length > limit ? (
            <button type="button" className="rl-btn-second rl-btn-compact self-center" onClick={() => setLimit((l) => l + 100)}>
              Show more
            </button>
          ) : null}
        </section>
      )}
    </div>
  );
}
