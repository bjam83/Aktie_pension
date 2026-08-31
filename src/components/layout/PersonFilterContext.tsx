"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/** Sentinel personId meaning "hele husstanden" (no filter). */
export const HOUSEHOLD_FILTER = "all";

const STORAGE_KEY = "person-filter";

interface PersonFilterContextValue {
  personId: string;
  setPersonId: (id: string) => void;
}

const PersonFilterContext = createContext<PersonFilterContextValue | null>(null);

function readStored(): string {
  if (typeof window === "undefined") return HOUSEHOLD_FILTER;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || HOUSEHOLD_FILTER;
  } catch {
    return HOUSEHOLD_FILTER;
  }
}

/**
 * Global "hvilken person ser jeg data for" filter — defaults to the whole
 * household, persisted to localStorage so the choice survives between
 * sessions. Wraps Shell's children so every page can read it.
 *
 * Persisting happens directly inside `setPersonId` (called only from user
 * interaction) rather than from a `useEffect` watching `personId` — an
 * effect-based writer raced the mount-time hydration read (the effect saw
 * the pre-hydration default before the hydrated value had committed) and
 * silently never wrote anything. Writing at the point of the actual change
 * has no such race.
 */
export function PersonFilterProvider({ children }: { children: ReactNode }) {
  const [personId, setPersonIdState] = useState<string>(HOUSEHOLD_FILTER);

  useEffect(() => {
    // One-time sync from localStorage after mount, deliberately deferred out
    // of the initial render so server and first-client-render markup match —
    // not an ongoing subscription, and doesn't go through setPersonId below
    // since reading the current value isn't a change that needs persisting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersonIdState(readStored());
  }, []);

  const setPersonId = useCallback((id: string) => {
    setPersonIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable (private mode etc.) — the choice just won't persist.
    }
  }, []);

  return <PersonFilterContext.Provider value={{ personId, setPersonId }}>{children}</PersonFilterContext.Provider>;
}

export function usePersonFilter() {
  const ctx = useContext(PersonFilterContext);
  if (!ctx) throw new Error("usePersonFilter must be used within a PersonFilterProvider");
  return ctx;
}
