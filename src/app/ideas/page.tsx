import { Suspense } from "react";
import { IdeasBoard } from "@/components/ideas-board";
import { listIdeas } from "@/lib/ideas";
import { getCurrentUser } from "@/lib/session";
import type { IdeaStatus, IdeaType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; type?: string; draft?: string; promoted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return <p className="text-sm text-[var(--relay-ink-muted)]">Sign in required.</p>;
  }

  const params = searchParams ? await searchParams : {};
  const status = (params.status as IdeaStatus | "all" | undefined) ?? "all";
  const type = (params.type as IdeaType | "all" | undefined) ?? "all";
  const ideas = await listIdeas({ status, type });

  return (
    <Suspense fallback={<p className="text-[var(--relay-ink-muted)]">Loading ideas…</p>}>
      <IdeasBoard
        ideas={ideas}
        role={user.role}
        draft={params.draft}
        flash={
          params.promoted
            ? `Promoted "${params.promoted}". In demo mode the workstream link is a stub until Postgres is connected.`
            : null
        }
      />
    </Suspense>
  );
}
