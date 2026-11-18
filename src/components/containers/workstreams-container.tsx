"use client";

import { WorkstreamsList } from "@/components/workstreams-list";
import { useDemo } from "@/lib/demo-store/provider";
import { selectAgentsActive, selectRows, selectStageCounts } from "@/lib/demo-store/selectors";

export function WorkstreamsContainer() {
  const data = useDemo((s) => ({
    rows: selectRows(s),
    stageCounts: selectStageCounts(s),
    agentsActive: selectAgentsActive(s),
  }));
  if (!data) return null;
  return <WorkstreamsList {...data} />;
}
