import { latestPlan, openComments } from "@/lib/demo-store/permissions";
import type { RelayActions } from "@/lib/demo-store/provider";
import type { DemoState, Workstream } from "@/lib/demo-store/types";

export const TOUR_TITLE = "Tour: faster exception triage";
const TOUR_PROBLEM =
  "Ops analysts spend too long triaging reconciliation exceptions by hand. Find what slows them down and ship the smallest safe fix.";

export const OWNER = "demo-alex";
export const ARCHITECT = "demo-aisha";

export type TourCtx = {
  state: DemoState;
  ws: Workstream | null;
  actions: RelayActions;
  /** Remember the workstream the tour created. */
  setWs: (id: string) => void;
};

export type TourStep = {
  id: string;
  /** Route to show; a function when it depends on the tour workstream. */
  route: string | ((wsId: string | null) => string);
  target: string | null;
  title: string;
  body: string;
  /** Who should be acting for this step. */
  actAs?: string;
  doLabel?: string;
  run?: (ctx: TourCtx) => void | Promise<void>;
  /** The step is complete when this is true; Next unlocks. */
  done?: (ctx: TourCtx) => boolean;
  waiting?: string;
};

const wsRoute = (id: string | null) => (id ? `/workstreams/${id}` : "/");

export const TOUR_STEPS: TourStep[] = [
  {
    id: "relay",
    route: "/",
    target: "pipeline",
    title: "Work moves like a relay",
    body: "Five legs. Agents carry research, planning and building. People decide at review and merge. Numbers here are live across every workstream.",
  },
  {
    id: "start",
    route: "/",
    target: "composer",
    title: "Start with a problem",
    body: "Anyone can describe a problem. Relay creates a workstream and Scout starts at once.",
    actAs: OWNER,
    doLabel: "Create the workstream",
    run: ({ actions, setWs }) => {
      const id = actions.createWorkstream({ title: TOUR_TITLE, problemStatement: TOUR_PROBLEM });
      if (id) setWs(id);
    },
    done: ({ ws }) => Boolean(ws),
  },
  {
    id: "scout",
    route: wsRoute,
    target: "research",
    title: "Scout researches, read only",
    body: "Each step names the source it read: Jira, Confluence, Datadog and GitHub. Findings appear when it is done.",
    done: ({ ws }) => ws?.research.status === "succeeded",
    waiting: "Scout is reading sources",
  },
  {
    id: "plan",
    route: wsRoute,
    target: "next-move",
    title: "The Planner drafts the plan",
    body: "The Next move card always says who holds the baton. Here it is the owner: ask the Planner for a plan.",
    actAs: OWNER,
    doLabel: "Generate plan",
    run: ({ ws, actions }) => (ws ? actions.generatePlan(ws.id) : undefined),
    done: ({ ws }) => Boolean(ws && latestPlan(ws)),
    waiting: "The Planner is drafting",
  },
  {
    id: "review",
    route: wsRoute,
    target: "action-bar",
    title: "Send it for review",
    body: "Plans are reviewed before any code is written. Teammates comment on the exact words they question.",
    actAs: OWNER,
    doLabel: "Request review",
    run: ({ ws, actions }) => (ws ? actions.requestReview(ws.id) : undefined),
    done: ({ ws }) => latestPlan(ws ?? ({ plans: [] } as unknown as Workstream))?.status === "in_review",
  },
  {
    id: "comment",
    route: wsRoute,
    target: "comments",
    title: "The architect comments",
    body: "Switch to Aisha, the architect. Select any text in the plan to anchor a comment, or let the tour add one.",
    actAs: ARCHITECT,
    doLabel: "Add Aisha's comment",
    run: ({ ws, actions }) =>
      ws ? void actions.addComment({ wsId: ws.id, body: "Name the flag service and who owns it.", anchorText: "flag" }) : undefined,
    done: ({ ws }) => (ws ? openComments(latestPlan(ws)) > 0 || (latestPlan(ws)?.version ?? 0) > 1 : false),
  },
  {
    id: "revise",
    route: wsRoute,
    target: "action-bar",
    title: "The owner revises from comments",
    body: "Back as Alex. The Planner folds open comments into version 2 and marks them addressed.",
    actAs: OWNER,
    doLabel: "Revise from comments",
    run: ({ ws, actions }) => (ws ? actions.revisePlan(ws.id) : undefined),
    done: ({ ws }) => (latestPlan(ws ?? ({ plans: [] } as unknown as Workstream))?.version ?? 0) >= 2,
    waiting: "The Planner is revising",
  },
  {
    id: "approve",
    route: wsRoute,
    target: "action-bar",
    title: "The architect approves",
    body: "Only architects and leads approve. Relay records who approved which version.",
    actAs: ARCHITECT,
    doLabel: "Approve as Aisha",
    run: ({ ws, actions }) => (ws ? actions.approvePlan(ws.id) : undefined),
    done: ({ ws }) => latestPlan(ws ?? ({ plans: [] } as unknown as Workstream))?.status === "approved",
  },
  {
    id: "handoff",
    route: wsRoute,
    target: "action-bar",
    title: "Hand off to the Runner",
    body: "The owner hands the approved plan to the Runner. It builds in an isolated workspace with no production data.",
    actAs: OWNER,
    doLabel: "Hand off",
    run: ({ ws, actions }) => (ws ? void actions.handOff(ws.id, { model: "claude-opus-5-5", profile: "default", context: "" }) : undefined),
    done: ({ ws }) => Boolean(ws?.runner),
  },
  {
    id: "question",
    route: wsRoute,
    target: "runner",
    title: "The Runner asks when it needs you",
    body: "It pauses on decisions that change shared behaviour. The question also appears on the Overview under Needs your input.",
    actAs: OWNER,
    doLabel: "Answer: smallest safe change",
    run: ({ ws, actions }) => (ws ? void actions.answerQuestion(ws.id, "Smallest safe change") : undefined),
    done: ({ ws }) => Boolean(ws?.runner?.question?.answer),
    waiting: "The Runner is building toward its question",
  },
  {
    id: "merge",
    route: wsRoute,
    target: "runner",
    title: "Checks pass. You merge",
    body: "The Runner opens a pull request and checks run. A person always makes the final call.",
    actAs: OWNER,
    doLabel: "Merge",
    run: ({ ws, actions }) => (ws ? actions.mergePr(ws.id) : undefined),
    done: ({ ws }) => ws?.stage === "merged",
    waiting: "The Runner is finishing and checks are running",
  },
  {
    id: "metrics",
    route: "/metrics",
    target: null,
    title: "Metrics update themselves",
    body: "Cycle time, the share of time agents carried, and tokens through the AI Gateway now include this workstream.",
  },
  {
    id: "audit",
    route: "/audit",
    target: null,
    title: "Every step is on the record",
    body: "Each approval, hand-off, answer and model call is in the audit log, with who did it. Export it for compliance review.",
  },
];
