import Link from "next/link";
import type { User } from "@prisma/client";
import { switchUser } from "@/app/actions";
import { CommandTrigger } from "@/components/command-trigger";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header(props: {
  appName: string;
  mockMode: boolean;
  currentUser: User;
  users: User[];
  agentsActive?: number;
}) {
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
    <header className="fixed inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-7 py-[18px]">
      <div className="flex flex-wrap items-baseline gap-3">
        <Link href="/" className="text-[15px] font-semibold tracking-[0.02em] text-[var(--relay-ink)]">
          {props.appName}
        </Link>
        <small className="text-[13px] text-[var(--relay-ink-muted)]">
          SS&amp;C Calastone · Innovation and Strategy
        </small>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CommandTrigger />
        <ThemeToggle />
        <div className="rl-glass flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-[13px] text-[var(--relay-ink)]">
          <span
            className="inline-flex h-2 w-2 rounded-full bg-[var(--relay-live)] animate-relay-pulse"
            aria-hidden
          />
          <span>{pillText}</span>
          {props.mockMode ? (
            <span className="text-[var(--relay-ink-body)]">Mock data</span>
          ) : null}
          <form action={switchUserBound} className="flex items-center gap-2">
            <label htmlFor="user-switcher" className="sr-only">
              Switch user
            </label>
            <select
              id="user-switcher"
              name="userId"
              defaultValue={props.currentUser.id}
              className="max-w-[160px] rounded-xl border-0 bg-transparent py-0.5 text-[13px] text-[var(--relay-ink-body)]"
            >
              {props.users.map((user) => (
                <option key={user.id} value={user.id} className="bg-[var(--relay-surface)] text-[var(--relay-ink)]">
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--relay-seg-person)] text-[12px] font-semibold text-[#0D131F]"
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
