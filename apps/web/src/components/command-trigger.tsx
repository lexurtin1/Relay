"use client";

export function CommandTrigger() {
  return (
    <button
      type="button"
      className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 transition-relay hover:bg-white/10 hover:text-white"
      aria-keyshortcuts="Meta+K Control+K"
      title="Open command palette (⌘K)"
      onClick={() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
    >
      <span>Search workstreams</span>
      <kbd className="rounded-lg border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
        ⌘&nbsp;K
      </kbd>
    </button>
  );
}
