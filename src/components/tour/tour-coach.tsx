"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useDemo, useDemoStore, useRelayActions } from "@/lib/demo-store/provider";
import { TOUR_STEPS, TOUR_TITLE, type TourCtx } from "./tour-steps";

/**
 * Guided happy path for presenters. A coach card at the bottom left walks the
 * whole relay; "Do it for me" performs each step as the right person, and Next
 * unlocks when the agents have finished their part.
 */
export function TourCoach() {
  const store = useDemoStore();
  const actions = useRelayActions();
  const router = useRouter();
  const pathname = usePathname();
  const tour = useDemo((s) => s.ui.tour);
  const state = useDemo((s) => s);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const active = Boolean(tour?.active);
  const index = tour?.step ?? 0;
  const step = TOUR_STEPS[index];
  const wsId = tour?.wsId ?? null;
  const ws = wsId && state ? (state.workstreams[wsId] ?? null) : null;
  const route = step ? (typeof step.route === "function" ? step.route(wsId) : step.route) : "/";

  // Speed the agents up while touring, and back down afterwards.
  useEffect(() => {
    if (!state) return;
    if (active && state.speed < 4) actions.setSpeed(4);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active && pathname !== route) router.push(route);
  }, [active, index, route]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the element this step talks about.
  useEffect(() => {
    if (!active || !step?.target) return;
    let el: Element | null = null;
    const apply = () => {
      el?.classList.remove("rl-tour-target");
      el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.classList.add("rl-tour-target");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    const t = window.setTimeout(apply, 250);
    return () => {
      window.clearTimeout(t);
      el?.classList.remove("rl-tour-target");
    };
  }, [active, index, pathname, step?.target, ws?.stage]);

  if (!store || !state || !hydrated) return null;

  // The Overview hero and the command palette start the tour; no floating prompt.
  if (!active) return null;

  if (!step) return null;

  const ctx: TourCtx = {
    state,
    ws,
    actions,
    setWs: (id) => store.dispatch({ type: "SET_TOUR", tour: { active: true, step: index, wsId: id } }),
  };
  const done = step.done ? step.done(ctx) : true;
  const last = index === TOUR_STEPS.length - 1;

  const go = (next: number) => {
    const current = store.getState().ui.tour;
    actions.setTour({ active: true, step: next, wsId: current?.wsId ?? wsId });
  };

  const finish = () => {
    actions.setTour(null);
    actions.setSpeed(1);
  };

  const doIt = async () => {
    if (!step.run) return;
    setBusy(true);
    try {
      if (step.actAs && store.getState().currentUserId !== step.actAs) actions.switchUser(step.actAs);
      // Re-read state after switching so the step acts on fresh data.
      const fresh = store.getState();
      const freshWsId = fresh.ui.tour?.wsId ?? wsId;
      await step.run({ ...ctx, state: fresh, ws: freshWsId ? (fresh.workstreams[freshWsId] ?? null) : null });
    } finally {
      setBusy(false);
    }
  };

  const actor = step.actAs ? state.users.find((u) => u.id === step.actAs) : null;

  return (
    <aside
      className="rl-glass fixed bottom-28 left-4 z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-[18px] p-4 animate-relay-in min-[901px]:left-[calc(var(--relay-sidebar-width)+16px)]"
      aria-label="Guided tour"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="rl-eyebrow">
          Tour · step {index + 1} of {TOUR_STEPS.length}
        </p>
        <button type="button" onClick={finish} className="-mr-1 -mt-1 rounded-lg p-1 text-[var(--relay-ink-muted)] hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)]" aria-label="End the tour">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--relay-surface-sunken)]" aria-hidden>
        <div className="h-full rounded-full bg-[var(--relay-brand)] transition-[width] duration-300" style={{ width: `${((index + 1) / TOUR_STEPS.length) * 100}%` }} />
      </div>
      <h2 className="m-0 mt-3 text-[16px] font-medium tracking-[-0.01em] text-[var(--relay-ink)]">{step.title}</h2>
      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-[var(--relay-ink-body)]">{step.body}</p>
      {actor ? <p className="m-0 mt-2 text-[12px] text-[var(--relay-ink-muted)]">Acting as {actor.name} ({actor.role})</p> : null}
      {!done && !step.run && step.waiting ? (
        <p className="m-0 mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--relay-brand-fg)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          {step.waiting}
        </p>
      ) : null}
      {!done && step.run && step.waiting && ws && step.id !== "start" && !canRunNow(step.id, ws) ? (
        <p className="m-0 mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--relay-brand-fg)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          {step.waiting}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {step.run && !done ? (
          <button
            type="button"
            className="rl-btn-primary rl-btn-tiny"
            onClick={doIt}
            disabled={busy || (ws !== null && step.id !== "start" && !canRunNow(step.id, ws))}
          >
            {step.doLabel ?? "Do it for me"}
          </button>
        ) : null}
        {index > 0 ? (
          <button type="button" className="rl-btn-second rl-btn-tiny" onClick={() => go(index - 1)}>
            Back
          </button>
        ) : null}
        {last ? (
          <button type="button" className="rl-btn-primary rl-btn-tiny" onClick={finish}>
            Finish
          </button>
        ) : (
          <button type="button" className="rl-btn-second rl-btn-tiny" onClick={() => go(index + 1)} disabled={!done}>
            Next
          </button>
        )}
      </div>
      {index === 1 && !ws ? <p className="m-0 mt-2 text-[11.5px] text-[var(--relay-ink-subtle)]">Creates &quot;{TOUR_TITLE}&quot;, fictional demo data.</p> : null}
    </aside>
  );
}

/** Steps that depend on agents finishing first stay disabled until the agent is done. */
function canRunNow(stepId: string, ws: NonNullable<TourCtx["ws"]>): boolean {
  if (stepId === "plan") return ws.research.status === "succeeded" && !ws.pendingPlan;
  if (stepId === "revise") return !ws.pendingPlan;
  if (stepId === "question") return Boolean(ws.runner?.question && !ws.runner.question.answer);
  if (stepId === "merge") return ws.runner?.pr?.checks === "passed";
  return true;
}
