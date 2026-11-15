"use client";

export function CommandTrigger() {
  return (
    <button
      type="button"
      className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-ink)_4%,transparent)] px-2.5 py-1.5 text-xs text-[var(--relay-ink-muted)] transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)] hover:text-[var(--relay-ink)]"
      aria-keyshortcuts="Meta+K Control+K"
      title="Open command palette (⌘K)"
      onClick={() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
    >
      <span>Search</span>
      <kbd className="rounded-lg border border-[var(--relay-border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--relay-ink-subtle)]">
        ⌘&nbsp;K
      </kbd>
    </button>
  );
}
