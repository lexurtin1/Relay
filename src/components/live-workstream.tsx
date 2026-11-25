"use client";

import { useEffect, useState } from "react";
import { WorkstreamDetail } from "@/components/workstream-detail";
import type { RunnerView, WorkstreamDetailModel } from "@/lib/view-models";

type Snapshot = {
  stage: WorkstreamDetailModel["stage"];
  runner: RunnerView | null;
  terminal: boolean;
};

/** Keeps the existing workstream page in sync with Runner events. */
export function LiveWorkstream(props: { initial: WorkstreamDetailModel }) {
  const [model, setModel] = useState(props.initial);
  const working = model.runner?.status === "provisioning" || model.runner?.status === "running";

  useEffect(() => {
    setModel(props.initial);
  }, [props.initial]);

  useEffect(() => {
    if (!working) return;
    const source = new EventSource(`/api/workstreams/${model.id}/events`);
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as Snapshot;
      setModel((current) => ({
        ...current,
        stage: data.stage,
        runner: data.runner,
      }));
      if (data.terminal) source.close();
    };
    return () => source.close();
  }, [model.id, working]);

  return <WorkstreamDetail model={model} />;
}
