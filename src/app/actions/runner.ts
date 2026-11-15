"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { answerRunnerQuestion } from "@/lib/runner/run";

export async function answerRunnerQuestionAction(input: {
  workstreamId: string;
  answer: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  if (user.role === "viewer") {
    throw new Error("Viewers cannot answer Runner questions.");
  }

  await answerRunnerQuestion({
    workstreamId: input.workstreamId,
    answer: input.answer,
    answeredById: user.id,
  });

  revalidatePath(`/workstreams/${input.workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}
