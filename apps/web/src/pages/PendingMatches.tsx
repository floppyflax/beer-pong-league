import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Hourglass, Lock, Trophy, X } from "lucide-react";

import { useLeague } from "@/context/LeagueContext";
import { usePendingMatches } from "@/hooks/usePendingMatches";
import { databaseService } from "@/services/DatabaseService";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PButton } from "@/components/ponglo/PButton";

/**
 * PendingMatches — Mig 030
 *
 * Route: `/event/:eventId/validate`
 *
 * Lists every match in the event with `status = 'pending'` that the current
 * user is authorized to validate (opponent in opponent-mode, admin in
 * admin-mode, or admin bypass). Each row exposes Confirmer / Refuser actions
 * that wrap the `confirm_match` RPC via the `usePendingMatches` hook.
 */
function formatRelative(date: string): string {
  const now = new Date();
  const matchDate = new Date(date);
  const diffMs = now.getTime() - matchDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return matchDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export const PendingMatches = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, isLoadingInitialData } = useLeague();
  const event = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId],
  );

  const {
    pendingMatches,
    count,
    isLoading,
    confirmMatch,
    rejectMatch,
  } = usePendingMatches(eventId);

  // Resolve player_id → name once for the whole list.
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    databaseService
      .loadEventParticipants(eventId)
      .then((participants) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const p of participants) {
          map[p.id] = p.name;
        }
        setPlayerNames(map);
      })
      .catch(() => {
        if (!cancelled) setPlayerNames({});
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const handleAction = async (
    matchId: string,
    decision: "confirmed" | "rejected",
  ) => {
    setBusyMatchId(matchId);
    try {
      if (decision === "confirmed") {
        await confirmMatch(matchId);
      } else {
        await rejectMatch(matchId);
      }
    } finally {
      setBusyMatchId(null);
    }
  };

  if (isLoadingInitialData || isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-navy">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-navy text-white">
        <ContextualHeader
          title="Matchs à valider"
          showBackButton
          onBack={() => navigate("/")}
        />
        <div className="p-4">
          <EmptyState
            icon={Trophy}
            title="Événement introuvable"
            description="Cet événement n'existe pas ou a été supprimé."
            action={
              <PButton variant="primary" size="md" onClick={() => navigate("/")}>
                Retour à l&apos;accueil
              </PButton>
            }
          />
        </div>
      </div>
    );
  }

  const validatableMatches = pendingMatches.filter((m) => m.canValidate);
  const lockedMatches = pendingMatches.filter((m) => !m.canValidate);

  return (
    <div className="min-h-screen bg-navy text-white">
      <ContextualHeader
        title="Matchs à valider"
        showBackButton
        onBack={() => navigate(`/event/${event.id}`)}
      />

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {validatableMatches.length === 0 && lockedMatches.length === 0 && (
          <EmptyState
            icon={Hourglass}
            title="Tout est à jour"
            description="Aucun match en attente de validation pour le moment."
          />
        )}

        {validatableMatches.length > 0 && (
          <section className="space-y-3">
            <header className="flex items-center gap-2">
              <Hourglass size={14} className="text-ping-yellow" />
              <h2 className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                À valider ({count})
              </h2>
            </header>
            {validatableMatches.map((m) => {
              const teamANames = m.teamAPlayerIds
                .map((pid) => playerNames[pid] ?? pid.slice(0, 6))
                .join(" & ");
              const teamBNames = m.teamBPlayerIds
                .map((pid) => playerNames[pid] ?? pid.slice(0, 6))
                .join(" & ");
              const winnerA = m.scoreA > m.scoreB;
              const isBusy = busyMatchId === m.id;
              return (
                <article
                  key={m.id}
                  className="bg-navy-soft rounded-card border border-card p-3 space-y-3"
                  data-testid={`pending-match-${m.id}`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-cool-gray font-mono">
                    {formatRelative(m.createdAt)}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div
                      className={`flex-1 text-right truncate ${
                        winnerA ? "text-white font-bold" : "text-cool-gray"
                      }`}
                    >
                      {winnerA && "🏆 "}
                      {teamANames}
                    </div>
                    <div className="font-display text-3xl tabular-nums text-white px-2 whitespace-nowrap">
                      {m.scoreA} – {m.scoreB}
                    </div>
                    <div
                      className={`flex-1 text-left truncate ${
                        !winnerA ? "text-white font-bold" : "text-cool-gray"
                      }`}
                    >
                      {!winnerA && "🏆 "}
                      {teamBNames}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PButton
                      type="button"
                      variant="ghost"
                      size="md"
                      full
                      icon={<X size={16} />}
                      disabled={isBusy}
                      onClick={() => handleAction(m.id, "rejected")}
                    >
                      Refuser
                    </PButton>
                    <PButton
                      type="button"
                      variant="primary"
                      size="md"
                      full
                      icon={<Check size={16} />}
                      disabled={isBusy}
                      onClick={() => handleAction(m.id, "confirmed")}
                    >
                      Confirmer
                    </PButton>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {lockedMatches.length > 0 && (
          <section className="space-y-3">
            <header className="flex items-center gap-2">
              <Lock size={14} className="text-cool-gray" />
              <h2 className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                En attente — autres validateurs ({lockedMatches.length})
              </h2>
            </header>
            {lockedMatches.map((m) => {
              const teamANames = m.teamAPlayerIds
                .map((pid) => playerNames[pid] ?? pid.slice(0, 6))
                .join(" & ");
              const teamBNames = m.teamBPlayerIds
                .map((pid) => playerNames[pid] ?? pid.slice(0, 6))
                .join(" & ");
              const winnerA = m.scoreA > m.scoreB;
              return (
                <article
                  key={m.id}
                  className="bg-navy-deep rounded-card border border-card/60 p-3 opacity-75"
                  data-testid={`pending-match-locked-${m.id}`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-cool-gray font-mono mb-2">
                    {formatRelative(m.createdAt)}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div
                      className={`flex-1 text-right truncate ${
                        winnerA ? "text-white" : "text-cool-gray"
                      }`}
                    >
                      {teamANames}
                    </div>
                    <div className="font-display text-2xl tabular-nums text-cool-gray px-2 whitespace-nowrap">
                      {m.scoreA} – {m.scoreB}
                    </div>
                    <div
                      className={`flex-1 text-left truncate ${
                        !winnerA ? "text-white" : "text-cool-gray"
                      }`}
                    >
                      {teamBNames}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

export default PendingMatches;
