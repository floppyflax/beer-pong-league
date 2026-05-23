import { type CSSProperties } from "react";
import { getInitials } from "@/utils/string";
import type { DisplaySourcePlayer } from "../types";

const GLOW_WIN = "rgba(183,255,59,0.85)"; // lime
const GLOW_LOSE = "rgba(255,59,59,0.85)"; // signal-red

interface Props {
  /** Ordre du classement à afficher (committé par le DisplayShell). */
  players: DisplaySourcePlayer[];
  /** Vainqueurs du dernier match → la ligne brille en vert. */
  winnerIds?: Set<string>;
  /** Perdants du dernier match → la ligne brille en rouge. */
  loserIds?: Set<string>;
}

function rankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-ping-yellow text-navy";
    case 2:
      return "bg-cool-gray text-navy";
    case 3:
      return "bg-bronze text-white";
    default:
      return "bg-navy-deep text-white border-[1.5px] border-cool-gray/40";
  }
}

function PlayerRow({
  player,
  highlight,
}: {
  player: DisplaySourcePlayer;
  highlight: "winner" | "loser" | null;
}) {
  return (
    <div className="relative bg-navy-soft border-[1.5px] border-cool-gray/20 rounded-card px-2.5 py-1 mb-1.5 break-inside-avoid">
      {highlight && (
        <div
          aria-hidden
          className={`absolute inset-0 rounded-card pointer-events-none animate-glow-pulse ring-2 ${
            highlight === "winner"
              ? "bg-lime/25 ring-lime"
              : "bg-signal-red/25 ring-signal-red"
          }`}
          style={
            {
              ["--glow"]: highlight === "winner" ? GLOW_WIN : GLOW_LOSE,
            } as CSSProperties
          }
        />
      )}
      <div className="relative flex items-center gap-2">
        {/* Rang — réduit à la taille de l'avatar (w-9) pour gagner en
            densité verticale ; médaille colorée pour top 3. */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-archivo font-black text-base tabular-nums ${rankBadgeClass(player.rank)}`}
          aria-label={`Rang ${player.rank}`}
        >
          {player.rank}
        </div>

        {/* Avatar compact */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-cool-gray overflow-hidden border border-card">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[11px]">{getInitials(player.name)}</span>
          )}
        </div>

        {/* Nom — flex-1 pour pousser stats/ELO à droite, sur une seule ligne. */}
        <div className="flex-1 min-w-0 font-archivo font-extrabold text-[15px] leading-tight truncate">
          {player.name}
        </div>

        {/* V/D — gros, à droite, sur la MÊME ligne que le reste. */}
        <div className="flex-shrink-0 font-archivo font-black text-lg tabular-nums leading-none">
          <span className="text-lime">{player.wins}</span>
          <span className="text-cool-gray/60 mx-0.5">—</span>
          <span className="text-signal-red">{player.losses}</span>
        </div>

        {/* % — discret, séparateur visuel. */}
        <div className="flex-shrink-0 font-mono text-xs font-bold tabular-nums text-white/75 min-w-[2.4rem] text-right">
          {player.winRate}%
        </div>

        {/* ELO — bloc principal à droite. */}
        <div className="flex-shrink-0 font-archivo font-black text-xl text-white tracking-tight tabular-nums min-w-[3rem] text-right">
          {player.elo}
        </div>
      </div>
    </div>
  );
}

/**
 * Scène classement wide : pleine largeur (rail droit masqué), 1 à 3 colonnes
 * selon la taille d'écran via CSS `columns-*`. Affiche bien plus de joueurs
 * en un coup d'œil que la scène `ranking` classique. Pas de scroll : si le
 * nombre de joueurs dépasse la hauteur, la grille se compresse via
 * `overflow-hidden` (et c'est OK car la scène est `timed` — la rotation
 * reprend).
 *
 * Colonnes :
 *  - mobile        → 1 col
 *  - tablet (md)   → 2 cols
 *  - desktop (lg+) → 3 cols
 *
 * Les lignes ont `break-inside-avoid` pour ne jamais être coupées entre deux
 * colonnes. Le flux CSS-columns remplit naturellement de haut en bas, puis
 * passe à la colonne suivante.
 *
 * Pas de forme récente (5 derniers résultats) — la densité prime ici.
 */
export function RankingWideScene({ players, winnerIds, loserIds }: Props) {
  const highlightFor = (id: string): "winner" | "loser" | null => {
    if (winnerIds?.has(id)) return "winner";
    if (loserIds?.has(id)) return "loser";
    return null;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Classement complet
      </h2>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-3 md:gap-4 h-full">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              highlight={highlightFor(player.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
