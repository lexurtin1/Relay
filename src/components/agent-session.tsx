"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { generatePlanAction, startResearchAction } from "@/app/actions/agents";
import { ActivityTimeline, type ActivityEventView } from "@/components/activity-timeline";

export function AgentSessionPanel(props: {
  workstreamId: string;
  initialEvents: ActivityEventView[];
  canResearch: boolean;
  canPlan: boolean;
  researchSummary: string | null;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(props.initialEvents);
  const [status, setStatus] = useState<string>("idle");
  const [summary, setSummary] = useState(props.researchSummary);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const refreshedFor = useRef<string | null>(null);

  useEffect(() => {
    setEvents(props.initialEvents);
    setSummary(props.researchSummary);
  }, [props.initialEvents, props.researchSummary]);

  useEffect(() => {
    const source = new EventSource(`/api/workstreams/${props.workstreamId}/events`);
    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as {
          type: string;
          events?: ActivityEventView[];
          researchStatus?: string;
          planStatus?: string;
          researchSummary?: string | null;
        };
        if (data.type === "snapshot") {
          if (data.events) setEvents(data.events);
          if (data.researchSummary) setSummary(data.researchSummary);
          if (data.researchStatus === "running" || data.planStatus === "running") {
            setStatus("running");
          } else if (data.researchStatus === "succeeded" || data.planStatus === "succeeded") {
            setStatus("ready");
            const key = `${data.researchStatus}:${data.planStatus}:${data.events?.length ?? 0}`;
            if (refreshedFor.current !== key) {
              refreshedFor.current = key;
              router.refresh();
            }
          }
        }
      } catch {
        // ignore malformed chunks
      }
    };
    return () => source.close();
  }, [props.workstreamId, router]);

  function runResearch() {
    setFlash(null);
    startTransition(async () => {
      await startResearchAction(props.workstreamId);
      setFlash("Scout started. Live events stream below.");
      setStatus("running");
    });
  }

  function runPlan() {
    setFlash(null);
    startTransition(async () => {
      await generatePlanAction(props.workstreamId);
      setFlash("Planner started. Plan appears when drafting finishes.");
      setStatus("running");
    });
  }

  const canPlanNow = props.canPlan || Boolean(summary);

  return (
    <section className="rl-sheet min-w-0 flex-[1_1_300px] p-6" aria-labelledby="rl-sess-h">
      <h2 id="rl-sess-h" className="m-0 text-xl font-medium text-[var(--relay-ink)]">
        Agent session
      </h2>
      <p className="mt-1.5 text-[13px] text-[var(--relay-ink-muted)]">
        Scout researches connected sources. Planner drafts an implementation plan. Activity streams
        live while agents run.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rl-btn-second"
          disabled={pending || !props.canResearch}
          onClick={runResearch}
        >
          {pending && status === "running" ? "Working…" : "Ask Scout to research"}
        </button>
        <button
          type="button"
          className="rl-btn-second"
          disabled={pending || !canPlanNow}
          onClick={runPlan}
        >
          Ask Planner to draft a plan
        </button>
      </div>

      {flash ? <p className="mt-3 text-sm text-[var(--relay-brand-fg)]">{flash}</p> : null}

      {summary ? (
        <div className="mt-4 rounded-[14px] border border-[var(--relay-border)] p-3 text-sm text-[var(--relay-ink-body)]">
          <div className="text-[11.5px] uppercase tracking-[0.06em] text-[var(--relay-brand-fg)]">
            Findings
          </div>
          <pre className="mt-2 whitespace-pre-wrap font-[var(--relay-font-ui)] text-sm leading-relaxed">
            {summary}
          </pre>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--relay-ink-subtle)]">
          Live activity
        </h3>
        <ActivityTimeline events={events} />
      </div>
    </section>
  );
}
