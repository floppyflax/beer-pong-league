import { Zap } from "lucide-react";
import { getInitials } from "@/utils/string";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";

interface Props {
  match: Match | null;
  source: DisplaySource;
}

/**
 * Alerte plein écran d'arrivée d'un match : floute l'arrière-plan et affiche au
 * premier plan une carte "NOUVEAU MATCH" clignotante avec le résultat. Canal
 * visuel primaire (le son n'est qu'un renfort). Respecte prefers-reduced-motion.
 */
export function NewMatchAlertOverlay({ match, source }: Props) {
  if (!match) return null;

  const winnerA = match.scoreA > match.scoreB;
  const player = (id: string) => source.players.find((p) => p.id === id);
  const name = (id: string) => player(id)?.name ?? "Joueur";
  const winners = winnerA ? match.teamA : match.teamB;
  const losers = winnerA ? match.teamB : match.teamA;
  const winScore = Math.max(match.scoreA, match.scoreB);
  const loseScore = Math.min(match.scoreA, match.scoreB);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-navy/50 overflow-hidden"
      role="status"
      aria-live="assertive"
      key={match.id}
    >
      {/* Flash de l'écran (clignotement) — derrière la carte */}
      <div
        className="absolute inset-0 bg-electric-blue animate-screen-flash motion-reduce:hidden pointer-events-none"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6 px-10 py-8 rounded-card bg-navy-soft border-2 border-electric-blue shadow-glow-electric max-w-[80vw]">
        <div className="flex items-center gap-3 animate-pulse">
          <Zap size={28} className="text-electric-blue" aria-hidden />
          <span className="font-mono uppercase tracking-[6px] font-bold text-electric-blue text-base md:text-2xl">
            Nouveau match
          </span>
          <Zap size={28} className="text-electric-blue" aria-hidden />
        </div>

        <div className="flex items-center gap-6 md:gap-10">
          <TeamBlock ids={winners} nameOf={name} isWinner />
          <div className="flex flex-col items-center">
            <span
              className="font-archivo font-black tabular-nums leading-none text-white"
              style={{ fontSize: "min(120px, 14vh)", letterSpacing: "-4px" }}
            >
              {winScore}
              <span className="text-cool-gray/50 mx-1">-</span>
              <span className="text-cool-gray">{loseScore}</span>
            </span>
          </div>
          <TeamBlock ids={losers} nameOf={name} isWinner={false} />
        </div>
      </div>
    </div>
  );
}

function TeamBlock({
  ids,
  nameOf,
  isWinner,
}: {
  ids: string[];
  nameOf: (id: string) => string;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex -space-x-3">
        {ids.slice(0, 3).map((id) => (
          <div
            key={id}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white border-2 ring-2 ${
              isWinner ? "ring-lime border-lime/40" : "ring-signal-red border-signal-red/40"
            }`}
          >
            {getInitials(nameOf(id))}
          </div>
        ))}
      </div>
      <span
        className={`font-archivo font-extrabold uppercase tracking-tight text-xl md:text-3xl ${
          isWinner ? "text-lime" : "text-signal-red"
        }`}
      >
        {ids.map(nameOf).join(" & ")}
      </span>
    </div>
  );
}
