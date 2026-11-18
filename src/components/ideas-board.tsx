"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { createIdea, promoteIdea, setIdeaStatus } from "@/app/actions/ideas";
import type { IdeaBoardItem, IdeaWorkstreamOption } from "@/lib/ideas";
import { ColourDot } from "@/components/colour-dot";
import { PageHero } from "@/components/page-hero";
import { useRelayActions } from "@/lib/demo-store/provider";
import { cn } from "@/lib/utils";
import { WORKSTREAM_COLOURS } from "@relay/core/domain";

const COLUMNS: Array<{ key: IdeaBoardItem["status"]; label: string; hint: string }> = [
  { key: "new", label: "New", hint: "Not reviewed" },
  { key: "triaged", label: "Triaged", hint: "Reviewed, decision pending" },
  { key: "promoted", label: "Promoted", hint: "Linked to a workstream" },
  { key: "parked", label: "Parked", hint: "Not planned" },
];

export function IdeasBoard(props: {
  items: IdeaBoardItem[];
  workstreamOptions: IdeaWorkstreamOption[];
  draft?: string;
  canTriage: boolean;
  triageReason?: string;
}) {
  const actions = useRelayActions();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"all" | IdeaBoardItem["type"]>("all");
  const [wsFilter, setWsFilter] = useState<string>("all");
  const [title, setTitle] = useState(props.draft ?? "");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IdeaBoardItem["type"]>("friction_log");
  const titleRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      props.items.filter((item) => {
        if (typeFilter !== "all" && item.type !== typeFilter) return false;
        if (wsFilter === "unlinked" && item.workstreamId) return false;
        if (wsFilter !== "all" && wsFilter !== "unlinked" && item.workstreamId !== wsFilter) return false;
        return true;
      }),
    [props.items, typeFilter, wsFilter],
  );

  const count = (status: IdeaBoardItem["status"]) => props.items.filter((i) => i.status === status).length;
  const minutes = props.items
    .filter((i) => i.status !== "parked" && i.frequencyPerWeek && i.minutesLostEach)
    .reduce((sum, i) => sum + (i.frequencyPerWeek ?? 0) * (i.minutesLostEach ?? 0), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (actions.mode === "demo") {
      if (actions.createIdea({ title, description, type })) {
        setTitle("");
        setDescription("");
      }
      return;
    }
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("type", type);
    await createIdea(fd);
    setTitle("");
    setDescription("");
    router.refresh();
  };

  const linkedStreams = props.workstreamOptions.filter((ws) => props.items.some((i) => i.workstreamId === ws.id));

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        id="ideas"
        eyebrow="Ideas"
        title="Idea intake"
        purpose="Log internal friction or external signals. Leads and architects review each idea and either park it or promote it into a new or existing workstream."
        stats={[
          { label: "New", value: count("new"), tone: count("new") > 0 ? "waiting" : "default" },
          { label: "Triaged", value: count("triaged") },
          { label: "Promoted", value: count("promoted") },
          { label: "Minutes lost a week", value: minutes, hint: "from friction logs" },
        ]}
        actions={
          <button type="button" className="rl-btn-primary rl-btn-compact" onClick={() => titleRef.current?.focus()}>
            Log an idea
          </button>
        }
        visual={
          <ol className="m-0 grid list-none grid-cols-4 items-stretch gap-2 p-0" aria-label="Idea flow">
            {COLUMNS.map((c, i) => (
              <li key={c.key} className="relative flex flex-col gap-1 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface)] p-3">
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">{c.label}</span>
                <span className="rl-stat-value text-[24px]">{count(c.key)}</span>
                <span className="text-[11px] text-[var(--relay-ink-subtle)]">{c.hint}</span>
                {i < COLUMNS.length - 2 ? (
                  <ArrowRight className="absolute -right-[13px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--relay-surface)] text-[var(--relay-brand-fg)]" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="rl-sheet rl-sheet-elevated p-4" aria-labelledby="rl-idea-compose">
          <h2 id="rl-idea-compose" className="m-0 text-[14px] font-medium text-[var(--relay-ink)]">
            Log an idea
          </h2>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5">
            <label className="sr-only" htmlFor="idea-title">
              Title
            </label>
            <input
              ref={titleRef}
              id="idea-title"
              className="rl-input rl-input-compact"
              placeholder="Short outcome-led title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <label className="sr-only" htmlFor="idea-desc">
              Description
            </label>
            <textarea
              id="idea-desc"
              className="rl-input min-h-[88px] py-3"
              placeholder="What is broken, who feels it, and what good looks like"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select className="rl-input rl-input-compact max-w-[220px]" value={type} onChange={(e) => setType(e.target.value as IdeaBoardItem["type"])} aria-label="Idea type">
                <option value="friction_log">Friction log</option>
                <option value="external_signal">External signal</option>
              </select>
              <button type="submit" className="rl-btn-primary rl-btn-compact" disabled={!title.trim()}>
                Save idea
              </button>
            </div>
          </form>
        </section>

        <section className="rl-sheet flex flex-col gap-3 p-4" aria-label="Filters">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="All types" />
            <FilterChip active={typeFilter === "friction_log"} onClick={() => setTypeFilter("friction_log")} label="Friction" />
            <FilterChip active={typeFilter === "external_signal"} onClick={() => setTypeFilter("external_signal")} label="External" />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={wsFilter === "all"} onClick={() => setWsFilter("all")} label="All streams" />
            <FilterChip active={wsFilter === "unlinked"} onClick={() => setWsFilter("unlinked")} label="Unlinked" color={WORKSTREAM_COLOURS.neutral} />
            {linkedStreams.map((ws) => (
              <FilterChip key={ws.id} active={wsFilter === ws.id} onClick={() => setWsFilter(ws.id)} label={ws.title} color={ws.color} />
            ))}
          </div>
          {!props.canTriage ? (
            <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">{props.triageReason ?? "Leads and architects triage and promote ideas."}</p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const cards = filtered.filter((i) => i.status === col.key);
          return (
            <section key={col.key} className="rl-sheet rl-sheet-elevated flex min-h-[280px] flex-col overflow-hidden" aria-labelledby={`idea-col-${col.key}`}>
              <div className="flex items-baseline justify-between border-b border-[var(--relay-border)] px-3 py-2.5">
                <h2 id={`idea-col-${col.key}`} className="m-0 text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">
                  {col.label}
                </h2>
                <span className="text-[12px] tabular text-[var(--relay-ink-subtle)]">{cards.length}</span>
              </div>
              <div className="flex max-h-[720px] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                {cards.length === 0 ? <p className="m-0 px-1 py-3 text-[12.5px] text-[var(--relay-ink-muted)]">Nothing here yet.</p> : null}
                {cards.map((item) => (
                  <IdeaCard key={item.id} item={item} canTriage={props.canTriage} workstreamOptions={props.workstreamOptions} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip(props: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button type="button" onClick={props.onClick} aria-pressed={props.active} className={cn("rl-chip rl-chip-compact inline-flex max-w-[260px] items-center gap-1.5", props.active && "rl-chip-on")}>
      {props.color ? <ColourDot color={props.color} size="sm" /> : null}
      <span className="truncate">{props.label}</span>
    </button>
  );
}

function IdeaCard(props: { item: IdeaBoardItem; canTriage: boolean; workstreamOptions: IdeaWorkstreamOption[] }) {
  const { item } = props;
  const actions = useRelayActions();
  const router = useRouter();
  const [target, setTarget] = useState("");
  const minutes = item.frequencyPerWeek && item.minutesLostEach ? item.frequencyPerWeek * item.minutesLostEach : null;
  const needsDecision = item.status === "new" || item.status === "triaged";

  const move = async (status: IdeaBoardItem["status"]) => {
    if (actions.mode === "demo") return actions.setIdeaStatus(item.id, status);
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("status", status);
    await setIdeaStatus(fd);
    router.refresh();
  };

  const promote = async () => {
    if (actions.mode === "demo") {
      const wsId = actions.promoteIdea(item.id, target || null);
      if (wsId && !target) router.push(`/workstreams/${wsId}`);
      return;
    }
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("workstreamId", target);
    await promoteIdea(fd);
    router.refresh();
  };

  return (
    <article className="flex flex-col gap-2 rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-3">
      <div className="flex items-start gap-2">
        <ColourDot color={item.color} pulse={needsDecision && props.canTriage} className="mt-1" label={needsDecision ? "Needs a decision" : undefined} />
        <p className="m-0 min-w-0 flex-1 text-[11px] uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">
          {item.type === "external_signal" ? "External signal" : "Friction log"}
        </p>
      </div>
      <h3 className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">{item.title}</h3>
      {item.description ? <p className="m-0 line-clamp-3 text-[12.5px] text-[var(--relay-ink-body)]">{item.description}</p> : null}
      <p className="m-0 text-[11.5px] text-[var(--relay-ink-subtle)]">
        {item.submittedByName}
        {minutes != null ? ` · ~${minutes} min/week` : ""}
      </p>
      {item.workstreamId && item.workstreamTitle ? (
        <Link href={`/workstreams/${item.workstreamId}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium no-underline">
          <ColourDot color={item.color} size="sm" />
          <span className="truncate">{item.workstreamTitle}</span>
        </Link>
      ) : null}
      {props.canTriage ? (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {item.status === "new" ? (
              <button type="button" className="rl-btn-second rl-btn-tiny" onClick={() => move("triaged")}>
                Triage
              </button>
            ) : null}
            {item.status !== "parked" && item.status !== "promoted" ? (
              <button type="button" className="rl-btn-second rl-btn-tiny" onClick={() => move("parked")}>
                Park
              </button>
            ) : null}
            {item.status === "parked" ? (
              <button type="button" className="rl-btn-second rl-btn-tiny" onClick={() => move("new")}>
                Reopen
              </button>
            ) : null}
          </div>
          {item.status !== "promoted" && item.status !== "parked" ? (
            <div className="flex flex-wrap gap-1.5">
              <select className="rl-input rl-input-compact min-w-0 flex-1 text-[12px]" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={`Promote ${item.title} into`}>
                <option value="">New workstream from idea</option>
                {props.workstreamOptions.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.title}
                  </option>
                ))}
              </select>
              <button type="button" className="rl-btn-primary rl-btn-tiny" onClick={promote}>
                Promote
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
