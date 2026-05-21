/**
 * MatchTeamsRow — bloc équipes + ELO d'une card de match.
 *
 * Layout (stack vertical, 1 ligne par joueur, ELO unique par équipe) :
 *
 *   🏆 ÉQUIPE GAGNANTE                  +16
 *   flo2SA
 *   WINNIE
 *
 *   ADVERSAIRES                         −16
 *   Amar
 *   Dudu
 *
 * Décisions :
 * - 1 valeur ELO par équipe (les joueurs d'une même équipe partagent
 *   l'expected score, donc le delta est identique sauf K-factor d'écart).
 *   On lit le delta du premier joueur disposant d'une valeur.
 * - 1 ligne par joueur (pas de noms concaténés en virgules) → zéro
 *   cropping, scan vertical clair.
 * - Header de section : font-mono lime (winner) ou cool-gray (loser)
 *   avec l'ELO sur la même ligne, justify-between.
 * - Si `eloChanges` absent (match live), l'ELO est simplement omis.
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

function TeamBlock({
  label,
  isWinner,
  players,
  delta,
}: {
  label: string;
  isWinner: boolean;
  players: Pick<Player, "id" | "name">[];
  delta: number | null;
}) {
  const labelColor = isWinner ? "text-lime" : "text-cool-gray";
  const eloColor =
    delta == null ? "" : delta >= 0 ? "text-lime" : "text-signal-red";
  const eloSign = delta == null ? "" : delta > 0 ? "+" : "";
  const nameColor = isWinner ? "text-white" : "text-cool-gray";

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-widest ${labelColor}`}
        >
          {isWinner && <span aria-hidden>🏆 </span>}
          {label}
        </span>
        {delta != null && (
          <span
            className={`shrink-0 font-mono text-sm font-bold tabular-nums ${eloColor}`}
            aria-label={`ELO ${eloSign}${delta}`}
          >
            {eloSign}
            {delta}
          </span>
        )}
      </div>
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
    <div className={`space-y-3 ${className ?? ""}`}>
      <TeamBlock
        label="Équipe gagnante"
        isWinner
        players={winnerPlayers}
        delta={pickTeamDelta(winnerPlayers, eloChanges)}
      />
      <TeamBlock
        label="Adversaires"
        isWinner={false}
        players={loserPlayers}
        delta={pickTeamDelta(loserPlayers, eloChanges)}
      />
    </div>
  );
}
