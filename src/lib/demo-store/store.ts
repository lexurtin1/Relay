import { reduce, isValidState, type DemoAction } from "./reducer";
import { advance } from "./simulation";
import type { DemoState } from "./types";

export const STORAGE_KEY = "relay.demo.v1";

export type DemoStore = {
  getState: () => DemoState;
  subscribe: (listener: () => void) => () => void;
  /** Throws DemoActionError when the action is not allowed. */
  dispatch: (action: DemoAction) => DemoState;
  /** Load saved state from localStorage, if any. */
  hydrate: () => void;
  clearSaved: () => void;
};

function readSaved(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createDemoStore(seed: DemoState): DemoStore {
  let state = seed;
  const listeners = new Set<() => void>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const emit = () => listeners.forEach((l) => l());

  const save = () => {
    if (typeof window === "undefined") return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage full or blocked: the demo keeps working in memory.
      }
    }, 250);
  };

  const set = (next: DemoState, persist = true) => {
    if (next === state) return;
    state = next;
    if (persist) save();
    emit();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (isValidState(parsed)) set(advance(parsed, Date.now()), false);
      } catch {
        // Ignore malformed writes from other tabs.
      }
    });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(action) {
      const now = Date.now();
      const next = advance(reduce(state, action, now), now);
      // Ticks only change derived agent state; skip the write when nothing moved.
      set(next, action.type !== "TICK" || next !== state);
      return state;
    },
    hydrate() {
      const saved = readSaved();
      if (saved) set(advance(saved, Date.now()), false);
    },
    clearSaved() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear.
      }
    },
  };
}
