import { prisma, resolveWorkstreamColour, WORKSTREAM_COLOURS } from "@relay/core";
import { withDatabase } from "@/lib/db";
import { getDemoIdeasData } from "@/lib/demo-data";

export type IdeaBoardItem = {
  id: string;
  title: string;
  description: string;
  type: "friction_log" | "external_signal";
  status: "new" | "triaged" | "promoted" | "parked";
  frequencyPerWeek: number | null;
  minutesLostEach: number | null;
  submittedByName: string;
  workstreamId: string | null;
  workstreamTitle: string | null;
  color: string;
  createdAt: string;
};

export type IdeaWorkstreamOption = {
  id: string;
  title: string;
  color: string;
};

export async function getIdeasBoardData() {
  return withDatabase(loadIdeasFromDatabase, () => getDemoIdeasData());
}

async function loadIdeasFromDatabase() {
  const [ideas, workstreams] = await Promise.all([
    prisma.idea.findMany({
      include: {
        submittedBy: true,
        workstream: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workstream.findMany({
      select: { id: true, title: true, color: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const items: IdeaBoardItem[] = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    type: idea.type,
    status: idea.status,
    frequencyPerWeek: idea.frequencyPerWeek,
    minutesLostEach: idea.minutesLostEach,
    submittedByName: idea.submittedBy.name,
    workstreamId: idea.workstreamId,
    workstreamTitle: idea.workstream?.title ?? null,
    color: idea.workstream
      ? resolveWorkstreamColour(idea.workstream.color)
      : WORKSTREAM_COLOURS.neutral,
    createdAt: idea.createdAt.toISOString(),
  }));

  const workstreamOptions: IdeaWorkstreamOption[] = workstreams.map((ws) => ({
    id: ws.id,
    title: ws.title,
    color: resolveWorkstreamColour(ws.color),
  }));

  return { items, workstreamOptions };
}
