import { IdeasBoard } from "@/components/ideas-board";
import { getIdeasBoardData } from "@/lib/ideas";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const user = await getCurrentUser();
  const data = await getIdeasBoardData();
  const canTriage = user?.role === "lead" || user?.role === "architect";

  return (
    <IdeasBoard
      items={data.items}
      workstreamOptions={data.workstreamOptions}
      draft={params.draft ?? ""}
      canTriage={Boolean(canTriage)}
    />
  );
}
