"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@relay/core";
import { SESSION_COOKIE } from "@/lib/session";
import { WorkstreamOrigin, WorkstreamPriority, WorkstreamStage } from "@prisma/client";

export async function switchUser(userId: string) {
  const { useDemoFixtures } = await import("@/lib/db");
  const { getDemoUser } = await import("@/lib/demo-data");

  if (useDemoFixtures()) {
    const user = getDemoUser(userId);
    if (!userId || user.id !== userId) return;
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/");
}

export async function switchUserForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (userId) await switchUser(userId);
}

export async function createWorkstream(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const problemStatement = String(formData.get("problemStatement") ?? "").trim();
  const jiraKey = String(formData.get("jiraKey") ?? "").trim() || null;
  const origin = String(formData.get("origin") ?? "internal_friction") as WorkstreamOrigin;
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!title || !problemStatement || !ownerId) {
    throw new Error("Title, problem statement, and owner are required.");
  }

  const workstream = await prisma.workstream.create({
    data: {
      title,
      problemStatement,
      jiraKey,
      origin,
      priority: WorkstreamPriority.medium,
      stage: WorkstreamStage.idea,
      ownerId,
    },
  });

  revalidatePath("/");
  redirect(`/workstreams/${workstream.id}`);
}
