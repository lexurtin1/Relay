"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Paperclip, SendHorizontal, Square } from "lucide-react";
import { searchKnowledgeAction } from "@/app/actions/knowledge";
import {
  KNOWLEDGE_CHAT_THREADS,
  KNOWLEDGE_SUGGESTED_PROMPTS,
  type KnowledgeChatMessage,
} from "@/lib/knowledge-chats";
import {
  connectorLabel,
  listConnectorIds,
  type SourceConnectorId,
} from "@/lib/knowledge-shared";
import type { ConnectorHealthRow, SourceItem } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

const ALL_SOURCES = listConnectorIds();

const SOURCE_ACCENT: Record<SourceConnectorId, string> = {
  salesforce: "#2B6FD6",
  powerbi: "#14908F",
  jira: "#5B6BC0",
  confluence: "#1A56A8",
  databricks: "#027A48",
  github: "#4A5562",
};

type LiveThread = {
  kind: "live";
  messages: KnowledgeChatMessage[];
};

type MockThread = {
  kind: "mock";
  id: string;
};

type ActiveThread = LiveThread | MockThread | null;

export function KnowledgeChat(props: {
  initialQuery: string;
  initialSource: string;
  health: ConnectorHealthRow[];
  initialResults: SourceItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(props.initialQuery);
  const [source, setSource] = useState<string>(props.initialSource || "All");
  const [active, setActive] = useState<ActiveThread>(() =>
    props.initialQuery.trim()
      ? {
          kind: "live",
          messages: buildLiveMessages(props.initialQuery, props.initialResults),
        }
      : null,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(props.initialQuery);
    setSource(props.initialSource || "All");
    if (props.initialQuery.trim()) {
      setActive({
        kind: "live",
        messages: buildLiveMessages(props.initialQuery, props.initialResults),
      });
    }
  }, [props.initialQuery, props.initialSource, props.initialResults]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active, pending]);

  const healthy = props.health.filter((h) => h.ok).length;
  const messages = resolveMessages(active);
  const showEmpty = !messages.length && !pending;

  function syncUrl(nextQuery: string, nextSource: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    if (nextSource && nextSource !== "All") params.set("source", nextSource);
    else params.delete("source");
    const qs = params.toString();
    router.replace(qs ? `/knowledge?${qs}` : "/knowledge");
  }

  function startNewChat() {
    setActive(null);
    setQuery("");
    setError(null);
    syncUrl("", source === "All" ? "All" : source);
  }

  function openMockChat(id: string) {
    setActive({ kind: "mock", id });
    setError(null);
    setQuery("");
  }

  function runSearch(nextQuery: string, nextSource: string) {
    const q = nextQuery.trim();
    if (!q) return;
    setError(null);
    setQuery(q);
    setActive({
      kind: "live",
      messages: [{ id: `u-${Date.now()}`, role: "user", content: q }],
    });
    startTransition(async () => {
      try {
        const sources: SourceConnectorId[] | undefined =
          nextSource === "All" ? undefined : [nextSource as SourceConnectorId];
        const items = await searchKnowledgeAction({
          query: q,
          sources,
        });
        setActive({
          kind: "live",
          messages: buildLiveMessages(q, items),
        });
        syncUrl(q, nextSource);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query, source);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runSearch(query, source);
    }
  }

  return (
    <div className="rl-knowledge-chat flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      <aside
        aria-label="Recent chats"
        className="rl-sheet flex w-full shrink-0 flex-col overflow-hidden md:w-[240px]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--relay-border)] px-3 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--relay-ink-muted)]">
            Recent chats
          </p>
          <button
            type="button"
            className="rl-btn-second rl-btn-tiny"
            onClick={startNewChat}
          >
            New
          </button>
        </div>
        <ul className="m-0 flex list-none gap-1 overflow-x-auto p-2 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto">
          {KNOWLEDGE_CHAT_THREADS.map((thread) => {
            const selected = active?.kind === "mock" && active.id === thread.id;
            return (
              <li key={thread.id} className="shrink-0 md:shrink">
                <button
                  type="button"
                  className={cn(
                    "flex w-max max-w-[200px] items-start gap-2 rounded-[12px] px-2.5 py-2 text-left text-[13px] text-[var(--relay-ink)] transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_5%,transparent)] md:w-full md:max-w-none",
                    selected && "bg-[var(--relay-brand-soft)] text-[var(--relay-brand-fg)]",
                  )}
                  onClick={() => openMockChat(thread.id)}
                >
                  <Square
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  <span className="line-clamp-2">{thread.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="hidden border-t border-[var(--relay-border)] px-3 py-3 md:block">
          <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--relay-success)]"
              aria-hidden
            />
            {healthy} of {props.health.length} sources live
          </p>
        </div>
      </aside>

      <section className="rl-sheet rl-sheet-elevated flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {showEmpty ? (
            <EmptyState
              onPrompt={(prompt, preferredSource) => {
                const nextSource = preferredSource ?? source;
                setSource(nextSource);
                runSearch(prompt, nextSource);
              }}
            />
          ) : (
            <MessageList messages={messages} pending={pending} />
          )}
          {error ? (
            <p className="mt-3 text-sm text-[var(--relay-danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[var(--relay-border)] px-3 py-3 sm:px-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--relay-ink-muted)]">
              Search
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by source">
              <button
                type="button"
                className={cn("rl-chip rl-chip-compact", source === "All" && "rl-chip-on")}
                aria-pressed={source === "All"}
                onClick={() => setSource("All")}
              >
                All
              </button>
              {ALL_SOURCES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={cn("rl-chip rl-chip-compact", source === id && "rl-chip-on")}
                  aria-pressed={source === id}
                  style={
                    source === id
                      ? undefined
                      : {
                          borderColor: `color-mix(in srgb, ${SOURCE_ACCENT[id]} 45%, var(--relay-border))`,
                        }
                  }
                  onClick={() => setSource(id)}
                >
                  {connectorLabel(id)}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex items-end gap-2 rounded-[16px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] p-2"
            onSubmit={onSubmit}
          >
            <button
              type="button"
              className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--relay-ink-muted)]"
              aria-label="Attachments unavailable in prototype"
              disabled
              title="Attachments arrive later"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
            </button>
            <label className="sr-only" htmlFor="knowledge-chat-q">
              Ask about company knowledge
            </label>
            <textarea
              id="knowledge-chat-q"
              className="min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[14px] leading-5 text-[var(--relay-ink)] outline-none placeholder:text-[var(--relay-ink-subtle)]"
              rows={1}
              value={query}
              placeholder="Ask anything about Calastone…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
            />
            <button
              type="submit"
              className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--relay-primary)] text-[var(--relay-primary-fg)] disabled:opacity-50"
              disabled={pending || !query.trim()}
              aria-label={pending ? "Searching" : "Send"}
            >
              <SendHorizontal className="h-4 w-4" aria-hidden />
            </button>
          </form>
          <p className="m-0 mt-2 text-center text-[11px] text-[var(--relay-ink-subtle)]">
            Enter to send · Shift + Enter for new line
          </p>
        </div>
      </section>
    </div>
  );
}

function resolveMessages(active: ActiveThread): KnowledgeChatMessage[] {
  if (!active) return [];
  if (active.kind === "live") return active.messages;
  return KNOWLEDGE_CHAT_THREADS.find((t) => t.id === active.id)?.messages ?? [];
}

function buildLiveMessages(query: string, results: SourceItem[]): KnowledgeChatMessage[] {
  const user: KnowledgeChatMessage = {
    id: `u-${query}`,
    role: "user",
    content: query,
  };
  const top = results.slice(0, 6);
  const assistant: KnowledgeChatMessage = {
    id: `a-${query}`,
    role: "assistant",
    content:
      top.length === 0
        ? `No matching sources for "${query}". Try another term or clear the source filter.`
        : `Found ${results.length} source${results.length === 1 ? "" : "s"} across connected systems. Top matches are below.`,
    citations: top.map((item) => ({
      id: item.id,
      connectorId: item.connectorId as SourceConnectorId,
      title: item.title,
      snippet: item.snippet,
    })),
  };
  return [user, assistant];
}

function EmptyState(props: {
  onPrompt: (prompt: string, source?: SourceConnectorId) => void;
}) {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center px-2 py-8 text-center animate-relay-in">
      <ConnectorOrbit />
      <h1 className="m-0 mt-6 text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
        What would you like to know?
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14px] text-[var(--relay-ink-muted)]">
        Your AI analyst — pulling live answers from Salesforce, Power BI, Jira, Confluence,
        Databricks and GitHub.
      </p>
      <div className="mt-6 grid w-full max-w-[520px] grid-cols-1 gap-2 sm:grid-cols-2">
        {KNOWLEDGE_SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="rl-sheet rounded-[14px] px-4 py-3.5 text-left text-[13.5px] font-medium text-[var(--relay-ink)] transition-relay hover:border-[var(--relay-border-strong)]"
            onClick={() => props.onPrompt(prompt.label, prompt.source)}
          >
            <span
              className="mb-2 inline-block h-2 w-2 rounded-full"
              style={{ background: SOURCE_ACCENT[prompt.source] }}
              aria-hidden
            />
            <span className="block">{prompt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnectorOrbit() {
  const nodes = ALL_SOURCES.map((id, index) => {
    const angle = (Math.PI * 2 * index) / ALL_SOURCES.length - Math.PI / 2;
    const radius = 72;
    return {
      id,
      label: shortConnector(id),
      x: 100 + Math.cos(angle) * radius,
      y: 100 + Math.sin(angle) * radius,
      color: SOURCE_ACCENT[id],
    };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-[168px] w-[168px]"
      role="img"
      aria-label="Connected knowledge sources"
    >
      {nodes.map((node) => (
        <line
          key={`line-${node.id}`}
          x1="100"
          y1="100"
          x2={node.x}
          y2={node.y}
          stroke={node.color}
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      ))}
      <polygon
        points="100,72 124,86 124,114 100,128 76,114 76,86"
        fill="var(--relay-brand-soft)"
        stroke="var(--relay-brand)"
        strokeWidth="1.5"
      />
      {nodes.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="16" fill="var(--relay-surface)" stroke={node.color} strokeWidth="1.6" />
          <text
            x={node.x}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={node.color}
            fontSize="9"
            fontWeight="600"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function shortConnector(id: SourceConnectorId): string {
  switch (id) {
    case "salesforce":
      return "SF";
    case "powerbi":
      return "BI";
    case "jira":
      return "JR";
    case "confluence":
      return "CF";
    case "databricks":
      return "DB";
    case "github":
      return "GH";
  }
}

function MessageList(props: { messages: KnowledgeChatMessage[]; pending: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
      {props.messages.map((message) => (
        <article
          key={message.id}
          className={cn(
            "flex flex-col gap-2",
            message.role === "user" ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "max-w-[92%] rounded-[16px] px-4 py-3 text-[14px] leading-6",
              message.role === "user"
                ? "bg-[var(--relay-primary)] text-[var(--relay-primary-fg)]"
                : "bg-[var(--relay-surface-muted)] text-[var(--relay-ink-body)]",
            )}
          >
            {message.content}
          </div>
          {message.citations?.length ? (
            <ul className="m-0 grid w-full list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
              {message.citations.map((cite) => (
                <li
                  key={`${cite.connectorId}-${cite.id}`}
                  className="rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3.5 py-3"
                >
                  <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">
                    <span style={{ color: SOURCE_ACCENT[cite.connectorId] }}>
                      {connectorLabel(cite.connectorId)}
                    </span>
                  </p>
                  <p className="m-0 mt-1 text-[13.5px] font-medium text-[var(--relay-ink)]">
                    {cite.title}
                  </p>
                  <p className="m-0 mt-1 text-[12.5px] text-[var(--relay-ink-body)]">
                    {cite.snippet}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
      {props.pending ? (
        <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">Searching connected sources…</p>
      ) : null}
    </div>
  );
}
