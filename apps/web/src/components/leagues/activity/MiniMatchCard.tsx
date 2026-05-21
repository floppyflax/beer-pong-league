/**
 * MiniMatchCard — version compacte (~40px) d'un match, utilisée dans le mode
 * "Par event" du tab Activité d'une ligue. Pas de photo, pas de cups badge,
 * pas d'avatars : on conserve juste équipes + score + indicators (live,
 * match point).
 *
 * Pour la version riche (avatars + ELO delta + photo), utiliser
 * `MatchHistoryCard` (cf. TimelineMatchCard).
 */

import type { Match, Player } from "@/types";
import { Zap, Target } from "lucide-react";

export interface MiniMatchCardProps {
  match: Match;
  players: Player[];
}

function resolveNames(ids: string[], players: Player[]): string {
  const map = new Map(players.map((p) => [p.id, p.name]));
  return ids.map((id) => map.get(id) ?? "?").join(", ");
}

export const MiniMatchCard = ({ match, players }: MiniMatchCardProps) => {
  const teamAName = resolveNames(match.teamA, players);
  const teamBName = resolveNames(match.teamB, players);
  const winnerA = match.scoreA > match.scoreB;
  const winnerName = winnerA ? teamAName : teamBName;
  const loserName = winnerA ? teamBName : teamAName;
  const winnerScore = winnerA ? match.scoreA : match.scoreB;
  const loserScore = winnerA ? match.scoreB : match.scoreA;

  const indicators: string[] = [];
  if (match.is_live) indicators.push("live");
  if (match.is_match_point) indicators.push("match point");

  const ariaLabel = `Match: ${teamAName} ${match.scoreA}-${match.scoreB} ${teamBName}, vainqueur ${winnerName}${indicators.length > 0 ? `, ${indicators.join(", ")}` : ""}`;

  return (
    <div
      className="flex items-center gap-2 py-1.5 text-sm"
      aria-label={ariaLabel}
    >
      <span className="text-bronze flex-shrink-0" aria-hidden="true">
        🏆
      </span>
      <span className="text-white font-semibold flex-1 min-w-0 truncate">
        {winnerName}
      </span>
      <span className="font-mono font-bold text-white tabular-nums flex-shrink-0">
        {winnerScore}
      </span>
      <span className="text-cool-gray text-xs flex-shrink-0">—</span>
      <span className="font-mono font-bold text-cool-gray tabular-nums flex-shrink-0">
        {loserScore}
      </span>
      <span className="text-cool-gray flex-1 min-w-0 truncate">{loserName}</span>
      {match.is_live && (
        <Zap
          size={14}
          className="text-lime flex-shrink-0 animate-pulse"
          aria-label="Match en direct"
        />
      )}
      {match.is_match_point && !match.is_live && (
        <Target
          size={14}
          className="text-signal-red flex-shrink-0"
          aria-label="Match point"
        />
      )}
    </div>
  );
};
