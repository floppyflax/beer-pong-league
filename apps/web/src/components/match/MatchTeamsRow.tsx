/**
 * MatchTeamsRow — bloc équipes + ELO d'une card de match.
 *
 * Utilisé dans EventDashboard, LeagueDashboard, PlayerProfile (et tout
 * futur listing de matchs). Centralise la règle « 1 ELO par équipe » :
 * dans le calcul ELO actuel (cf. packages/shared/src/utils/elo.ts), les
 * joueurs d'une même équipe partagent l'expected score d'équipe, donc
 * leur delta est *identique* sauf si leurs K-factors diffèrent (un
 * joueur < 20 matchs joués = K 32, autres = K 16). En pratique la
 * grande majorité des matchs → même delta pour toute l'équipe. On
 * affiche donc la valeur du premier joueur comme représentative.
 *
 * Layout (vertical stack) :
 *   🏆 flo2SA, WINNIE                          +16
 *      Amar, Dudu                              −16
 *
 * - Pseudos jamais tronqués (wrap multi-ligne sur min-w-0 + break-words)
 * - ELO toujours visible à droite (`shrink-0`)
 * - Trophée préfixe sur la winning team uniquement
 * - Couleurs : winner blanc + ELO lime, loser cool-gray + ELO signal-red
 * - Si `eloChanges` est absent (match live en cours), on n'affiche pas
 *   la valeur — le layout s'adapte automatiquement.
 */

import type { Player } from "@/types";

export interface MatchTeamsRowProps {
  teamAPlayers: Pick<Player, "id" | "name">[];
  teamBPlayers: Pick<Player, "id" | "name">[];
  winner: "A" | "B";
  /** Map player.id → ELO change (signed integer). Absent on live matches. */
  eloChanges?: Record<string, number> | null;
  className?: string;
}

/**
 * Pick the canonical ELO delta for a team. Reads the first player's delta:
 * within a team the expected score is shared, so deltas only differ by
 * K-factor. Falls back to the first player whose delta exists.
 */
function pickTeamDelta(
  players: Pick<Player, "id">[],
  eloChanges: Record<string, number> | null | undefined,
): number | null {
  if (!eloChanges) return null;
  for (const p of players) {
    const v = eloChanges[p.id];
    if (typeof v === "number") return v;
  }
  return null;
}

function TeamLine({
  players,
  isWinner,
  delta,
}: {
  players: Pick<Player, "id" | "name">[];
  isWinner: boolean;
  delta: number | null;
}) {
  const names = players.map((p) => p.name).join(", ");
  const eloColor = delta == null ? "" : delta >= 0 ? "text-lime" : "text-signal-red";
  const eloSign = delta == null ? "" : delta > 0 ? "+" : "";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <div
        className={`min-w-0 flex-1 text-sm break-words ${
          isWinner ? "text-white font-bold" : "text-cool-gray"
        }`}
      >
        {isWinner && <span className="mr-1.5" aria-hidden>🏆</span>}
        {names}
      </div>
      {delta != null && (
        <div
          className={`shrink-0 font-mono text-sm font-bold tabular-nums ${eloColor}`}
          aria-label={`ELO ${eloSign}${delta}`}
        >
          {eloSign}
          {delta}
        </div>
      )}
    </div>
  );
}

export function MatchTeamsRow({
  teamAPlayers,
  teamBPlayers,
  winner,
  eloChanges,
  className,
}: MatchTeamsRowProps) {
  const winnerPlayers = winner === "A" ? teamAPlayers : teamBPlayers;
  const loserPlayers = winner === "A" ? teamBPlayers : teamAPlayers;
  const winnerDelta = pickTeamDelta(winnerPlayers, eloChanges);
  const loserDelta = pickTeamDelta(loserPlayers, eloChanges);

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <TeamLine players={winnerPlayers} isWinner delta={winnerDelta} />
      <TeamLine players={loserPlayers} isWinner={false} delta={loserDelta} />
    </div>
  );
}
