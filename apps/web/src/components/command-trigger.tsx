"use client";

export function CommandTrigger() {
  return (
    <button
      type="button"
      className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--relay-border)] px-2 py-1 text-xs text-[var(--relay-ink-muted)] transition-relay hover:bg-[var(--relay-surface-muted)]"
      aria-keyshortcuts="Meta+K Control+K"
      title="Open command palette (⌘K)"
      onClick={() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
    >
      <span>Search</span>
      <kbd className="font-mono text-[11px]">⌘&nbsp;K</kbd>
    </button>
  );
}
