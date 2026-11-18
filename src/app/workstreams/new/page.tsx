import { NewWorkstreamForm } from "@/components/new-workstream-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewWorkstreamPage({ searchParams }: { searchParams?: Promise<{ title?: string }> }) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <p className="rl-eyebrow">New workstream</p>
        <h1 className="m-0 mt-1 text-[clamp(26px,3vw,36px)] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--relay-ink)]">
          Create a workstream
        </h1>
      </div>
      <NewWorkstreamForm ownerId={user.id} defaultTitle={params.title ?? ""} />
    </div>
  );
}
