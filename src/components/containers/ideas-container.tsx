"use client";

import { IdeasBoard } from "@/components/ideas-board";
import { useDemo } from "@/lib/demo-store/provider";
import { can } from "@/lib/demo-store/permissions";
import { selectIdeas } from "@/lib/demo-store/selectors";

export function IdeasContainer(props: { draft: string }) {
  const data = useDemo((s) => ({ ...selectIdeas(s), triage: can(s, "triage_idea") }));
  if (!data) return null;
  return (
    <IdeasBoard
      items={data.items}
      workstreamOptions={data.workstreamOptions}
      draft={props.draft}
      canTriage={data.triage.ok}
      triageReason={data.triage.reason}
    />
  );
}
