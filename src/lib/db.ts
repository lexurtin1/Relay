/** True when Vercel (or local) should serve seed fixtures instead of Postgres. */
export function useDemoFixtures(): boolean {
  if (process.env.RELAY_DEMO_FIXTURES === "1") return true;
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return true;
  // Placeholder used only so `prisma generate` succeeds on Vercel builds.
  if (url.includes("placeholder.invalid")) return true;
  return false;
}

export async function withDatabase<T>(
  live: () => Promise<T>,
  demo: () => T | Promise<T>,
): Promise<T> {
  if (useDemoFixtures()) return demo();
  try {
    return await live();
  } catch {
    return demo();
  }
}
