import { prisma } from "@relay/core";
import type { IdeaStatus, IdeaType } from "@prisma/client";
import { useDemoFixtures } from "@/lib/db";
import {
  createDemoIdea,
  getDemoIdea,
  listDemoIdeas,
  updateDemoIdeaStatus,
  type DemoIdea,
} from "@/lib/demo-ideas";

export type IdeaView = {
  id: string;
  title: string;
  description: string;
  type: IdeaType;
  status: IdeaStatus;
  submittedByName: string;
  frequencyPerWeek: number | null;
  minutesLostEach: number | null;
  weeklyMinutesLost: number | null;
  workstreamId: string | null;
  workstreamTitle: string | null;
  createdAt: string;
};

function toView(idea: DemoIdea): IdeaView {
  const weekly =
    idea.frequencyPerWeek != null && idea.minutesLostEach != null
      ? idea.frequencyPerWeek * idea.minutesLostEach
      : null;
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    type: idea.type,
    status: idea.status,
    submittedByName: idea.submittedByName,
    frequencyPerWeek: idea.frequencyPerWeek,
    minutesLostEach: idea.minutesLostEach,
    weeklyMinutesLost: weekly,
    workstreamId: idea.workstreamId,
    workstreamTitle: idea.workstreamTitle,
    createdAt: idea.createdAt,
  };
}

export async function listIdeas(filters?: {
  status?: IdeaStatus | "all";
  type?: IdeaType | "all";
}): Promise<IdeaView[]> {
  const status = filters?.status && filters.status !== "all" ? filters.status : undefined;
  const type = filters?.type && filters.type !== "all" ? filters.type : undefined;

  if (useDemoFixtures()) {
    return listDemoIdeas()
      .filter((i) => (status ? i.status === status : true))
      .filter((i) => (type ? i.type === type : true))
      .map(toView);
  }

  const rows = await prisma.idea.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    include: { submittedBy: true, workstream: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    type: idea.type,
    status: idea.status,
    submittedByName: idea.submittedBy.name,
    frequencyPerWeek: idea.frequencyPerWeek,
    minutesLostEach: idea.minutesLostEach,
    weeklyMinutesLost:
      idea.frequencyPerWeek != null && idea.minutesLostEach != null
        ? idea.frequencyPerWeek * idea.minutesLostEach
        : null,
    workstreamId: idea.workstreamId,
    workstreamTitle: idea.workstream?.title ?? null,
    createdAt: idea.createdAt.toISOString(),
  }));
}

export async function createIdea(input: {
  title: string;
  description: string;
  type: IdeaType;
  submittedById: string;
  submittedByName: string;
  frequencyPerWeek?: number | null;
  minutesLostEach?: number | null;
}): Promise<IdeaView> {
  if (useDemoFixtures()) {
    return toView(createDemoIdea(input));
  }

  const idea = await prisma.idea.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      submittedById: input.submittedById,
      frequencyPerWeek: input.frequencyPerWeek ?? null,
      minutesLostEach: input.minutesLostEach ?? null,
      status: "new",
    },
    include: { submittedBy: true, workstream: true },
  });

  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    type: idea.type,
    status: idea.status,
    submittedByName: idea.submittedBy.name,
    frequencyPerWeek: idea.frequencyPerWeek,
    minutesLostEach: idea.minutesLostEach,
    weeklyMinutesLost:
      idea.frequencyPerWeek != null && idea.minutesLostEach != null
        ? idea.frequencyPerWeek * idea.minutesLostEach
        : null,
    workstreamId: idea.workstreamId,
    workstreamTitle: idea.workstream?.title ?? null,
    createdAt: idea.createdAt.toISOString(),
  };
}

export async function setIdeaStatus(input: {
  id: string;
  status: IdeaStatus;
  workstreamId?: string | null;
  workstreamTitle?: string | null;
}): Promise<IdeaView> {
  if (useDemoFixtures()) {
    const existing = getDemoIdea(input.id);
    if (!existing) throw new Error("Idea not found");
    return toView(
      updateDemoIdeaStatus(input.id, input.status, {
        workstreamId: input.workstreamId ?? undefined,
        workstreamTitle: input.workstreamTitle ?? undefined,
      }),
    );
  }

  const idea = await prisma.idea.update({
    where: { id: input.id },
    data: {
      status: input.status,
      workstreamId: input.workstreamId === undefined ? undefined : input.workstreamId,
    },
    include: { submittedBy: true, workstream: true },
  });

  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    type: idea.type,
    status: idea.status,
    submittedByName: idea.submittedBy.name,
    frequencyPerWeek: idea.frequencyPerWeek,
    minutesLostEach: idea.minutesLostEach,
    weeklyMinutesLost:
      idea.frequencyPerWeek != null && idea.minutesLostEach != null
        ? idea.frequencyPerWeek * idea.minutesLostEach
        : null,
    workstreamId: idea.workstreamId,
    workstreamTitle: idea.workstream?.title ?? null,
    createdAt: idea.createdAt.toISOString(),
  };
}
