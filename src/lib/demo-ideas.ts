import type { IdeaStatus, IdeaType } from "@prisma/client";
import { DEMO_USERS, getDemoWorkstreamDetail } from "@/lib/demo-data";

export type DemoIdea = {
  id: string;
  title: string;
  description: string;
  submittedById: string;
  submittedByName: string;
  type: IdeaType;
  frequencyPerWeek: number | null;
  minutesLostEach: number | null;
  status: IdeaStatus;
  workstreamId: string | null;
  workstreamTitle: string | null;
  createdAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __relayDemoIdeas?: DemoIdea[];
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function seedIdeas(): DemoIdea[] {
  const alex = DEMO_USERS[0]!;
  const owen = DEMO_USERS[1]!;
  const leon = DEMO_USERS[3]!;
  return [
    {
      id: "demo-idea-1",
      title: "Manual ISIN checks in three tools",
      description:
        "Engineers copy ISIN regex between MCP tools, LibreChat modules, and ad-hoc scripts.",
      submittedById: alex.id,
      submittedByName: alex.name,
      type: "friction_log",
      frequencyPerWeek: 8,
      minutesLostEach: 15,
      status: "promoted",
      workstreamId: "demo-ws-isin",
      workstreamTitle: getDemoWorkstreamDetail("demo-ws-isin")?.title ?? null,
      createdAt: hoursAgo(40),
    },
    {
      id: "demo-idea-2",
      title: "Reconciliation exception sorting by hand",
      description: "Ops paste exception CSV into sheets and tag rows manually.",
      submittedById: owen.id,
      submittedByName: owen.name,
      type: "friction_log",
      frequencyPerWeek: 5,
      minutesLostEach: 90,
      status: "promoted",
      workstreamId: "demo-ws-nav",
      workstreamTitle: getDemoWorkstreamDetail("demo-ws-nav")?.title ?? null,
      createdAt: hoursAgo(36),
    },
    {
      id: "demo-idea-3",
      title: "Waiting on Confluence for onboarding steps",
      description: "New joiners cannot find the latest distributor checklist.",
      submittedById: alex.id,
      submittedByName: alex.name,
      type: "friction_log",
      frequencyPerWeek: 3,
      minutesLostEach: 40,
      status: "promoted",
      workstreamId: "demo-ws-kill",
      workstreamTitle: getDemoWorkstreamDetail("demo-ws-kill")?.title ?? null,
      createdAt: hoursAgo(30),
    },
    {
      id: "demo-idea-4",
      title: "Jira status hunting across Innovation epics",
      description: "Stand-ups spend time finding the right epic updates.",
      submittedById: owen.id,
      submittedByName: owen.name,
      type: "friction_log",
      frequencyPerWeek: 4,
      minutesLostEach: 20,
      status: "new",
      workstreamId: null,
      workstreamTitle: null,
      createdAt: hoursAgo(12),
    },
    {
      id: "demo-idea-5",
      title: "Client asked about fund launch visibility",
      description:
        "At a fictional industry roundtable, a distributor lead asked for earlier visibility of new fund launches.",
      submittedById: leon.id,
      submittedByName: leon.name,
      type: "external_signal",
      frequencyPerWeek: null,
      minutesLostEach: null,
      status: "promoted",
      workstreamId: "demo-ws-audit",
      workstreamTitle: getDemoWorkstreamDetail("demo-ws-audit")?.title ?? null,
      createdAt: hoursAgo(28),
    },
    {
      id: "demo-idea-6",
      title: "Conference signal: agent-ready order APIs",
      description:
        "A fictional conference panel discussed exposing order status to internal agents with strict rate limits.",
      submittedById: leon.id,
      submittedByName: leon.name,
      type: "external_signal",
      frequencyPerWeek: null,
      minutesLostEach: null,
      status: "new",
      workstreamId: null,
      workstreamTitle: null,
      createdAt: hoursAgo(8),
    },
  ];
}

function store(): DemoIdea[] {
  if (!globalStore.__relayDemoIdeas) {
    globalStore.__relayDemoIdeas = seedIdeas();
  }
  return globalStore.__relayDemoIdeas;
}

export function listDemoIdeas(): DemoIdea[] {
  return [...store()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function createDemoIdea(input: {
  title: string;
  description: string;
  type: IdeaType;
  submittedById: string;
  submittedByName: string;
  frequencyPerWeek?: number | null;
  minutesLostEach?: number | null;
}): DemoIdea {
  const row: DemoIdea = {
    id: `demo-idea-${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    submittedById: input.submittedById,
    submittedByName: input.submittedByName,
    type: input.type,
    frequencyPerWeek: input.frequencyPerWeek ?? null,
    minutesLostEach: input.minutesLostEach ?? null,
    status: "new",
    workstreamId: null,
    workstreamTitle: null,
    createdAt: new Date().toISOString(),
  };
  store().unshift(row);
  return row;
}

export function updateDemoIdeaStatus(
  id: string,
  status: IdeaStatus,
  extra?: { workstreamId?: string; workstreamTitle?: string },
): DemoIdea {
  const ideas = store();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("Idea not found");
  const next = {
    ...ideas[idx]!,
    status,
    workstreamId: extra?.workstreamId ?? ideas[idx]!.workstreamId,
    workstreamTitle: extra?.workstreamTitle ?? ideas[idx]!.workstreamTitle,
  };
  ideas[idx] = next;
  return next;
}

export function getDemoIdea(id: string): DemoIdea | null {
  return store().find((i) => i.id === id) ?? null;
}
