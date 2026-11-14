import Image from "next/image";
import Link from "next/link";
import type { User } from "@prisma/client";
import { switchUser } from "@/app/actions";
import { CommandTrigger } from "@/components/command-trigger";


const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/ideas", label: "Ideas" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/metrics", label: "Metrics" },
  { href: "/audit", label: "Audit" },
];

export function Header(props: {
  appName: string;
  mockMode: boolean;
  currentUser: User;
  users: User[];
  currentPath?: string;
}) {
  return (
    <header className="border-b border-[var(--relay-border)] bg-[var(--relay-surface)]">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/brand/logo-header.png"
            alt="SS&C Calastone"
            width={168}
            height={48}
            className="h-7 w-auto bg-transparent object-contain object-left"
            unoptimized
            priority
          />
          <span className="h-5 w-px bg-[var(--relay-border-strong)]" aria-hidden />
          <span className="font-display text-[17px] font-semibold tracking-tight text-[var(--relay-ink)]">
            {props.appName}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-0.5 text-sm text-[var(--relay-ink-muted)]"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? props.currentPath === "/"
                : props.currentPath?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2.5 py-1.5 transition-relay hover:bg-[var(--relay-surface-sunken)] hover:text-[var(--relay-ink)] ${
                  active
                    ? "bg-[var(--relay-surface-sunken)] font-medium text-[var(--relay-ink)]"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <CommandTrigger />


          {props.mockMode ? (
            <span className="rounded border border-[var(--relay-border-strong)] bg-[var(--relay-surface)] px-2 py-0.5 text-xs font-medium text-[var(--relay-ink-muted)]">
              Mock mode
            </span>
          ) : null}

          <form action={switchUserBound} className="flex items-center gap-2 text-sm">
            <label htmlFor="user-switcher" className="text-[var(--relay-ink-muted)]">
              User
            </label>
            <select
              id="user-switcher"
              name="userId"
              defaultValue={props.currentUser.id}
              className="max-w-[220px] rounded border border-[var(--relay-border)] bg-white px-2 py-1 text-[var(--relay-ink)]"
            >
              {props.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded border border-[var(--relay-border)] px-2 py-1 text-xs text-[var(--relay-ink-muted)] transition-relay hover:bg-[var(--relay-surface-muted)]"
            >
              Switch
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

async function switchUserBound(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  if (userId) await switchUser(userId);
}
