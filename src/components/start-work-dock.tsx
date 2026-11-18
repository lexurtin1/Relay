"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { searchKnowledgeAction } from "@/app/actions/knowledge";
import { writeRecentKnowledge } from "@/lib/recent-knowledge";
import type { SourceItem } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

const MODES = [
  {
    id: "research" as const,
    label: "Research",
    ph: "Describe the problem. Scout searches company sources.",
    cta: "Ask",
  },
  {
    id: "idea" as const,
    label: "Log idea",
    ph: "Describe the friction or the external signal",
    cta: "Log idea",
  },
  {
    id: "find" as const,
    label: "Search",
    ph: "Search Confluence, Jira, Datadog, GitHub and more",
    cta: "Search",
  },
];

const THINK_STEPS = [
  "Reading your question",
  "Searching company sources",
  "Checking Confluence and Jira",
  "Checking Datadog and GitHub",
  "Summarising what matters",
];

export function StartWorkDock() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("research");
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [thinking, setThinking] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [results, setResults] = useState<SourceItem[]>([]);
  const [asked, setAsked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = MODES.find((m) => m.id === mode) ?? MODES[0]!;

  useEffect(() => {
    if (!pending || thinking.length === 0) return;
    const id = window.setInterval(() => {
      setActiveStep((n) => Math.min(n + 1, thinking.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [pending, thinking.length]);

  function resetPanel() {
    setExpanded(false);
    setThinking([]);
    setActiveStep(0);
    setResults([]);
    setAsked(null);
    setError(null);
  }

  function runAsk(q: string) {
    setExpanded(true);
    setAsked(q);
    setError(null);
    setResults([]);
    setThinking(THINK_STEPS);
    setActiveStep(0);

    startTransition(async () => {
      try {
        const items = await searchKnowledgeAction({ query: q, log: true });
        setResults(items);
        setActiveStep(THINK_STEPS.length - 1);
        writeRecentKnowledge({
          id: `${Date.now()}`,
          query: q,
          at: new Date().toISOString(),
          sourceCount: items.length,
          sources: items.slice(0, 8).map((item) => ({
            title: item.title,
            connector: item.connectorId,
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    });
  }

  function go(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (!q) return;

    if (mode === "idea") {
      router.push(`/ideas?draft=${encodeURIComponent(q)}`);
      return;
    }

    runAsk(q);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  function onDraftChange(value: string) {
    setDraft(value);
    if (value.trim()) {
      setExpanded(true);
      if (!asked && thinking.length === 0) {
        setThinking(["Ready when you send · Scout will search company sources"]);
        setActiveStep(0);
      }
    } else if (!pending && !asked) {
      resetPanel();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 max-[900px]:pl-[calc(var(--relay-sidebar-rail)+12px)] min-[901px]:pl-[calc(var(--relay-sidebar-width)+16px)]">
      <section
        aria-labelledby="rl-start-h"
        className={cn(
          "rl-glass pointer-events-auto w-full max-w-[1100px] rounded-[18px] shadow-[0_16px_48px_-18px_rgba(13,19,31,0.45)] transition-[padding] duration-150",
          expanded ? "p-3" : "px-3 py-2",
        )}
      >
        {expanded ? (
          <div className="mb-2.5 max-h-[38vh] overflow-y-auto rounded-[14px] border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-surface)_88%,transparent)] px-3 py-2.5">
            {asked ? (
              <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
                You asked
                <span className="mt-1 block text-[14px] font-medium text-[var(--relay-ink)]">
                  {asked}
                </span>
              </p>
            ) : null}

            <ol className="mt-2.5 m-0 flex list-none flex-col gap-1.5 p-0">
              {thinking.map((step, i) => (
                <li
                  key={step}
                  className={cn(
                    "flex items-center gap-2 text-[12.5px]",
                    i <= activeStep
                      ? "text-[var(--relay-ink)]"
                      : "text-[var(--relay-ink-subtle)]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      i < activeStep
                        ? "bg-[var(--relay-success)]"
                        : i === activeStep && pending
                          ? "bg-[var(--relay-gateway-purple)] animate-relay-pulse"
                          : "bg-[var(--relay-gateway-purple)]",
                    )}
                    aria-hidden
                  />
                  {step}
                </li>
              ))}
            </ol>

            {error ? (
              <p className="mt-2 text-[12.5px] text-[var(--relay-danger)]" role="alert">
                {error}
              </p>
            ) : null}

            {!pending && results.length > 0 ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--relay-ink-muted)]">
                    Sources · logged in Knowledge
                  </p>
                  <Link
                    href={`/knowledge?q=${encodeURIComponent(asked ?? draft)}`}
                    className="text-[12px] font-medium text-[var(--relay-brand-fg)] no-underline hover:underline"
                  >
                    Open in Knowledge
                  </Link>
                </div>
                <ul className="mt-1.5 m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
                  {results.slice(0, 6).map((item) => (
                    <li
                      key={`${item.connectorId}-${item.id}`}
                      className="rounded-[10px] border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] px-2.5 py-2"
                    >
                      <p className="m-0 truncate text-[13px] font-medium text-[var(--relay-ink)]">
                        {item.title}
                      </p>
                      <p className="m-0 mt-0.5 text-[11px] capitalize text-[var(--relay-ink-subtle)]">
                        {item.connectorId}
                      </p>
                    </li>
                  ))}
                </ul>
                {mode === "research" && asked ? (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Link
                      href={`/workstreams/new?title=${encodeURIComponent(asked)}`}
                      className="rl-btn-primary rl-btn-tiny inline-flex items-center no-underline"
                    >
                      Turn into workstream
                    </Link>
                    <button
                      type="button"
                      className="rl-btn-second rl-btn-tiny"
                      onClick={resetPanel}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="rl-btn-second rl-btn-tiny mt-2.5"
                    onClick={resetPanel}
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <h2 id="rl-start-h" className="sr-only">
            Start work
          </h2>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Type of work">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`rl-chip rl-chip-compact ${mode === m.id ? "rl-chip-on" : ""}`}
                aria-pressed={mode === m.id}
                onClick={() => {
                  setMode(m.id);
                  if (m.id === "idea") resetPanel();
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={go}>
            <label className="sr-only" htmlFor="rl-ask-in">
              Describe what you need
            </label>
            <input
              id="rl-ask-in"
              className="rl-input rl-input-compact min-h-[36px] min-w-0 flex-[1_1_240px] py-0 text-[14px]"
              type="text"
              value={draft}
              placeholder={current.ph}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
            />
            <button
              type="submit"
              className="rl-btn-primary rl-btn-compact min-h-[36px]"
              disabled={pending || !draft.trim()}
            >
              {pending ? "Working…" : current.cta}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
