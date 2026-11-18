import type { User } from "@prisma/client";
import { switchUser } from "@/app/actions";
import { BrandLockup } from "@/components/brand-lockup";
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
    <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[var(--relay-border)] bg-[var(--relay-surface)] px-5">
      <BrandLockup appName={props.appName} />

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <CommandTrigger />
        <ThemeToggle />
        <div className="flex items-center gap-2.5 rounded-full border border-[var(--relay-border)] bg-[var(--relay-surface-muted)] py-1.5 pl-3 pr-1.5 text-[12.5px] text-[var(--relay-ink)]">
          <span
            className="inline-flex h-2 w-2 rounded-full bg-[var(--relay-live)] animate-relay-pulse"
            aria-hidden
          />
          <span className="hidden md:inline">{pillText}</span>
          {props.mockMode ? (
            <span className="hidden text-[var(--relay-ink-muted)] lg:inline">Mock data</span>
          ) : null}
          <form action={switchUserBound} className="flex items-center gap-1.5">
            <label htmlFor="user-switcher" className="sr-only">
              Switch user
            </label>
            <select
              id="user-switcher"
              name="userId"
              defaultValue={props.currentUser.id}
              className="max-w-[140px] rounded-lg border-0 bg-transparent py-0.5 text-[12.5px] text-[var(--relay-ink-body)]"
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--relay-brand)] text-[11px] font-semibold text-white"
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
