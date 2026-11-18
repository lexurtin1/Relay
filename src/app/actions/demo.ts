"use server";

import { buildDemoSeed } from "@/lib/demo-store/seed";
import type { DemoState } from "@/lib/demo-store/types";

/** A fresh demo seed with timestamps relative to now. Used by Reset demo. */
export async function freshDemoSeed(): Promise<DemoState> {
  return buildDemoSeed(Date.now());
}
