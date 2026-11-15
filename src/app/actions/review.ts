"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  addPlanComment,
  approvePlan,
  handOffToRunner,
  resolvePlanComment,
  revisePlanFromComments,
} from "@/lib/review/run";

function assertCanWrite(role: string) {
  if (role === "viewer") {
    throw new Error("Viewers cannot modify plans or comments.");
  }
}

export async function addCommentAction(input: {
  workstreamId: string;
  planId: string;
  body: string;
  anchorText?: string | null;
  stepId?: string | null;
  parentId?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanWrite(user.role);

  await addPlanComment({
    workstreamId: input.workstreamId,
    planId: input.planId,
    authorId: user.id,
    authorName: user.name,
    body: input.body,
    anchorText: input.anchorText,
    stepId: input.stepId,
    parentId: input.parentId,
  });

  revalidatePath(`/workstreams/${input.workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function resolveCommentAction(input: {
  workstreamId: string;
  commentId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanWrite(user.role);

  await resolvePlanComment(input);
  revalidatePath(`/workstreams/${input.workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function revisePlanAction(workstreamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  assertCanWrite(user.role);

  await revisePlanFromComments({
    workstreamId,
    actorUserId: user.id,
  });

  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function approvePlanAction(input: {
  workstreamId: string;
  planId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  await approvePlan({
    workstreamId: input.workstreamId,
    planId: input.planId,
    approverId: user.id,
    approverName: user.name,
    approverRole: user.role,
  });

  revalidatePath(`/workstreams/${input.workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function handOffAction(workstreamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  await handOffToRunner({
    workstreamId,
    actorUserId: user.id,
  });

  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}
