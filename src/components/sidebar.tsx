"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
        <rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/workstreams",
    label: "Workstreams",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
        <path
          d="M4 7h9M16 7h4M4 12h4M11 12h9M4 17h12M19 17h1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/ideas",
    label: "Ideas",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
        <path
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0 0 12 3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
        <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M20 20l-4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/metrics",
    label: "Metrics",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
        <path
          d="M5 20V10M12 20V4M19 20v-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="rl-sidebar relative z-20 flex shrink-0 flex-col border-r border-[var(--relay-border)] bg-[var(--relay-surface)]">
      <nav aria-label="Sections" className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "rl-sidebar-link flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] font-medium text-[var(--relay-ink-body)] transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)]",
                active && "rl-sidebar-link-active",
              )}
            >
              <span className="inline-flex shrink-0">{item.icon}</span>
              <span className="rl-sidebar-label truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
