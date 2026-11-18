"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type CommandBarMode = "research" | "idea" | "find";

const MODES: Array<{
  id: CommandBarMode;
  label: string;
  ph: string;
}> = [
  {
    id: "research",
    label: "Research",
    ph: "Describe the problem. Scout searches company sources.",
  },
  {
    id: "idea",
    label: "Log idea",
    ph: "Describe the friction or the external signal",
  },
  {
    id: "find",
    label: "Search",
    ph: "Search Confluence, Jira, GitHub and connected sources",
  },
];

export function CommandBar(props: {
  defaultMode?: CommandBarMode;
  initialDraft?: string;
  className?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CommandBarMode>(props.defaultMode ?? "research");
  const [draft, setDraft] = useState(props.initialDraft ?? "");
  const current = MODES.find((m) => m.id === mode) ?? MODES[0]!;

  function go(e?: FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (mode === "find") {
      if (!q) return;
      router.push(`/knowledge?q=${encodeURIComponent(q)}`);
      return;
    }
    if (mode === "idea") {
      router.push(q ? `/ideas?draft=${encodeURIComponent(q)}` : "/ideas");
      return;
    }
    router.push(q ? `/workstreams/new?title=${encodeURIComponent(q)}` : "/workstreams/new");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  return (
    <section
      aria-label="Command bar"
      className={cn(
        "rl-sheet rl-sheet-elevated flex flex-wrap items-center gap-2.5 p-3",
        props.className,
      )}
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type of work">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cn("rl-chip rl-chip-compact", mode === m.id && "rl-chip-on")}
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <form className="flex min-w-0 flex-[1_1_220px] flex-wrap items-center gap-2" onSubmit={go}>
        <label className="sr-only" htmlFor="rl-command-bar-in">
          Describe what you need
        </label>
        <input
          id="rl-command-bar-in"
          className="rl-input rl-input-compact min-w-0 flex-[1_1_180px]"
          type="text"
          value={draft}
          placeholder={current.ph}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        <button
          type="submit"
          className="rl-btn-second rl-btn-compact shrink-0 px-4"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
