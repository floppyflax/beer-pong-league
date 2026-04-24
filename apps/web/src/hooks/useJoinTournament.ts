import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseAvailable } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "./useIdentity";
import toast from "react-hot-toast";

const NETWORK_ERR = "Connexion internet requise pour rejoindre";

/**
 * useJoinTournament — code-driven join, supports BOTH tournaments and leagues.
 *
 * The 6-char alphanumeric code namespace is shared (mig 006 + mig 016 both
 * enforce UNIQUE on the same code shape, but across different tables). We
 * probe tournaments first, then leagues; whichever matches wins. Routes:
 *   - tournament  →  /tournament/:id/join
 *   - league      →  /league/:id/join
 *
 * Hook name is kept for backward compatibility with existing call sites
 * (Join.tsx). Conceptually this is `useJoinByCode`.
 */
export const useJoinTournament = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentity();
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

      // 1) Tournament lookup
      const tournamentQuery = supabase
        .from("tournaments")
        .select("id, name, is_finished, join_code")
        .eq("join_code", trimmedCode)
        .maybeSingle();

      const { data: tournament, error: tournamentErr } = (await Promise.race([
        tournamentQuery,
        timeoutPromise,
      ])) as Awaited<typeof tournamentQuery>;

      if (tournamentErr && "message" in tournamentErr) {
        const msg = tournamentErr.message;
        if (msg.includes("fetch") || msg.includes("network")) {
          throw new Error(NETWORK_ERR);
        }
      }

      if (tournament) {
        if (tournament.is_finished) throw new Error("Ce tournoi est terminé");

        if (!isAuthenticated && !localUser) {
          await initializeAnonymousUser();
        }
        toast.success(`Bienvenue dans le tournoi ${tournament.name} !`);
        navigate(`/tournament/${tournament.id}/join`);
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
        if (!isAuthenticated && !localUser) {
          await initializeAnonymousUser();
        }
        toast.success(`Bienvenue dans la ligue ${league.name} !`);
        navigate(`/league/${league.id}/join`);
        return;
      }

      throw new Error("Code invalide — aucun tournoi ni ligue trouvé");
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
