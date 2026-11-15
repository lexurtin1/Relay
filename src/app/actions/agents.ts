"use server";

import { revalidatePath } from "next/cache";
import { startPlannerDraft, startScoutResearch } from "@/lib/agents/run";

export async function startResearchAction(workstreamId: string) {
  await startScoutResearch(workstreamId);
  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function generatePlanAction(workstreamId: string) {
  await startPlannerDraft(workstreamId);
  revalidatePath(`/workstreams/${workstreamId}`);
  revalidatePath("/");
  return { ok: true as const };
}
