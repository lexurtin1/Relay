"use client";

import { OverviewPageView } from "@/components/overview";
import { useDemo } from "@/lib/demo-store/provider";
import {
  selectAgentsActive,
  selectNeedsAction,
  selectRows,
  selectStageCounts,
  selectStats,
} from "@/lib/demo-store/selectors";

export function OverviewContainer(props: { appName: string }) {
  const data = useDemo((s) => ({
    stats: selectStats(s, Date.now()),
    needsAction: selectNeedsAction(s),
    rows: selectRows(s),
    agentsActive: selectAgentsActive(s),
    stageCounts: selectStageCounts(s),
  }));
  if (!data) return null;
  return <OverviewPageView appName={props.appName} {...data} />;
}
