import { useState } from "react";
import { getInitials } from "@/utils/string";
import {
  useDuoRivalryStats,
  type FocusTile,
  type FocusTileColor,
  type PlayerFocus,
} from "../hooks/useDuoRivalryStats";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

const TILE_COLOR: Record<FocusTileColor, string> = {
  white: "text-white",
  lime: "text-lime",
  "signal-red": "text-signal-red",
  "electric-blue": "text-electric-blue",
  "ping-yellow": "text-ping-yellow",
};

const RANK_BADGE: Record<number, string> = {
  1: "bg-ping-yellow text-navy",
  2: "bg-cool-gray text-navy",
  3: "bg-bronze text-white",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Scène "Focus joueur" : un joueur tiré au hasard à chaque passage, affiché en
 * grand (avatar + nom + rang + ELO), avec un panneau de ses stats perso
 * (bilan, série, meilleur allié, bête noire, format favori, forme).
 */
export function PlayerFocusScene({ source }: Props) {
  const stats = useDuoRivalryStats(source);
  // Tirage figé au mount → varie à chaque passage du diaporama.
  const [focus] = useState<PlayerFocus | null>(() => {
    const ids = shuffle(stats.eligiblePlayerIds);
    for (const id of ids) {
      const f = stats.playerFocusFor(id);
      if (f && f.tiles.length >= 3) return f;
    }
    for (const id of ids) {
      const f = stats.playerFocusFor(id);
      if (f) return f;
    }
    return null;
  });

  if (!focus) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center">
        <p className="font-archivo font-black uppercase tracking-tight text-3xl text-cool-gray text-center">
          Pas encore assez de matchs
        </p>
      </div>
    );
  }

  const { player, tiles } = focus;
  const badge = RANK_BADGE[player.rank] ?? "bg-cool-gray/50 text-white";

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Focus joueur
      </h2>

      <div className="flex-1 min-h-0 grid grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
        {/* Joueur en grand */}
        <div className="flex flex-col items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 md:w-52 md:h-52 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-4 ring-electric-blue/60 text-5xl md:text-7xl">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(player.name)}</span>
              )}
            </div>
            <div
              className={`absolute -bottom-2 -right-2 min-w-[40px] h-[40px] px-2 rounded-full flex items-center justify-center font-archivo font-black text-xl ring-4 ring-navy-soft ${badge}`}
              aria-label={`Rang ${player.rank}`}
            >
              {player.rank}
            </div>
          </div>
          <div className="font-archivo font-black uppercase tracking-tight text-white text-3xl md:text-5xl truncate max-w-[34vw] text-center">
            {player.name}
          </div>
          <div className="font-mono text-xs md:text-sm uppercase tracking-[2px] text-cool-gray font-bold">
            ELO{" "}
            <span className="text-lime font-archivo font-black text-xl md:text-3xl ml-1 align-middle">
              {player.elo}
            </span>
          </div>
        </div>

        {/* Tuiles de stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 min-h-0 content-center">
          {tiles.slice(0, 6).map((tile) => (
            <FocusTileCard key={tile.label} tile={tile} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FocusTileCard({ tile }: { tile: FocusTile }) {
  return (
    <div className="bg-navy-soft border-[1.5px] border-card rounded-card p-4 md:p-5 flex flex-col justify-center min-h-0 overflow-hidden">
      <div className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray font-bold mb-1.5">
        {tile.label}
      </div>
      <div
        className={`font-archivo font-black uppercase tracking-tight truncate ${TILE_COLOR[tile.color]}`}
        style={{ fontSize: "clamp(24px, 4vh, 40px)" }}
      >
        {tile.value}
      </div>
      {tile.sub && (
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray mt-1 truncate">
          {tile.sub}
        </div>
      )}
    </div>
  );
}
