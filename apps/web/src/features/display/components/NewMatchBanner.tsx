import { Zap } from "lucide-react";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";

interface Props {
  match: Match | null;
  source: DisplaySource;
}

/**
 * Bannière d'arrivée d'un nouveau match — canal visuel **primaire** (doit
 * suffire seul, sans le son). Descend du haut, maintient ~2.5s, remonte.
 * Sobre et identique à chaque fois (non intrusif sur répétition).
 * Respecte `prefers-reduced-motion` (pas de slide, juste présence).
 */
export function NewMatchBanner({ match, source }: Props) {
  if (!match) return null;

  const winnerA = match.scoreA > match.scoreB;
  const playerName = (id: string) =>
    source.players.find((p) => p.id === id)?.name ?? "Joueur";
  const winners = (winnerA ? match.teamA : match.teamB)
    .map(playerName)
    .join(" & ");
  const losers = (winnerA ? match.teamB : match.teamA)
    .map(playerName)
    .join(" & ");
  const winScore = Math.max(match.scoreA, match.scoreB);
  const loseScore = Math.min(match.scoreA, match.scoreB);

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 mt-3 md:mt-5 animate-banner-drop motion-reduce:animate-none pointer-events-none"
      role="status"
      aria-live="polite"
      // key force le remontage de l'animation à chaque nouveau match
      key={match.id}
    >
      <div className="flex items-center gap-4 md:gap-6 px-5 md:px-8 py-3 md:py-4 rounded-card bg-navy-soft border-[1.5px] border-electric-blue shadow-glow-electric">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Zap
            size={22}
            className="text-electric-blue animate-pulse"
            aria-hidden
          />
          <span className="font-mono text-xs md:text-sm uppercase tracking-[3px] font-bold text-electric-blue">
            Nouveau match
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-archivo font-extrabold uppercase tracking-tight text-white text-lg md:text-2xl truncate max-w-[28vw]">
            {winners}
          </span>
          <span className="font-archivo font-black tabular-nums text-navy bg-lime rounded px-2 text-lg md:text-2xl flex-shrink-0">
            {winScore}-{loseScore}
          </span>
          <span className="font-archivo font-bold uppercase tracking-tight text-cool-gray text-base md:text-xl truncate max-w-[22vw]">
            {losers}
          </span>
        </div>
      </div>
    </div>
  );
}
