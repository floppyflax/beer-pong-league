import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseAvailable } from "../lib/supabase";
import toast from "react-hot-toast";

const NETWORK_ERR = "Connexion internet requise pour rejoindre";

/**
 * useJoinEvent — code-driven join, supports BOTH events (events table) and leagues.
 *
 * The 6-char alphanumeric code namespace is shared (mig 006 + mig 016 both
 * enforce UNIQUE on the same code shape, but across different tables). We
 * probe events first, then leagues; whichever matches wins. Routes:
 *   - event   →  /event/:id/join
 *   - league  →  /league/:id/join
 *
 * Identity is NOT created here — the join page owns that (IdentityGateSheet).
 * This hook only resolves the code and routes; the gate then asks the user to
 * create an account or play without one, so we must NOT pre-seed a "Joueur"
 * anonymous identity that would pollute the gate with "Continuer en tant que…".
 *
 * Conceptually this is `useJoinByCode`.
 */
export const useJoinEvent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinByCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{6,8}$/.test(trimmedCode)) {
        throw new Error("Code invalide (6-8 caractères alphanumériques)");
      }

      if (!navigator.onLine) throw new Error(NETWORK_ERR);
      if (!isSupabaseAvailable()) throw new Error(NETWORK_ERR);
      if (!supabase) throw new Error(NETWORK_ERR);

      // Race the lookup against a hard timeout so the spinner never hangs.
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(NETWORK_ERR)), 10000),
      );

      // 1) Event lookup
      const eventQuery = supabase
        .from("events")
        .select("id, name, is_finished, join_code")
        .eq("join_code", trimmedCode)
        .maybeSingle();

      const { data: event, error: eventErr } = (await Promise.race([
        eventQuery,
        timeoutPromise,
      ])) as Awaited<typeof eventQuery>;

      if (eventErr && "message" in eventErr) {
        const msg = eventErr.message;
        if (msg.includes("fetch") || msg.includes("network")) {
          throw new Error(NETWORK_ERR);
        }
      }

      if (event) {
        if (event.is_finished) throw new Error("Cet événement est terminé");
        // Identity is chosen on the join page (gate) — don't pre-create one.
        navigate(`/event/${event.id}/join`);
        return;
      }

      // 2) League lookup (mig 016)
      const leagueQuery = supabase
        .from("leagues")
        .select("id, name, join_code")
        .eq("join_code", trimmedCode)
        .maybeSingle();

      const { data: league, error: leagueErr } = (await Promise.race([
        leagueQuery,
        timeoutPromise,
      ])) as Awaited<typeof leagueQuery>;

      if (leagueErr && "message" in leagueErr) {
        const msg = leagueErr.message;
        if (msg.includes("fetch") || msg.includes("network")) {
          throw new Error(NETWORK_ERR);
        }
      }

      if (league) {
        // Identity is chosen on the join page (gate) — don't pre-create one.
        navigate(`/league/${league.id}/join`);
        return;
      }

      throw new Error("Code invalide — aucun événement ni ligue trouvé");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { joinByCode, isLoading, error };
};
