/**
 * LeagueMatchCard — card de match unifiée du tab Activité d'une ligue.
 *
 * Rendu commun aux matchs d'event (EventGroupCard), aux matchs libres
 * (OrphanMatchesSection) et à la timeline (TimelineMatchCard) : un même
 * format basé sur `MatchTeamsRow` (équipes A VS B + trophée + ELO),
 * précédé des badges de statut anti-cheat, suivi d'un footer
 * timestamp + photo/cups.
 *
 * Les ids des `match.teamA/teamB` doivent appartenir au même namespace
 * que `players[].id` (event_memberships.id pour les events, league
 * memberships pour les matchs libres) — la résolution est faite par
 * l'appelant via le bon jeu de `players`.
 */

import { CheckCircle2, Hourglass, XCircle } from "lucide-react";
import type { Match, Player } from "@/types";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { MatchTeamsRow } from "@/components/match/MatchTeamsRow";
import { formatRelativeTime } from "@/utils/dateUtils";

export interface LeagueMatchCardProps {
  match: Match;
  players: Player[];
  /**
   * Mig 032 — drives the visibility of the "Validé" badge on confirmed
   * matches. Pending and rejected badges show regardless (they aren't
   * visual noise — they ARE actionable / soft-deleted state).
   */
  antiCheatEnabled?: boolean;
  /** Override the data-testid (defaults to "league-match-card"). */
  testId?: string;
}

export const LeagueMatchCard = ({
  match,
  players,
  antiCheatEnabled = false,
  testId = "league-match-card",
}: LeagueMatchCardProps) => {
  const teamAPlayers = players.filter((p) => match.teamA.includes(p.id));
  const teamBPlayers = players.filter((p) => match.teamB.includes(p.id));
  const winnerA = match.scoreA > match.scoreB;

  return (
    <div
      className={`bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
      data-testid={testId}
    >
      <LiveMatchBadge isLive={Boolean(match.is_live)} className="mb-2" />
      {match.status === "pending" && (
        <div
          className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ping-yellow/15 text-ping-yellow text-[10px] font-bold uppercase tracking-wide"
          data-testid="match-status-pending"
          aria-label="Match en attente de validation"
        >
          <Hourglass size={11} aria-hidden="true" />
          En attente de validation
        </div>
      )}
      {match.status === "rejected" && (
        <div
          className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-red/15 text-signal-red text-[10px] font-bold uppercase tracking-wide"
          data-testid="match-status-rejected"
          aria-label="Match refusé"
        >
          <XCircle size={11} aria-hidden="true" />
          Refusé
        </div>
      )}
      {match.status === "confirmed" && antiCheatEnabled && (
        <div
          className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime/15 text-lime text-[10px] font-bold uppercase tracking-wide"
          data-testid="match-status-validated"
          aria-label="Match validé"
        >
          <CheckCircle2 size={11} aria-hidden="true" />
          Validé
        </div>
      )}
      <MatchTeamsRow
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        winner={winnerA ? "A" : "B"}
        eloChanges={match.eloChanges}
      />
      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="text-xs text-cool-gray">
          {formatRelativeTime(match.date)}
        </div>
        <MatchEnrichedDisplay
          photoUrl={match.photo_url}
          cupsRemaining={match.cups_remaining}
        />
      </div>
    </div>
  );
};
