/**
 * MatchTeamsRow — bloc équipes + ELO d'une card de match.
 *
 * Layout 2 colonnes + séparateur VS au centre :
 *
 *   🏆 +16     |  VS  |       −16
 *   flo2SA     |      |       Amar
 *   WINNIE     |      |       Dudu
 *
 * Décisions :
 * - L'ordre des équipes est *préservé* : team A toujours à gauche,
 *   team B toujours à droite, indépendamment du gagnant. Le trophée 🏆
 *   et la couleur ELO (lime / signal-red) identifient qui a gagné.
 * - 1 valeur ELO par équipe (les joueurs d'une même équipe partagent
 *   l'expected score, donc le delta est identique sauf K-factor d'écart).
 * - 1 joueur = 1 ligne (font-semibold blanc pour le gagnant, cool-gray
 *   pour le perdant).
 * - VS au centre : `font-mono uppercase tracking-widest text-cool-gray`,
 *   self-center vertical par rapport à la grid.
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
  const headerJustify = align === "right" ? "justify-end" : "justify-start";

  return (
    <div className={`min-w-0 space-y-1 ${alignClass}`}>
      <div className={`flex items-baseline gap-1.5 ${headerJustify}`}>
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
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] gap-x-3 items-start ${className ?? ""}`}
    >
      <TeamColumn
        players={teamAPlayers}
        isWinner={winner === "A"}
        delta={pickTeamDelta(teamAPlayers, eloChanges)}
        align="left"
      />
      <div
        className="self-center font-mono text-[10px] font-bold uppercase tracking-widest text-cool-gray"
        aria-hidden
      >
        VS
      </div>
      <TeamColumn
        players={teamBPlayers}
        isWinner={winner === "B"}
        delta={pickTeamDelta(teamBPlayers, eloChanges)}
        align="right"
      />
    </div>
  );
}
