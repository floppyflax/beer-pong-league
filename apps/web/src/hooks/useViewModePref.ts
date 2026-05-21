/**
 * useViewModePref — persistance localStorage du mode d'affichage du tab Activité.
 *
 * Le mode est partagé entre toutes les ligues (pref globale utilisateur).
 * Si la valeur stockée est invalide, on retombe sur `defaultMode`.
 */

import { useState, useCallback } from "react";

export type ActivityViewMode = "grouped" | "timeline";

const STORAGE_KEY = "bpl_league_activity_view_mode";

function readStoredMode(): ActivityViewMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grouped" || stored === "timeline") return stored;
    return null;
  } catch {
    // localStorage peut throw en mode privé Safari / SSR — fallback silencieux.
    return null;
  }
}

export function useViewModePref(
  defaultMode: ActivityViewMode,
): [ActivityViewMode, (mode: ActivityViewMode) => void] {
  const [mode, setMode] = useState<ActivityViewMode>(() => {
    return readStoredMode() ?? defaultMode;
  });

  const update = useCallback((next: ActivityViewMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // idem — pas de blocage si localStorage indispo.
    }
  }, []);

  return [mode, update];
}
