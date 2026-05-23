import { UserPlus } from "lucide-react";
import { getInitials } from "@/utils/string";
import type { DisplaySourcePlayer } from "../types";

interface Props {
  players: DisplaySourcePlayer[];
}

/**
 * Alerte plein écran d'arrivée d'un (ou plusieurs) nouveau(x) joueur(s) :
 * floute l'arrière-plan et affiche au premier plan une carte "NOUVEAU
 * JOUEUR" clignotante avec l'avatar et le nom. Même grammaire visuelle que
 * `NewMatchAlertOverlay` (canal visuel primaire, son en renfort) — palette
 * Everything ELO (electric-blue + ping-yellow pour le sceau "welcome").
 * Respecte prefers-reduced-motion.
 */
export function NewPlayerAlertOverlay({ players }: Props) {
  if (players.length === 0) return null;

  const isMulti = players.length > 1;
  const headline = isMulti ? "Nouveaux joueurs" : "Nouveau joueur";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-navy/50 overflow-hidden"
      role="status"
      aria-live="assertive"
      key={players.map((p) => p.id).join(",")}
    >
      {/* Flash de l'écran (clignotement) — derrière la carte */}
      <div
        className="absolute inset-0 bg-ping-yellow animate-screen-flash motion-reduce:hidden pointer-events-none"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6 px-10 py-8 rounded-card bg-navy-soft border-2 border-ping-yellow shadow-glow-electric max-w-[80vw]">
        <div className="flex items-center gap-3 animate-pulse">
          <UserPlus size={28} className="text-ping-yellow" aria-hidden />
          <span className="font-mono uppercase tracking-[6px] font-bold text-ping-yellow text-base md:text-2xl">
            {headline}
          </span>
          <UserPlus size={28} className="text-ping-yellow" aria-hidden />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 max-w-[70vw]">
          {players.slice(0, 6).map((player) => (
            <PlayerBlock key={player.id} player={player} />
          ))}
          {players.length > 6 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-navy-deep flex items-center justify-center font-archivo font-black text-white text-2xl md:text-3xl border-2 ring-2 ring-ping-yellow border-ping-yellow/40">
                +{players.length - 6}
              </div>
              <span className="font-archivo font-extrabold uppercase tracking-tight text-lg md:text-xl text-ping-yellow">
                de plus
              </span>
            </div>
          )}
        </div>

        <span className="font-mono uppercase tracking-[3px] text-xs md:text-sm text-cool-gray font-bold">
          Bienvenue dans la ligue
        </span>
      </div>
    </div>
  );
}

function PlayerBlock({ player }: { player: DisplaySourcePlayer }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white text-2xl md:text-3xl border-2 ring-2 ring-ping-yellow border-ping-yellow/40 overflow-hidden">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(player.name)}</span>
        )}
      </div>
      <span className="font-archivo font-extrabold uppercase tracking-tight text-xl md:text-3xl text-ping-yellow text-center max-w-[200px] truncate">
        {player.name}
      </span>
    </div>
  );
}
