/** Shared ISIN helper placeholder for mock Runner file edits. */
export function validateIsin(raw: string): { ok: boolean; code?: string } {
  const value = raw.trim().toUpperCase();
  if (value.length !== 12) return { ok: false, code: "ISIN_LENGTH" };
  return { ok: true };
}
