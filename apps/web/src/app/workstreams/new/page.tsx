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
      <h1 className="text-xl font-semibold">New workstream</h1>
      <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">
        Capture the problem. Research starts in a later milestone; for now this creates the record.
      </p>
      <form action={createWorkstream} className="mt-6 space-y-4">
        <input type="hidden" name="ownerId" value={user.id} />
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--relay-ink-muted)]">Title</span>
          <input
            name="title"
            required
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2"
            placeholder="Short name for the piece of work"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--relay-ink-muted)]">Problem statement</span>
          <textarea
            name="problemStatement"
            required
            rows={5}
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2"
            placeholder="What is broken or missing, and who feels it?"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--relay-ink-muted)]">Jira key (optional)</span>
          <input
            name="jiraKey"
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2"
            placeholder="INNO-123"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--relay-ink-muted)]">Origin</span>
          <select
            name="origin"
            className="w-full rounded border border-[var(--relay-border)] px-3 py-2"
            defaultValue="internal_friction"
          >
            <option value="internal_friction">Internal friction</option>
            <option value="external_opportunity">External opportunity</option>
            <option value="roadmap">Roadmap</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-[var(--relay-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--relay-primary-hover)]"
        >
          Create workstream
        </button>
      </form>
    </div>
  );
}
