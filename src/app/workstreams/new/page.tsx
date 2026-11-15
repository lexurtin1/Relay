import { createWorkstream } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewWorkstreamPage({
  searchParams,
}: {
  searchParams?: Promise<{ title?: string }>;
}) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--relay-ink)]">
          New workstream
        </h1>
        <p className="mt-2 text-[var(--relay-ink-muted)]">
          Capture the problem. You can start research from the workstream once Scout is wired.
        </p>
      </div>
      <form action={createWorkstream} className="rl-sheet flex flex-col gap-4 p-6">
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
            defaultValue={params.title ?? ""}
            className="rl-input w-full"
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
            className="rl-input w-full py-3"
            style={{ minHeight: 120 }}
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
            className="rl-input w-full font-mono"
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
            className="rl-input w-full"
            defaultValue="internal_friction"
          >
            <option value="internal_friction">Internal friction</option>
            <option value="external_opportunity">External opportunity</option>
            <option value="roadmap">Roadmap</option>
          </select>
        </div>
        <button type="submit" className="rl-btn-primary self-start">
          Create workstream
        </button>
      </form>
    </div>
  );
}
