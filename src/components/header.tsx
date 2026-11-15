"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";
import { switchUserForm } from "@/app/actions";
import { CommandTrigger } from "@/components/command-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/workstreams", label: "Workstreams" },
  { href: "/knowledge", label: "Knowledge" },
] as const;

export function Header(props: {
  appName: string;
  mockMode: boolean;
  currentUser: User;
  users: User[];
  agentsActive?: number;
}) {
  const pathname = usePathname() ?? "/";
  const initials = props.currentUser.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const agents = props.agentsActive ?? 0;
  const pillText =
    agents > 0
      ? `${agents} agent${agents === 1 ? "" : "s"} running`
      : "Workspace ready";

  return (
    <header className="rl-glass fixed inset-x-0 top-0 z-30 border-b border-[var(--relay-glass-border)] px-7 py-3">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-[0.02em] text-[var(--relay-ink)] no-underline"
            >
              {props.appName}
            </Link>
            <small className="hidden text-[12.5px] text-[var(--relay-ink-muted)] sm:inline">
              SS&amp;C Calastone
            </small>
          </div>
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-[13px] no-underline transition-relay",
                    active
                      ? "bg-[color-mix(in_srgb,var(--relay-ink)_14%,transparent)] text-[var(--relay-ink)]"
                      : "text-[var(--relay-ink-body)] hover:bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)] hover:text-[var(--relay-ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CommandTrigger />
          <ThemeToggle />
          <div className="flex items-center gap-3 rounded-full border border-[var(--relay-glass-border)] bg-[color-mix(in_srgb,var(--relay-surface)_70%,transparent)] py-1.5 pl-3 pr-1.5 text-[12.5px] text-[var(--relay-ink)]">
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                agents > 0
                  ? "bg-[var(--relay-live)] animate-relay-pulse"
                  : "bg-[var(--relay-ink-muted)]",
              )}
              aria-hidden
            />
            <span>{pillText}</span>
            {props.mockMode ? (
              <span className="text-[var(--relay-ink-muted)]">Mock</span>
            ) : null}
            <form action={switchUserForm} className="flex items-center gap-2">
              <label htmlFor="user-switcher" className="sr-only">
                Switch user
              </label>
              <select
                id="user-switcher"
                name="userId"
                defaultValue={props.currentUser.id}
                className="max-w-[140px] rounded-xl border-0 bg-transparent py-0.5 text-[12.5px] text-[var(--relay-ink-body)]"
              >
                {props.users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                    className="bg-[var(--relay-surface)] text-[var(--relay-ink)]"
                  >
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[var(--relay-seg-person)] text-[11px] font-semibold text-[#0D131F]"
                title={`Signed in as ${props.currentUser.name}`}
              >
                {initials}
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
