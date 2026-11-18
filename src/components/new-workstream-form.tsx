"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GitPullRequest, Hammer, ListChecks, Search, UserCheck } from "lucide-react";
import { createWorkstream } from "@/app/actions";
import { useRelayActions } from "@/lib/demo-store/provider";

const NEXT = [
  { icon: Search, title: "Scout researches", body: "Reads Jira, Confluence, Datadog and GitHub, read only, and writes findings." },
  { icon: ListChecks, title: "The Planner drafts", body: "Turns findings into ordered steps with files, tests and risk." },
  { icon: UserCheck, title: "People review", body: "Teammates comment; an architect or lead approves." },
  { icon: Hammer, title: "The Runner builds", body: "Works in an isolated workspace and pauses to ask you." },
  { icon: GitPullRequest, title: "You merge", body: "Checks pass, you merge, Metrics and Audit update." },
];

export function NewWorkstreamForm(props: { ownerId: string; defaultTitle: string }) {
  const actions = useRelayActions();
  const router = useRouter();
  const [title, setTitle] = useState(props.defaultTitle);
  const [problem, setProblem] = useState("");
  const [jiraKey, setJiraKey] = useState("");
  const [origin, setOrigin] = useState<"internal_friction" | "external_opportunity" | "roadmap">("internal_friction");

  const submitDemo = (e: FormEvent) => {
    e.preventDefault();
    const id = actions.createWorkstream({ title, problemStatement: problem, jiraKey: jiraKey || undefined, origin });
    if (id) router.push(`/workstreams/${id}`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <form
        action={actions.mode === "database" ? createWorkstream : undefined}
        onSubmit={actions.mode === "demo" ? submitDemo : undefined}
        className="rl-sheet rl-sheet-elevated flex flex-col gap-4 p-6"
      >
        <input type="hidden" name="ownerId" value={props.ownerId} />
        <div className="text-sm">
          <label htmlFor="title" className="mb-1 block font-medium text-[var(--relay-ink)]">
            Title
          </label>
          <input id="title" name="title" required autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} className="rl-input w-full" placeholder="Short, outcome-led name" />
        </div>
        <div className="text-sm">
          <label htmlFor="problemStatement" className="mb-1 block font-medium text-[var(--relay-ink)]">
            Problem statement
          </label>
          <textarea
            id="problemStatement"
            name="problemStatement"
            required
            rows={5}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="rl-input w-full py-3"
            style={{ minHeight: 120 }}
            placeholder="What is broken or missing, who feels it, and what good looks like"
          />
          <p className="m-0 mt-1 text-[12px] text-[var(--relay-ink-muted)]">Scout starts from this text, so name the system and the people affected.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-sm">
            <label htmlFor="jiraKey" className="mb-1 block font-medium text-[var(--relay-ink)]">
              Jira key <span className="font-normal text-[var(--relay-ink-muted)]">(optional)</span>
            </label>
            <input id="jiraKey" name="jiraKey" value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} autoComplete="off" spellCheck={false} className="rl-input w-full font-mono" placeholder="INNO-123" />
          </div>
          <div className="text-sm">
            <label htmlFor="origin" className="mb-1 block font-medium text-[var(--relay-ink)]">
              Origin
            </label>
            <select id="origin" name="origin" value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)} className="rl-input w-full">
              <option value="internal_friction">Internal friction</option>
              <option value="external_opportunity">External opportunity</option>
              <option value="roadmap">Roadmap</option>
            </select>
          </div>
        </div>
        <button type="submit" className="rl-btn-primary self-start">
          {actions.mode === "demo" ? "Create and start research" : "Create workstream"}
        </button>
      </form>

      <aside className="rl-sheet flex flex-col gap-4 p-6" aria-labelledby="next-h">
        <div>
          <p className="rl-eyebrow">What happens next</p>
          <h2 id="next-h" className="m-0 mt-1 text-[17px] font-medium text-[var(--relay-ink)]">
            The relay, leg by leg
          </h2>
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {NEXT.map((n, i) => (
            <li key={n.title} className="flex gap-3">
              <span className="relative flex flex-col items-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--relay-border-strong)] bg-[var(--relay-surface)] text-[var(--relay-brand-fg)]">
                  <n.icon className="h-4 w-4" aria-hidden />
                </span>
                {i < NEXT.length - 1 ? <span className="mt-1 w-px flex-1 bg-[var(--relay-border-strong)]" aria-hidden /> : null}
              </span>
              <span className="pb-1">
                <span className="block text-[13.5px] font-medium text-[var(--relay-ink)]">{n.title}</span>
                <span className="block text-[12.5px] text-[var(--relay-ink-muted)]">{n.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
