"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { searchKnowledgeAction } from "@/app/actions/knowledge";
import {
  connectorLabel,
  listConnectorIds,
  type SourceConnectorId,
} from "@/lib/knowledge-shared";
import type { ConnectorHealthRow, SourceItem } from "@/lib/knowledge";
import { cn, formatRelativeTime } from "@/lib/utils";

const ALL_SOURCES = listConnectorIds();
const HISTORY_KEY = "relay-knowledge-chats-v1";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  results?: SourceItem[];
};

type ChatSession = {
  id: string;
  title: string;
  source: string;
  updatedAt: string;
  messages: ChatMessage[];
};

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 30)));
}

export function KnowledgeSearch(props: {
  initialQuery: string;
  initialSource: string;
  health: ConnectorHealthRow[];
  initialResults: SourceItem[];
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState(props.initialQuery);
  const [source, setSource] = useState(props.initialSource || "All");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bootstrapped = useRef(false);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    if (props.initialQuery.trim() && !bootstrapped.current) {
      bootstrapped.current = true;
      const id = `chat_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const session: ChatSession = {
        id,
        title: props.initialQuery.trim().slice(0, 48),
        source: props.initialSource || "All",
        updatedAt: createdAt,
        messages: [
          {
            id: `u_${id}`,
            role: "user",
            content: props.initialQuery.trim(),
            createdAt,
          },
          {
            id: `a_${id}`,
            role: "assistant",
            content:
              props.initialResults.length > 0
                ? `Found ${props.initialResults.length} source${props.initialResults.length === 1 ? "" : "s"}.`
                : "No matching sources for that query.",
            createdAt,
            results: props.initialResults,
          },
        ],
      };
      const next = [session, ...stored];
      setSessions(next);
      setActiveId(id);
      saveSessions(next);
      setDraft("");
    } else if (stored[0]) {
      setActiveId(stored[0].id);
    }
  }, [props.initialQuery, props.initialResults, props.initialSource]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [active?.messages.length, pending]);

  function startNewChat() {
    setActiveId(null);
    setDraft("");
    setError(null);
  }

  function runAsk(query: string) {
    const q = query.trim();
    if (!q) return;
    setError(null);
    const createdAt = new Date().toISOString();
    const sessionId = activeId ?? `chat_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: q,
      createdAt,
    };

    startTransition(async () => {
      try {
        const sources: SourceConnectorId[] | undefined =
          source === "All" ? undefined : [source as SourceConnectorId];
        const items = await searchKnowledgeAction({ query: q, sources });
        const assistant: ChatMessage = {
          id: `a_${Date.now()}`,
          role: "assistant",
          content:
            items.length > 0
              ? `Found ${items.length} source${items.length === 1 ? "" : "s"} across connected systems.`
              : "No matching sources. Try a broader term or clear the source filter.",
          createdAt: new Date().toISOString(),
          results: items,
        };

        setSessions((prev) => {
          const existing = prev.find((s) => s.id === sessionId);
          const nextSession: ChatSession = existing
            ? {
                ...existing,
                title: existing.title || q.slice(0, 48),
                source,
                updatedAt: assistant.createdAt,
                messages: [...existing.messages, userMsg, assistant],
              }
            : {
                id: sessionId,
                title: q.slice(0, 48),
                source,
                updatedAt: assistant.createdAt,
                messages: [userMsg, assistant],
              };
          const rest = prev.filter((s) => s.id !== sessionId);
          const next = [nextSession, ...rest];
          saveSessions(next);
          return next;
        });
        setActiveId(sessionId);
        setDraft("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-[560px] flex-col gap-3 lg:flex-row lg:gap-4">
      <aside className="rl-sheet flex max-h-[220px] w-full flex-col overflow-hidden p-3 lg:max-h-none lg:w-[260px] lg:shrink-0">
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <h1 className="m-0 text-base font-medium text-[var(--relay-ink)]">Knowledge</h1>
          <button type="button" className="rl-btn-second" onClick={startNewChat}>
            New chat
          </button>
        </div>
        <p className="m-0 px-1 pb-3 text-[12px] text-[var(--relay-ink-muted)]">
          Ask connected sources. History stays in this browser.
        </p>
        <ul className="m-0 flex list-none flex-col gap-1 overflow-y-auto p-0">
          {sessions.length === 0 ? (
            <li className="px-2 py-3 text-sm text-[var(--relay-ink-muted)]">No chats yet</li>
          ) : (
            sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-[12px] px-2.5 py-2 text-left transition-relay",
                    activeId === session.id
                      ? "bg-[color-mix(in_srgb,var(--relay-brand)_14%,transparent)] text-[var(--relay-ink)]"
                      : "text-[var(--relay-ink-body)] hover:bg-[color-mix(in_srgb,var(--relay-ink)_5%,transparent)]",
                  )}
                  onClick={() => setActiveId(session.id)}
                >
                  <span className="truncate text-sm font-medium">{session.title}</span>
                  <span className="text-[11px] text-[var(--relay-ink-subtle)]">
                    {formatRelativeTime(session.updatedAt)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="mt-auto border-t border-[var(--relay-border)] pt-3">
          <button
            type="button"
            className="text-[12px] text-[var(--relay-brand-fg)] hover:underline"
            onClick={() => setShowHealth((v) => !v)}
          >
            {showHealth ? "Hide connectors" : "Connector health"}
          </button>
          {showHealth ? <ConnectorHealthMini health={props.health} /> : null}
        </div>
      </aside>

      <section className="rl-sheet relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {!active ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <p className="m-0 text-xl font-medium text-[var(--relay-ink)]">Ask knowledge</p>
              <p className="mt-2 max-w-[42ch] text-sm text-[var(--relay-ink-muted)]">
                Search Confluence, Jira, GitHub, Salesforce, Power BI and Databricks. Try
                &quot;ISIN&quot;, &quot;NAV exception&quot;, or &quot;onboarding&quot;.
              </p>
            </div>
          ) : (
            active.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {pending ? (
            <p className="text-sm text-[var(--relay-ink-muted)]">Searching connected sources…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-[var(--relay-danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <form
          className="sticky bottom-0 z-10 border-t border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-surface)_92%,transparent)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
          onSubmit={(e) => {
            e.preventDefault();
            runAsk(draft);
          }}
        >
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by source">
            <button
              type="button"
              className={cn("rl-chip", source === "All" && "rl-chip-on")}
              aria-pressed={source === "All"}
              onClick={() => setSource("All")}
            >
              All
            </button>
            {ALL_SOURCES.map((id) => (
              <button
                key={id}
                type="button"
                className={cn("rl-chip", source === id && "rl-chip-on")}
                aria-pressed={source === id}
                onClick={() => setSource(id)}
              >
                {connectorLabel(id)}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="knowledge-composer">
              Ask knowledge
            </label>
            <textarea
              id="knowledge-composer"
              className="rl-input min-h-[48px] flex-1 resize-none py-3"
              rows={2}
              value={draft}
              placeholder="Ask about a system, ticket, or doc…"
              disabled={pending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runAsk(draft);
                }
              }}
            />
            <button type="submit" className="rl-btn-primary" disabled={pending || !draft.trim()}>
              {pending ? "…" : "Ask"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MessageBubble(props: { message: ChatMessage }) {
  const isUser = props.message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(720px,92%)] rounded-[18px] px-3.5 py-2.5 text-sm",
          isUser
            ? "bg-[color-mix(in_srgb,var(--relay-brand)_22%,transparent)] text-[var(--relay-ink)]"
            : "bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] text-[var(--relay-ink-body)]",
        )}
      >
        <p className="m-0 whitespace-pre-wrap">{props.message.content}</p>
        {props.message.results && props.message.results.length > 0 ? (
          <ul className="mt-3 m-0 flex list-none flex-col gap-2 p-0">
            {props.message.results.map((item) => (
              <li
                key={`${item.connectorId}-${item.id}`}
                className="rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3 py-2"
              >
                <p className="m-0 text-[11px] text-[var(--relay-ink-subtle)]">
                  {connectorLabel(item.connectorId as SourceConnectorId)} ·{" "}
                  <span className="font-mono">{item.id}</span>
                </p>
                <p className="m-0 mt-1 font-medium text-[var(--relay-ink)]">{item.title}</p>
                <p className="m-0 mt-1 text-[13px] text-[var(--relay-ink-muted)]">{item.snippet}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ConnectorHealthMini(props: { health: ConnectorHealthRow[] }) {
  return (
    <ul className="mt-2 m-0 grid list-none grid-cols-2 gap-1.5 p-0">
      {props.health.map((row) => (
        <li key={row.id} className="rounded-[10px] border border-[var(--relay-border)] px-2 py-1.5 text-[11px]">
          <span
            className={cn(
              "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
              row.ok ? "bg-[var(--relay-success)]" : "bg-[var(--relay-warning)]",
            )}
          />
          {row.label}
        </li>
      ))}
    </ul>
  );
}
