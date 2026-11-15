"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@relay/core";
import { SESSION_COOKIE } from "@/lib/session";
import { useDemoFixtures } from "@/lib/db";
import { getDemoUser } from "@/lib/demo-data";
import { WorkstreamOrigin, WorkstreamPriority, WorkstreamStage } from "@prisma/client";

export async function switchUser(userId: string) {
  let name: string | null = null;
  if (useDemoFixtures()) {
    const user = getDemoUser(userId);
    if (!user || user.id !== userId) return;
    name = user.name;
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    name = user.name;
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  const { recordAudit } = await import("@/lib/audit");
  await recordAudit({
    action: "role_switch",
    userId,
    userName: name,
    detail: `Switched session to ${name}`,
  });
  revalidatePath("/");
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
