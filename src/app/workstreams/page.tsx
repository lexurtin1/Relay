import { WorkstreamsList } from "@/components/workstreams-list";
import { getOverviewData } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function WorkstreamsPage() {
  const data = await getOverviewData();
  return <WorkstreamsList rows={data.rows} />;
}
