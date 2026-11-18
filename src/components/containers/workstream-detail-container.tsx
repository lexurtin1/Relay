"use client";

import Link from "next/link";
import { WorkstreamDetail } from "@/components/workstream-detail";
import { EmptyState } from "@/components/ui/astryx";
import { useDemo } from "@/lib/demo-store/provider";
import { selectDetail } from "@/lib/demo-store/selectors";

export function WorkstreamDetailContainer(props: { id: string }) {
  const model = useDemo((s) => selectDetail(s, props.id));
  if (!model) {
    return (
      <div className="rl-sheet mx-auto mt-10 max-w-xl p-8">
        <EmptyState
          title="This workstream is not in your demo"
          description="It may have been created before a demo reset, or in another browser. Demo data lives in this browser only."
          actions={
            <Link href="/workstreams" className="rl-btn-primary rl-btn-compact inline-flex items-center no-underline">
              See all workstreams
            </Link>
          }
        />
      </div>
    );
  }
  return <WorkstreamDetail model={model} />;
}
