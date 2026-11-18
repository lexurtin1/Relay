"use client";

import { useMemo, useState } from "react";
import {
  createIdea,
  promoteIdea,
  setIdeaStatus,
} from "@/app/actions/ideas";
import type { IdeaBoardItem, IdeaWorkstreamOption } from "@/lib/ideas";
import { cn } from "@/lib/utils";
import {
  WORKSTREAM_COLOUR_LABELS,
  WORKSTREAM_COLOURS,
} from "@relay/core";

const COLUMNS: Array<{ key: IdeaBoardItem["status"]; label: string }> = [
  { key: "new", label: "New" },
  { key: "triaged", label: "Triaged" },
  { key: "promoted", label: "Promoted" },
  { key: "parked", label: "Parked" },
];

export function IdeasBoard(props: {
  items: IdeaBoardItem[];
  workstreamOptions: IdeaWorkstreamOption[];
  draft?: string;
  canTriage: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | IdeaBoardItem["type"]>("all");
  const [wsFilter, setWsFilter] = useState<string>("all");
  const [draftTitle, setDraftTitle] = useState(props.draft ?? "");

  const filtered = useMemo(() => {
    return props.items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (wsFilter === "unlinked" && item.workstreamId) return false;
      if (wsFilter !== "all" && wsFilter !== "unlinked" && item.workstreamId !== wsFilter) {
        return false;
      }
      return true;
    });
  }, [props.items, typeFilter, wsFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[clamp(28px,3vw,38px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink-muted)]">
          Ideas
        </h1>
        <p className="mt-2 max-w-[72ch] text-[15px] text-[var(--relay-ink-body)]">
          Friction logs and external signals that become colour-coded build tickets. Scout and
          Knowledge use the same MCP-style connectors as the company chatbot (Salesforce, Jira,
          Confluence, Databricks, Datadog, GitHub, Power BI) so research has full company context.
        </p>
      </div>

      <Legend workstreams={props.workstreamOptions} />

      <section className="rl-sheet rl-sheet-elevated p-4" aria-labelledby="rl-idea-compose">
        <h2 id="rl-idea-compose" className="m-0 text-[14px] font-medium text-[var(--relay-ink)]">
          Log an idea
        </h2>
        <form action={createIdea} className="mt-3 flex flex-col gap-2.5">
          <label className="sr-only" htmlFor="idea-title">
            Title
          </label>
          <input
            id="idea-title"
            name="title"
            className="rl-input rl-input-compact"
            placeholder="Short outcome-led title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            required
          />
          <label className="sr-only" htmlFor="idea-desc">
            Description
          </label>
          <textarea
            id="idea-desc"
            name="description"
            className="rl-input min-h-[88px] py-3"
            placeholder="What is broken, who feels it, and what good looks like"
            required
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="type"
              className="rl-input rl-input-compact max-w-[220px]"
              defaultValue="friction_log"
            >
              <option value="friction_log">Friction log</option>
              <option value="external_signal">External signal</option>
            </select>
            <button type="submit" className="rl-btn-primary rl-btn-compact">
              Save idea
            </button>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          label="All types"
        />
        <FilterChip
          active={typeFilter === "friction_log"}
          onClick={() => setTypeFilter("friction_log")}
          label="Friction"
        />
        <FilterChip
          active={typeFilter === "external_signal"}
          onClick={() => setTypeFilter("external_signal")}
          label="External"
        />
        <span className="mx-1 h-6 w-px bg-[var(--relay-border)]" aria-hidden />
        <FilterChip active={wsFilter === "all"} onClick={() => setWsFilter("all")} label="All streams" />
        <FilterChip
          active={wsFilter === "unlinked"}
          onClick={() => setWsFilter("unlinked")}
          label="Unlinked"
        />
        {props.workstreamOptions.map((ws) => (
          <FilterChip
            key={ws.id}
            active={wsFilter === ws.id}
            onClick={() => setWsFilter(ws.id)}
            label={ws.title}
            color={ws.color}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const cards = filtered.filter((i) => i.status === col.key);
          return (
            <section
              key={col.key}
              className="rl-sheet rl-sheet-elevated flex min-h-[280px] flex-col overflow-hidden"
              aria-labelledby={`idea-col-${col.key}`}
            >
              <div className="flex items-baseline justify-between border-b border-[var(--relay-border)] px-3 py-2.5">
                <h2
                  id={`idea-col-${col.key}`}
                  className="m-0 text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]"
                >
                  {col.label}
                </h2>
                <span className="text-[12px] tabular text-[var(--relay-ink-subtle)]">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                {cards.length === 0 ? (
                  <p className="m-0 px-1 py-3 text-[12.5px] text-[var(--relay-ink-muted)]">
                    Nothing here yet.
                  </p>
                ) : (
                  cards.map((item) => (
                    <IdeaCard
                      key={item.id}
                      item={item}
                      canTriage={props.canTriage}
                      workstreamOptions={props.workstreamOptions}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Legend(props: { workstreams: IdeaWorkstreamOption[] }) {
  const fallback = Object.entries(WORKSTREAM_COLOUR_LABELS).map(([key, label]) => ({
    id: key,
    title: label,
    color: WORKSTREAM_COLOURS[key as keyof typeof WORKSTREAM_COLOUR_LABELS],
  }));
  const rows = props.workstreams.length > 0 ? props.workstreams : fallback;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-[12px] text-[var(--relay-ink-muted)]">
      {rows.map((ws) => (
        <li key={ws.id} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: ws.color }}
            aria-hidden
          />
          <span className="max-w-[220px] truncate">{ws.title}</span>
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: WORKSTREAM_COLOURS.neutral }}
          aria-hidden
        />
        Unlinked
      </li>
    </ul>
  );
}

function FilterChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "rl-chip rl-chip-compact inline-flex items-center gap-1.5",
        props.active && "rl-chip-on",
      )}
    >
      {props.color ? (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: props.color }}
          aria-hidden
        />
      ) : null}
      {props.label}
    </button>
  );
}

function IdeaCard(props: {
  item: IdeaBoardItem;
  canTriage: boolean;
  workstreamOptions: IdeaWorkstreamOption[];
}) {
  const { item } = props;
  const minutes =
    item.frequencyPerWeek && item.minutesLostEach
      ? item.frequencyPerWeek * item.minutesLostEach
      : null;

  return (
    <article
      className="flex flex-col gap-2 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-3"
      style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
    >
      <p className="m-0 text-[11px] uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">
        {item.type === "external_signal" ? "External signal" : "Friction log"}
        {item.workstreamTitle ? ` · ${item.workstreamTitle}` : ""}
      </p>
      <h3 className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
        {item.title}
      </h3>
      <p className="m-0 line-clamp-3 text-[12.5px] text-[var(--relay-ink-body)]">
        {item.description}
      </p>
      <p className="m-0 text-[11.5px] text-[var(--relay-ink-subtle)]">
        {item.submittedByName}
        {minutes != null ? ` · ~${minutes} min/week` : ""}
      </p>
      {props.canTriage ? (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {item.status !== "triaged" && item.status !== "promoted" ? (
              <form action={setIdeaStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="triaged" />
                <button type="submit" className="rl-btn-second rl-btn-tiny">
                  Triage
                </button>
              </form>
            ) : null}
            {item.status !== "parked" ? (
              <form action={setIdeaStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="parked" />
                <button type="submit" className="rl-btn-second rl-btn-tiny">
                  Park
                </button>
              </form>
            ) : null}
            {item.status === "parked" ? (
              <form action={setIdeaStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="new" />
                <button type="submit" className="rl-btn-second rl-btn-tiny">
                  Reopen
                </button>
              </form>
            ) : null}
          </div>
          {item.status !== "promoted" ? (
            <form action={promoteIdea} className="flex flex-wrap gap-1.5">
              <input type="hidden" name="id" value={item.id} />
              <select
                name="workstreamId"
                className="rl-input rl-input-compact max-w-full flex-1 text-[12px]"
                defaultValue=""
              >
                <option value="">New workstream from idea</option>
                {props.workstreamOptions.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.title}
                  </option>
                ))}
              </select>
              <input type="hidden" name="createNew" value="0" />
              <button type="submit" className="rl-btn-primary rl-btn-tiny">
                Promote
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
