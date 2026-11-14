import { createWorkstream } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewWorkstreamPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl rounded border border-[var(--relay-border)] bg-white p-6">
      <h1 className="font-display text-xl font-semibold">New workstream</h1>
      <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
        Capture the problem. You can start research from the workstream once Scout is wired.
      </p>
      <form action={createWorkstream} className="mt-6 space-y-4">
        <input type="hidden" name="ownerId" value={user.id} />
        <div className="block text-sm">
          <label htmlFor="title" className="mb-1 block text-[var(--relay-ink-muted)]">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            autoComplete="off"
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2 placeholder:text-[var(--relay-ink-subtle)]"
            placeholder="Short name for the piece of work…"
          />
        </div>
        <div className="block text-sm">
          <label
            htmlFor="problemStatement"
            className="mb-1 block text-[var(--relay-ink-muted)]"
          >
            Problem statement
          </label>
          <textarea
            id="problemStatement"
            name="problemStatement"
            required
            rows={5}
            autoComplete="off"
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2 placeholder:text-[var(--relay-ink-subtle)]"
            placeholder="What is broken or missing, and who feels it?"
          />
        </div>
        <div className="block text-sm">
          <label htmlFor="jiraKey" className="mb-1 block text-[var(--relay-ink-muted)]">
            Jira key (optional)
          </label>
          <input
            id="jiraKey"
            name="jiraKey"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2 font-mono placeholder:text-[var(--relay-ink-subtle)]"
            placeholder="INNO-123…"
          />
        </div>
        <div className="block text-sm">
          <label htmlFor="origin" className="mb-1 block text-[var(--relay-ink-muted)]">
            Origin
          </label>
          <select
            id="origin"
            name="origin"
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2"
            defaultValue="internal_friction"
          >
            <option value="internal_friction">Internal friction</option>
            <option value="external_opportunity">External opportunity</option>
            <option value="roadmap">Roadmap</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-[var(--relay-primary-fg)] transition-relay hover:bg-[var(--relay-primary-hover)]"
        >
          Create workstream
        </button>
      </form>
    </div>
  );
}
