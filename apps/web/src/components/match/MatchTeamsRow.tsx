/**
 * MatchTeamsRow — bloc équipes + ELO d'une card de match.
 *
 * Layout 2 colonnes côte à côte (gauche = gagnant, droite = perdant) :
 *
 *   🏆 +17                |   −17
 *   Niko                  |   Amar
 *   Dudu                  |   WINNIE
 *
 * Décisions :
 * - Pas de labels textuels « ÉQUIPE GAGNANTE » / « ADVERSAIRES » — le
 *   trophée 🏆 + couleur ELO suffisent à identifier le camp.
 * - 1 valeur ELO par équipe sur la ligne du haut → scan rapide
 *   « qui a pris combien » en priorité.
 * - 1 joueur = 1 ligne, alignement haut (asymétrie 1v3 tolérée sans
 *   désaligner les ELO entre colonnes).
 * - Si `eloChanges` absent (match live), seuls les noms sont affichés.
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

function TeamColumn({
  players,
  isWinner,
  delta,
  align,
}: {
  players: Pick<Player, "id" | "name">[];
  isWinner: boolean;
  delta: number | null;
  align: "left" | "right";
}) {
  const eloColor = isWinner ? "text-lime" : "text-signal-red";
  const eloSign = delta == null ? "" : delta > 0 ? "+" : delta < 0 ? "−" : "";
  const nameColor = isWinner ? "text-white" : "text-cool-gray";
  const alignClass = align === "right" ? "text-right" : "text-left";

  return (
    <div className={`min-w-0 space-y-1 ${alignClass}`}>
      {/* Header : trophée (winner only) + ELO */}
      <div
        className={`flex items-baseline gap-1.5 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        {isWinner && (
          <span aria-hidden className="text-base leading-none">
            🏆
          </span>
        )}
        {delta != null && (
          <span
            className={`font-mono text-sm font-bold tabular-nums ${eloColor}`}
            aria-label={`ELO ${eloSign}${Math.abs(delta)}`}
          >
            {eloSign}
            {Math.abs(delta)}
          </span>
        )}
      </div>

      {/* Liste des joueurs, 1 par ligne */}
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li
            key={p.id}
            className={`text-sm font-semibold break-words ${nameColor}`}
          >
            {p.name}
          </li>
        ))}
      </ul>
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

  return (
    <div className={`grid grid-cols-2 gap-x-4 ${className ?? ""}`}>
      <TeamColumn
        players={winnerPlayers}
        isWinner
        delta={pickTeamDelta(winnerPlayers, eloChanges)}
        align="left"
      />
      <TeamColumn
        players={loserPlayers}
        isWinner={false}
        delta={pickTeamDelta(loserPlayers, eloChanges)}
        align="right"
      />
    </div>
  );
}
