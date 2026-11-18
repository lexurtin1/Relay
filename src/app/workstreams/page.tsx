import { WorkstreamsContainer } from "@/components/containers/workstreams-container";
import { WorkstreamsList } from "@/components/workstreams-list";
import { isDemoMode } from "@/lib/db";
import { getOverviewData } from "@/lib/overview";
import { stageCountsFromRows } from "@/lib/stage-counts";

export const dynamic = "force-dynamic";

export default async function WorkstreamsPage() {
  if (isDemoMode()) return <WorkstreamsContainer />;
  const data = await getOverviewData();
  return <WorkstreamsList rows={data.rows} stageCounts={stageCountsFromRows(data.rows)} agentsActive={data.agentsActive} />;
}
