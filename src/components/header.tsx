"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchUser } from "@/app/actions";
import { BrandLockup } from "@/components/brand-lockup";
import { CommandTrigger } from "@/components/command-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogHeader, DropdownMenu } from "@/components/ui/astryx";
import { useDemo, useRelayActions } from "@/lib/demo-store/provider";
import { currentUser, selectAgentsActive } from "@/lib/demo-store/selectors";

export type HeaderUser = { id: string; name: string; role: string };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header(props: {
  appName: string;
  mockMode: boolean;
  /** Database mode only; demo mode reads users from the browser store. */
  currentUser: HeaderUser;
  users: HeaderUser[];
}) {
  const actions = useRelayActions();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const demo = useDemo((s) => ({
    me: currentUser(s),
    users: s.users,
    agents: selectAgentsActive(s),
    speed: s.speed,
  }));

  const me = demo?.me ?? props.currentUser;
  const users = demo?.users ?? props.users;
  const agents = demo?.agents ?? 0;

  const pick = (userId: string) => {
    if (demo) {
      actions.switchUser(userId);
      return;
    }
    startTransition(async () => {
      await switchUser(userId);
      router.refresh();
    });
  };

  const presenter = demo
    ? [
        {
          type: "section" as const,
          title: "Presenter",
          items: [
            { label: "Take the guided tour", onClick: () => actions.setTour({ active: true, step: 0 }) },
            {
              label: demo.speed > 1 ? "Agents at normal speed" : "Agents at 4x speed",
              description: "How fast Scout, the Planner and the Runner move",
              onClick: () => actions.setSpeed(demo.speed > 1 ? 1 : 4),
            },
            { label: "Reset demo data", variant: "destructive" as const, onClick: () => setConfirmReset(true) },
          ],
        },
      ]
    : [];

  return (
    <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[var(--relay-border)] bg-[var(--relay-surface)] px-5">
      <BrandLockup appName={props.appName} />

      <div className="flex shrink-0 items-center gap-2">
        <CommandTrigger />
        <ThemeToggle />
        <div
          className="hidden items-center gap-2 rounded-full border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] px-3 py-1.5 text-[12.5px] text-[var(--relay-ink)] md:flex"
          aria-live="polite"
        >
          <span
            className={`inline-flex h-2 w-2 rounded-full ${agents > 0 ? "bg-[var(--relay-live)] animate-relay-pulse" : "bg-[var(--relay-ink-subtle)]"}`}
            aria-hidden
          />
          <span className="tabular">
            {agents > 0 ? `${agents} agent${agents === 1 ? "" : "s"} working` : "Agents idle"}
          </span>
          {props.mockMode ? <span className="hidden text-[var(--relay-ink-muted)] lg:inline">· Mock data</span> : null}
        </div>

        <DropdownMenu
          alignment="end"
          menuWidth={260}
          hasChevron={false}
          renderTrigger={(trigger) => (
            <button
              {...trigger}
              type="button"
              className="flex items-center gap-2 rounded-full border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] py-1 pl-1 pr-3 text-[12.5px] text-[var(--relay-ink)] transition-relay hover:border-[var(--relay-border-strong)]"
              aria-label={`Signed in as ${me.name}, ${me.role}. Switch user`}
              disabled={pending}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--relay-brand)] text-[11px] font-semibold text-white">
                {initials(me.name)}
              </span>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="font-medium">{me.name}</span>
                <span className="text-[11px] capitalize text-[var(--relay-ink-muted)]">{me.role}</span>
              </span>
            </button>
          )}
          items={[
            {
              type: "section",
              title: "Act as",
              items: users.map((u) => ({
                label: u.name,
                description: u.id === me.id ? `${u.role}, current` : u.role,
                onClick: () => pick(u.id),
                isDisabled: u.id === me.id,
              })),
            },
            ...presenter,
          ]}
        />
      </div>

      <Dialog isOpen={confirmReset} onOpenChange={setConfirmReset} purpose="required" width={420}>
        <DialogHeader title="Reset the demo?" subtitle="Your workstreams, comments and answers in this browser go back to the starting story." onOpenChange={setConfirmReset} />
        <div className="flex justify-end gap-2 p-4">
          <button type="button" className="rl-btn-second" onClick={() => setConfirmReset(false)}>
            Keep my changes
          </button>
          <button
            type="button"
            className="rl-btn-primary"
            onClick={async () => {
              setConfirmReset(false);
              await actions.reset();
            }}
          >
            Reset demo
          </button>
        </div>
      </Dialog>
    </header>
  );
}
