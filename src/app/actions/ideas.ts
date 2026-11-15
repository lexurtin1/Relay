"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@relay/core";
import type { IdeaStatus, IdeaType } from "@prisma/client";
import { WorkstreamOrigin, WorkstreamPriority, WorkstreamStage } from "@prisma/client";
import { useDemoFixtures } from "@/lib/db";
import { createIdea, setIdeaStatus } from "@/lib/ideas";
import { getCurrentUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

function assertCanWrite(role: string) {
  if (role === "viewer") throw new Error("Viewers cannot modify ideas.");
}

function assertCanTriage(role: string) {
  if (role !== "lead" && role !== "architect") {
    throw new Error("Only leads and architects can triage or promote ideas.");
  }
}

export async function createIdeaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanWrite(user.role);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "friction_log") as IdeaType;
  const frequencyRaw = String(formData.get("frequencyPerWeek") ?? "").trim();
  const minutesRaw = String(formData.get("minutesLostEach") ?? "").trim();

  if (!title || !description) throw new Error("Title and description are required.");

  await createIdea({
    title,
    description,
    type,
    submittedById: user.id,
    submittedByName: user.name,
    frequencyPerWeek: frequencyRaw ? Number(frequencyRaw) : null,
    minutesLostEach: minutesRaw ? Number(minutesRaw) : null,
  });

  revalidatePath("/ideas");
  revalidatePath("/");
  redirect("/ideas");
}

export async function triageIdeaAction(input: {
  id: string;
  status: Extract<IdeaStatus, "triaged" | "parked" | "new">;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanTriage(user.role);

  await setIdeaStatus({ id: input.id, status: input.status });
  revalidatePath("/ideas");
  revalidatePath("/");
  return { ok: true as const };
}

export async function promoteIdeaAction(ideaId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanTriage(user.role);

  if (useDemoFixtures()) {
    const ideas = await import("@/lib/ideas");
    const list = await ideas.listIdeas();
    const idea = list.find((i) => i.id === ideaId);
    if (!idea) throw new Error("Idea not found");
    const workstreamId = `demo-ws-idea-${Date.now().toString(36)}`;
    await setIdeaStatus({
      id: ideaId,
      status: "promoted",
      workstreamId,
      workstreamTitle: idea.title,
    });
    await recordAudit({
      action: "hand_off",
      userId: user.id,
      userName: user.name,
      detail: `Promoted idea to workstream stub (${idea.title})`,
      workstreamId,
    });
    revalidatePath("/ideas");
    revalidatePath("/");
    redirect(`/ideas?promoted=${encodeURIComponent(idea.title)}`);
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new Error("Idea not found");

  const workstream = await prisma.workstream.create({
    data: {
      title: idea.title,
      problemStatement: idea.description,
      origin:
        idea.type === "external_signal"
          ? WorkstreamOrigin.external_opportunity
          : WorkstreamOrigin.internal_friction,
      priority: WorkstreamPriority.medium,
      stage: WorkstreamStage.idea,
      ownerId: idea.submittedById,
    },
  });

  await setIdeaStatus({
    id: ideaId,
    status: "promoted",
    workstreamId: workstream.id,
    workstreamTitle: workstream.title,
  });

  await recordAudit({
    action: "hand_off",
    userId: user.id,
    userName: user.name,
    detail: `Promoted idea to workstream ${workstream.id}`,
    workstreamId: workstream.id,
  });

  revalidatePath("/ideas");
  revalidatePath("/");
  revalidatePath(`/workstreams/${workstream.id}`);
  redirect(`/workstreams/${workstream.id}`);
}
