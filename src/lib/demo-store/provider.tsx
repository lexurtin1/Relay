"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { draftPlanFromTemplate } from "@relay/core/agents/planner-template";
import { draftPlan } from "@/app/actions/agents";
import { freshDemoSeed } from "@/app/actions/demo";
import { DemoActionError, type DemoAction, type PlanDraftPayload } from "./reducer";
import { can, latestPlan, openComments } from "./permissions";
import { isSimulating } from "./simulation";
import { createDemoStore, type DemoStore } from "./store";
import type { DemoState, IdeaStatus, IdeaType, Workstream } from "./types";

const StoreContext = createContext<DemoStore | null>(null);

export function DemoStoreProvider(props: { seed: DemoState; children: ReactNode }) {
  const ref = useRef<DemoStore | null>(null);
  if (!ref.current) ref.current = createDemoStore(props.seed);
  const store = ref.current;

  useEffect(() => {
    store.hydrate();
    const speed = Number(new URLSearchParams(window.location.search).get("speed"));
    if (Number.isFinite(speed) && speed >= 1 && speed <= 50) {
      store.dispatch({ type: "SET_SPEED", speed });
    }
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (isSimulating(store.getState())) store.dispatch({ type: "TICK" });
    }, 500);
    const onVisible = () => {
      if (document.visibilityState === "visible") store.dispatch({ type: "TICK" });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  return <StoreContext.Provider value={store}>{props.children}</StoreContext.Provider>;
}

/** The demo store, or null in database mode. */
export function useDemoStore(): DemoStore | null {
  return useContext(StoreContext);
}

const noop = () => () => {};

/** Select from the demo store. Returns `fallback` in database mode. */
export function useDemo<T>(selector: (state: DemoState) => T, fallback: T): T;
export function useDemo<T>(selector: (state: DemoState) => T): T | null;
export function useDemo<T>(selector: (state: DemoState) => T, fallback?: T): T | null {
  const store = useDemoStore();
  const state = useSyncExternalStore(
    store ? store.subscribe : noop,
    () => (store ? store.getState() : null),
    () => (store ? store.getState() : null),
  );
  // Selectors build new objects; memoise on the state reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (state ? selector(state) : (fallback ?? null)), [state]);
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

function planInput(ws: Workstream, revise: boolean, state: DemoState) {
  const plan = latestPlan(ws);
  return {
    title: ws.title,
    problemStatement: ws.problemStatement,
    findings: ws.research.findings,
    version: (plan?.version ?? 0) + 1,
    feedback: revise && plan
      ? plan.comments
          .filter((c) => !c.resolved)
          .map((c) => ({
            body: c.body,
            anchorText: c.anchorText,
            authorName: state.users.find((u) => u.id === c.authorId)?.name,
          }))
      : undefined,
    previousSteps: revise && plan ? plan.steps : undefined,
  };
}

async function planPayload(ws: Workstream, revise: boolean, state: DemoState): Promise<PlanDraftPayload> {
  const input = planInput(ws, revise, state);
  try {
    const result = await draftPlan(input);
    return { draft: result.draft, modelId: result.modelId, usage: result.usage };
  } catch {
    // The demo must never block on the network: fall back to the same template.
    const draft = draftPlanFromTemplate(input);
    return {
      draft,
      modelId: "template",
      usage: { inputTokens: 1_500, outputTokens: Math.ceil(draft.markdown.length / 4) },
    };
  }
}

export type RelayActions = {
  mode: "demo" | "database";
  switchUser: (userId: string) => void;
  createWorkstream: (input: { title: string; problemStatement: string; jiraKey?: string; origin?: Workstream["origin"] }) => string | null;
  startResearch: (wsId: string) => void;
  askFollowup: (wsId: string, question: string) => boolean;
  generatePlan: (wsId: string) => Promise<void>;
  requestReview: (wsId: string) => void;
  addComment: (input: { wsId: string; body: string; anchorText?: string | null; stepId?: string | null; parentId?: string | null }) => boolean;
  resolveComment: (wsId: string, commentId: string) => void;
  revisePlan: (wsId: string) => Promise<void>;
  approvePlan: (wsId: string) => void;
  handOff: (wsId: string, input: { model: string; profile: string; context: string }) => boolean;
  answerQuestion: (wsId: string, answer: string) => boolean;
  mergePr: (wsId: string) => void;
  createIdea: (input: { title: string; description: string; type: IdeaType }) => boolean;
  setIdeaStatus: (id: string, status: IdeaStatus) => void;
  promoteIdea: (id: string, workstreamId: string | null) => string | null;
  setHero: (page: string, collapsed: boolean) => void;
  setTour: (tour: DemoState["ui"]["tour"]) => void;
  dismissTourPrompt: () => void;
  setSpeed: (speed: number) => void;
  reset: () => Promise<void>;
};

const DB_ONLY = "This step runs in the demo store. In database mode it arrives with the worker.";

/** One action surface for every button. Demo mode dispatches to the browser store. */
export function useRelayActions(): RelayActions {
  const store = useDemoStore();
  const router = useRouter();

  return useMemo<RelayActions>(() => {
    const run = (action: DemoAction, success?: string): boolean => {
      if (!store) {
        toast.info(DB_ONLY);
        return false;
      }
      try {
        store.dispatch(action);
        if (success) toast.success(success);
        return true;
      } catch (error) {
        toast.error(error instanceof DemoActionError ? error.message : "That did not work. Try again.");
        return false;
      }
    };

    const planStep = async (wsId: string, revise: boolean) => {
      if (!store) {
        toast.info(DB_ONLY);
        return;
      }
      const state = store.getState();
      const ws = state.workstreams[wsId];
      if (!ws) return;
      // Check first so a blocked user gets the reason before any network call.
      const gate = can(state, revise ? "revise_plan" : "generate_plan", wsId);
      if (!gate.ok) {
        toast.error(gate.reason ?? "Not allowed.");
        return;
      }
      const payload = await planPayload(ws, revise, state);
      run(
        { type: revise ? "REVISE_PLAN" : "GENERATE_PLAN", wsId, ...payload },
        revise ? "The Planner is revising from comments" : "The Planner is drafting the plan",
      );
    };

    if (!store) {
      return {
        mode: "database",
        switchUser: () => router.refresh(),
        createWorkstream: () => (toast.info(DB_ONLY), null),
        startResearch: () => run({ type: "TICK" }),
        askFollowup: () => run({ type: "TICK" }),
        generatePlan: async () => void run({ type: "TICK" }),
        requestReview: () => run({ type: "TICK" }),
        addComment: () => run({ type: "TICK" }),
        resolveComment: () => run({ type: "TICK" }),
        revisePlan: async () => void run({ type: "TICK" }),
        approvePlan: () => run({ type: "TICK" }),
        handOff: () => run({ type: "TICK" }),
        answerQuestion: () => run({ type: "TICK" }),
        mergePr: () => run({ type: "TICK" }),
        createIdea: () => run({ type: "TICK" }),
        setIdeaStatus: () => run({ type: "TICK" }),
        promoteIdea: () => (toast.info(DB_ONLY), null),
        setHero: () => {},
        setTour: () => toast.info(DB_ONLY),
        dismissTourPrompt: () => {},
        setSpeed: () => {},
        reset: async () => {},
      };
    }

    return {
      mode: "demo",
      switchUser: (userId) => {
        const user = store.getState().users.find((u) => u.id === userId);
        run({ type: "SWITCH_USER", userId }, user ? `Now acting as ${user.name} (${user.role})` : undefined);
      },
      createWorkstream: (input) => {
        const id = newId("ws");
        const ok = run(
          { type: "CREATE_WORKSTREAM", id, title: input.title, problemStatement: input.problemStatement, jiraKey: input.jiraKey, origin: input.origin },
          "Workstream created. Scout is researching.",
        );
        return ok ? id : null;
      },
      startResearch: (wsId) => void run({ type: "START_RESEARCH", wsId }, "Scout is researching"),
      askFollowup: (wsId, question) => run({ type: "ASK_FOLLOWUP", wsId, question }, "Scout is on it"),
      generatePlan: (wsId) => planStep(wsId, false),
      requestReview: (wsId) => void run({ type: "REQUEST_REVIEW", wsId }, "Plan sent for review"),
      addComment: (input) =>
        run({ type: "ADD_COMMENT", id: newId("c"), ...input }, input.parentId ? "Reply added" : "Comment added"),
      resolveComment: (wsId, commentId) => void run({ type: "RESOLVE_COMMENT", wsId, commentId }, "Comment resolved"),
      revisePlan: (wsId) => planStep(wsId, true),
      approvePlan: (wsId) => void run({ type: "APPROVE_PLAN", wsId }, "Plan approved"),
      handOff: (wsId, input) => run({ type: "HAND_OFF", wsId, ...input }, "Handed off. The Runner is starting."),
      answerQuestion: (wsId, answer) => run({ type: "ANSWER_QUESTION", wsId, answer }, "Answer sent. The Runner is continuing."),
      mergePr: (wsId) => void run({ type: "MERGE_PR", wsId }, "Merged"),
      createIdea: (input) =>
        run({ type: "CREATE_IDEA", id: newId("idea"), title: input.title, description: input.description, ideaType: input.type }, "Idea logged"),
      setIdeaStatus: (id, status) => void run({ type: "SET_IDEA_STATUS", id, status }, `Moved to ${status}`),
      promoteIdea: (id, workstreamId) => {
        const newWorkstreamId = newId("ws");
        const ok = run({ type: "PROMOTE_IDEA", id, workstreamId, newWorkstreamId }, "Idea promoted");
        return ok ? (workstreamId ?? newWorkstreamId) : null;
      },
      setHero: (page, collapsed) => void run({ type: "SET_HERO", page, collapsed }),
      setTour: (tour) => void run({ type: "SET_TOUR", tour }),
      dismissTourPrompt: () => void run({ type: "DISMISS_TOUR_PROMPT" }),
      setSpeed: (speed) => void run({ type: "SET_SPEED", speed }),
      reset: async () => {
        try {
          const seed = await freshDemoSeed();
          store.clearSaved();
          store.dispatch({ type: "RESET", seed });
          toast.success("Demo reset");
          router.push("/");
        } catch {
          toast.error("Could not reset the demo. Check your connection.");
        }
      },
    };
  }, [store, router]);
}

export { openComments, latestPlan };
