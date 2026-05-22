import { useEffect, useRef } from "react";

export interface UseDisplayAutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Rafraîchit périodiquement les données du mode diffusion en appelant
 * `reloadData()` (typiquement `useLeague().reloadData`), pour qu'un nouveau
 * match enregistré depuis un autre appareil apparaisse seul sur l'écran.
 *
 * - `setInterval` (pas de realtime à activer) — robuste, throttlé en
 *   arrière-plan mais ça reste acceptable pour un écran de diffusion.
 * - Skip le tick quand l'onglet est caché (`visibilityState === "hidden"`)
 *   pour ne pas charger la DB inutilement.
 * - Anti-overlap : ne relance pas tant que le précédent `reloadData` n'a pas
 *   résolu.
 */
export function useDisplayAutoRefresh(
  reloadData: () => Promise<void>,
  { intervalMs = 10_000, enabled = true }: UseDisplayAutoRefreshOptions = {},
): void {
  const reloadRef = useRef(reloadData);
  reloadRef.current = reloadData;
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (inFlightRef.current) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      inFlightRef.current = true;
      try {
        await reloadRef.current();
      } catch {
        // Silencieux : un échec de refresh ne doit pas casser l'écran.
      } finally {
        inFlightRef.current = false;
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
