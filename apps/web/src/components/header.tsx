import Image from "next/image";
import Link from "next/link";
import type { User } from "@prisma/client";
import { switchUser } from "@/app/actions";
import { CommandTrigger } from "@/components/command-trigger";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/workstreams", label: "Workstreams" },
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
  const path = props.currentPath ?? "/";
  const initials = props.currentUser.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b border-[#1f2430] bg-[#0f141d] text-white">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-5 px-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/brand/logo-on-dark.png"
            alt="SS&C Calastone"
            width={168}
            height={48}
            className="h-7 w-auto bg-transparent object-contain object-left"
            unoptimized
            priority
          />
          <span className="h-5 w-px bg-white/20" aria-hidden />
          <span className="font-display text-[17px] font-semibold tracking-tight">
            {props.appName}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-0.5 text-sm text-white/70"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? path === "/"
                : path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-2.5 py-1.5 transition-relay hover:bg-white/10 hover:text-white ${
                  active ? "bg-white/10 font-medium text-white" : ""
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
            <span className="rounded-full border border-[color-mix(in_srgb,var(--relay-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--relay-primary)_18%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[#d7d2ff]">
              Mock data
            </span>
          ) : null}

          <form action={switchUserBound} className="flex items-center gap-2 text-sm">
            <label htmlFor="user-switcher" className="sr-only">
              Switch user
            </label>
            <select
              id="user-switcher"
              name="userId"
              defaultValue={props.currentUser.id}
              className="max-w-[180px] rounded-xl border border-white/15 bg-[#171d29] px-2 py-1 text-white"
            >
              {props.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--relay-primary)] text-[11px] font-semibold text-white"
              title={`Signed in as ${props.currentUser.name}`}
            >
              {initials}
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
