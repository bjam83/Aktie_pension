"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Perspective = "now" | "retirement";
/** A specific person's id, or "household" for the combined view. */
export type PersonFilter = string;

const STORAGE_KEY = "hh-view";
export const HOUSEHOLD_FILTER = "household";

interface HouseholdViewState {
  personId: PersonFilter;
  perspective: Perspective;
}

interface HouseholdViewContextValue extends HouseholdViewState {
  setPersonId: (id: PersonFilter) => void;
  setPerspective: (p: Perspective) => void;
}

const HouseholdViewContext = createContext<HouseholdViewContextValue | null>(null);

function readStored(): HouseholdViewState {
  if (typeof window === "undefined") return { personId: HOUSEHOLD_FILTER, perspective: "now" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personId: HOUSEHOLD_FILTER, perspective: "now" };
    const parsed = JSON.parse(raw);
    return {
      personId: typeof parsed.personId === "string" ? parsed.personId : HOUSEHOLD_FILTER,
      perspective: parsed.perspective === "retirement" ? "retirement" : "now",
    };
  } catch {
    return { personId: HOUSEHOLD_FILTER, perspective: "now" };
  }
}

/**
 * Global person + time-perspective context ("I dag" / "Ved pension"), used by the
 * header's context bar and (over time) by every page's data view. Persisted to
 * localStorage so the choice survives between sessions, per the design spec.
 * Reads default to household-wide/"now" during SSR and the first client render to
 * avoid a hydration mismatch, then sync to whatever was actually stored.
 */
export function HouseholdViewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HouseholdViewState>({ personId: HOUSEHOLD_FILTER, perspective: "now" });
  // Guards the very first run of the persistence effect below, so it can't write
  // this component's pre-hydration default over whatever the hydration effect is
  // about to read — see the comment on that effect for why this needs a cleanup,
  // not just a boolean flip.
  const skipNextPersist = useRef(true);

  useEffect(() => {
    // One-time sync from localStorage after mount, deliberately deferred out of
    // the initial render so server and first-client-render markup match (this
    // provider wraps server-rendered content) — not an ongoing subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readStored());
  }, []);

  useEffect(() => {
    // Skip persisting on the mount commit: `state` here is still this component's
    // pre-hydration default (the setState above only takes effect on the next
    // render), so writing it now would clobber the real stored value moments
    // before the hydration effect reads it — a real, observed bug, not just a
    // React Strict Mode artifact. Cleanup resets the guard so Strict Mode's dev-only
    // double-invoke of the mount commit skips both times, not just the first.
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return () => {
        skipNextPersist.current = true;
      };
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private mode etc.) — the choice just won't persist.
    }
  }, [state]);

  const value: HouseholdViewContextValue = {
    ...state,
    setPersonId: (personId) => setState((s) => ({ ...s, personId })),
    setPerspective: (perspective) => setState((s) => ({ ...s, perspective })),
  };

  return <HouseholdViewContext.Provider value={value}>{children}</HouseholdViewContext.Provider>;
}

export function useHouseholdView() {
  const ctx = useContext(HouseholdViewContext);
  if (!ctx) throw new Error("useHouseholdView must be used within a HouseholdViewProvider");
  return ctx;
}
