"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchKnowledgeAction } from "@/app/actions/knowledge";
import {
  connectorLabel,
  listConnectorIds,
  type SourceConnectorId,
} from "@/lib/knowledge-shared";
import type { ConnectorHealthRow, SourceItem } from "@/lib/knowledge";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";

const ALL_SOURCES = listConnectorIds();

export function KnowledgeSearch(props: {
  initialQuery: string;
  initialSource: string;
  health: ConnectorHealthRow[];
  initialResults: SourceItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(props.initialQuery);
  const [source, setSource] = useState<string>(props.initialSource || "All");
  const [results, setResults] = useState<SourceItem[]>(props.initialResults);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(props.initialQuery);
    setSource(props.initialSource || "All");
    setResults(props.initialResults);
  }, [props.initialQuery, props.initialSource, props.initialResults]);

  function syncUrl(nextQuery: string, nextSource: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    if (nextSource && nextSource !== "All") params.set("source", nextSource);
    else params.delete("source");
    const qs = params.toString();
    router.replace(qs ? `/knowledge?${qs}` : "/knowledge");
  }

  function runSearch(nextQuery: string, nextSource: string) {
    setError(null);
    startTransition(async () => {
      try {
        const sources: SourceConnectorId[] | undefined =
          nextSource === "All" ? undefined : [nextSource as SourceConnectorId];
        const items = await searchKnowledgeAction({
          query: nextQuery,
          sources,
        });
        setResults(items);
        syncUrl(nextQuery, nextSource);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        id="knowledge"
        eyebrow="Knowledge"
        title="Search what Scout reads"
        purpose="The same read-only company sources Scout and the chatbot use: Salesforce, Jira, Confluence, Databricks, Datadog, GitHub and Power BI. Mock mode serves fictional Calastone demo documents."
        stats={[
          { label: "Connectors ready", value: `${props.health.filter((h) => h.ok).length} of ${props.health.length}` },
          { label: "Mode", value: props.health[0]?.mode ?? "mock" },
          { label: "Access", value: "Read only" },
        ]}
        visual={<ConnectorHealthStrip health={props.health} />}
      />

      <form
        className="rl-glass flex flex-col gap-3 rounded-[26px] p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query, source);
        }}
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by source">
          <button
            type="button"
            className={cn("rl-chip", source === "All" && "rl-chip-on")}
            aria-pressed={source === "All"}
            onClick={() => {
              setSource("All");
              runSearch(query, "All");
            }}
          >
            All
          </button>
          {ALL_SOURCES.map((id) => (
            <button
              key={id}
              type="button"
              className={cn("rl-chip", source === id && "rl-chip-on")}
              aria-pressed={source === id}
              onClick={() => {
                setSource(id);
                runSearch(query, id);
              }}
            >
              {connectorLabel(id)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <label className="sr-only" htmlFor="knowledge-q">
            Search knowledge
          </label>
          <input
            id="knowledge-q"
            className="rl-input min-w-0 flex-[1_1_280px]"
            type="search"
            value={query}
            placeholder="Search Confluence, Jira, GitHub and the other connected sources"
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="rl-btn-primary" disabled={pending}>
            {pending ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-[var(--relay-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <ResultsList
        results={results}
        query={query}
        pending={pending}
        onSuggest={(q) => {
          setQuery(q);
          runSearch(q, source);
        }}
      />
    </div>
  );
}

function ConnectorHealthStrip(props: { health: ConnectorHealthRow[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 p-0" aria-label="Connector health">
      {props.health.map((row) => (
        <li key={row.id} className="rounded-[14px] border border-[var(--relay-border)] bg-[var(--relay-surface)] px-3 py-2" title={row.detail}>
          <div className="flex items-center gap-2 text-sm text-[var(--relay-ink)]">
            <span className={cn("inline-block h-2 w-2 rounded-full", row.ok ? "bg-[var(--relay-success)]" : "bg-[var(--relay-warning)]")} aria-hidden />
            {row.label}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--relay-ink-subtle)]">{row.ok ? "Ready" : "Needs config"}</div>
        </li>
      ))}
    </ul>
  );
}

const SUGGESTIONS = ["ISIN", "NAV exception", "onboarding", "settlement", "dealing rules"];

function ResultsList(props: {
  results: SourceItem[];
  query: string;
  pending: boolean;
  onSuggest: (q: string) => void;
}) {
  if (!props.query.trim()) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-[var(--relay-ink-muted)]">
        <span>Try</span>
        {SUGGESTIONS.map((q) => (
          <button key={q} type="button" className="rl-chip rl-chip-compact" onClick={() => props.onSuggest(q)}>
            {q}
          </button>
        ))}
      </div>
    );
  }

  if (props.pending && props.results.length === 0) {
    return <p className="text-[var(--relay-ink-muted)]">Searching…</p>;
  }

  if (props.results.length === 0) {
    return (
      <p className="text-[var(--relay-ink-muted)]">
        No results for &quot;{props.query}&quot;. Try another term or clear the source filter.
      </p>
    );
  }

  return (
    <section aria-labelledby="results-h" className="flex flex-col gap-3">
      <h2 id="results-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
        Results
        <span className="ml-2 text-sm font-normal text-[var(--relay-ink-muted)] tabular">
          {props.results.length}
        </span>
      </h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-3 p-0">
        {props.results.map((item) => (
          <li key={`${item.connectorId}-${item.id}`} className="rl-sheet flex flex-col gap-2 p-5">
            <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">
              <span className="text-[var(--relay-brand-fg)]">
                {connectorLabel(item.connectorId as SourceConnectorId)}
              </span>
              {" · "}
              <span className="font-mono">{item.id}</span>
              {typeof item.score === "number" ? (
                <>
                  {" · "}
                  <span className="tabular">{Math.round(item.score * 100)}% match</span>
                </>
              ) : null}
            </p>
            <h3 className="m-0 text-[17px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">
              {item.title}
            </h3>
            <p className="m-0 text-sm text-[var(--relay-ink-body)]">{item.snippet}</p>
            {item.url ? (
              <a
                href={item.url}
                className="mt-1 text-sm text-[var(--relay-brand-fg)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open source
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
