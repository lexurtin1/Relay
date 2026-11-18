import { IdeasContainer } from "@/components/containers/ideas-container";
import { IdeasBoard } from "@/components/ideas-board";
import { isDemoMode } from "@/lib/db";
import { getIdeasBoardData } from "@/lib/ideas";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function IdeasPage({ searchParams }: { searchParams?: Promise<{ draft?: string }> }) {
  const params = searchParams ? await searchParams : {};
  if (isDemoMode()) return <IdeasContainer draft={params.draft ?? ""} />;

  const user = await getCurrentUser();
  const data = await getIdeasBoardData();
  const canTriage = user?.role === "lead" || user?.role === "architect";
  return <IdeasBoard items={data.items} workstreamOptions={data.workstreamOptions} draft={params.draft ?? ""} canTriage={Boolean(canTriage)} />;
}
