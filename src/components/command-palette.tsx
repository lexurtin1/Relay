"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FilePlus2, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { WorkstreamStage } from "@relay/core/domain";
import { stageLabel } from "@relay/core/domain";
import { useDemo, useRelayActions } from "@/lib/demo-store/provider";
import { selectCommandItems } from "@/lib/demo-store/selectors";

export type CommandWorkstream = {
  id: string;
  title: string;
  jiraKey: string | null;
  stage: WorkstreamStage;
};

export function CommandPalette(props: { workstreams: CommandWorkstream[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const actions = useRelayActions();
  const live = useDemo(selectCommandItems);
  const workstreams = live ?? props.workstreams;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(6,10,18,0.55)] px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default"
        onClick={() => setOpen(false)}
      />
      <Command
        label="Command palette"
        className="rl-glass relative z-10 w-full max-w-xl overflow-hidden rounded-[22px] animate-relay-in [overscroll-behavior:contain]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--relay-border)] px-3">
          <Search className="h-4 w-4 text-[var(--relay-ink-subtle)]" aria-hidden />
          <Command.Input
            placeholder="Jump to a workstream or create one…"
            autoComplete="off"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[var(--relay-ink-subtle)]"
          />
          <kbd className="rounded-xl border border-[var(--relay-border)] px-1.5 py-0.5 text-[10px] text-[var(--relay-ink-subtle)]">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2 text-sm">
          <Command.Empty className="px-2 py-6 text-center text-[var(--relay-ink-muted)]">
            No matching workstreams.
          </Command.Empty>
          <Command.Group heading="Actions" className="px-1 py-1 text-xs text-[var(--relay-ink-subtle)]">
            <Command.Item
              value="create new workstream"
              onSelect={() => {
                setOpen(false);
                router.push("/workstreams/new");
              }}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-[var(--relay-ink)] aria-selected:bg-[var(--relay-surface-sunken)]"
            >
              <FilePlus2 className="h-4 w-4 text-[var(--relay-primary)]" aria-hidden />
              <span>New workstream</span>
            </Command.Item>
            {actions.mode === "demo" ? (
              <>
                <Command.Item
                  value="open audit log"
                  onSelect={() => {
                    setOpen(false);
                    router.push("/audit");
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-[var(--relay-ink)] aria-selected:bg-[var(--relay-surface-sunken)]"
                >
                  <ShieldCheck className="h-4 w-4 text-[var(--relay-primary)]" aria-hidden />
                  <span>Open audit log</span>
                </Command.Item>
                <Command.Item
                  value="reset demo data"
                  onSelect={() => {
                    setOpen(false);
                    void actions.reset();
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-[var(--relay-ink)] aria-selected:bg-[var(--relay-surface-sunken)]"
                >
                  <RotateCcw className="h-4 w-4 text-[var(--relay-primary)]" aria-hidden />
                  <span>Reset demo data</span>
                </Command.Item>
              </>
            ) : null}
          </Command.Group>
          <Command.Group
            heading="Workstreams"
            className="px-1 py-1 text-xs text-[var(--relay-ink-subtle)]"
          >
            {workstreams.map((item) => (
              <Command.Item
                key={item.id}
                value={`${item.title} ${item.jiraKey ?? ""} ${item.stage}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/workstreams/${item.id}`);
                }}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-[var(--relay-ink)] aria-selected:bg-[var(--relay-surface-sunken)]"
              >
                <span className="truncate">{item.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-[11px] text-[var(--relay-ink-muted)]">
                  {item.jiraKey ? (
                    <span className="font-mono">{item.jiraKey}</span>
                  ) : null}
                  <span className="capitalize">{stageLabel(item.stage)}</span>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
