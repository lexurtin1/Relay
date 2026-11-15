"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative z-50 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] text-[var(--relay-ink-muted)] transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_12%,transparent)] hover:text-[var(--relay-ink)]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      data-testid="theme-toggle"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
