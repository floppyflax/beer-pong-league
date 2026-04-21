import { useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";

/**
 * Full disconnect: clears Supabase auth + local identity + sessionStorage.
 * Forces full page reload to Landing (/) so React state is fresh.
 *
 * Story 14.34: Bouton de déconnexion complète
 */
export function useFullDisconnect() {
  const { signOut } = useAuthContext();
  const { clearIdentity } = useIdentity();

  const fullDisconnect = useCallback(async () => {
    // 1. Supabase auth (if authenticated)
    await signOut();

    // 2. Local/anonymous identity
    clearIdentity();

    // 3. Session storage — auth-related keys (AC3: authReturnTo and any auth-related)
    const AUTH_SESSION_KEYS = ["authReturnTo"];
    AUTH_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));

    // 4. Clear LeagueContext cache to avoid stale data
    localStorage.removeItem("bpl_leagues");
    localStorage.removeItem("bpl_tournaments");
    localStorage.removeItem("bpl_current_league_id");
    localStorage.removeItem("bpl_current_tournament_id");

    // 5. Full page reload to / — guarantees fresh state, no cached identity
    window.location.replace("/");
  }, [signOut, clearIdentity]);

  return { fullDisconnect };
}
