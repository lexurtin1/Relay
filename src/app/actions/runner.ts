"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@relay/core";
import { assertDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** Record a person's answer. Does not start another fix attempt. */
export async function answerRunnerQuestion(workstreamId: string, answer: string) {
  assertDatabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");
  const text = answer.trim();
  if (!text) throw new Error("Answer is required.");

  const ws = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      runnerJobs: {
        include: { questions: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!ws) throw new Error("Workstream not found.");
  if (ws.ownerId !== user.id && user.role !== "lead") {
    throw new Error("Only the owner or a lead can answer the Runner.");
  }
  const job = ws.runnerJobs[0];
  const question = job?.questions.find((item) => !item.answer);
  if (!job || !question) throw new Error("The Runner has not asked a question.");

  await prisma.question.update({
    where: { id: question.id },
    data: { answer: text, answeredById: user.id, answeredAt: new Date() },
  });
  await prisma.agentEvent.create({
    data: {
      runnerJobId: job.id,
      type: "answer",
      payload: { text, kind: "answer" },
    },
  });

  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
}
