import type { CSSProperties } from "react";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  max?: number;
  /** Match à faire clignoter (nouveau match qui vient de tomber). */
  blinkMatchId?: string | null;
}

/**
 * Liste des derniers matchs — réutilisée dans le rail droit du DisplayShell.
 *
 * Card "versus" alignée sur le style match de l'app (cf. MatchTeamsRow) :
 * équipe A à gauche, score au centre, équipe B à droite. Le gagnant est en
 * blanc + son score en lime ; le perdant en cool-gray.
 */
export function RecentMatchesPanel({ source, max = 12, blinkMatchId }: Props) {
  const matches = source.matches.slice(0, max);

  const teamNames = (ids: string[]) =>
    ids.map((id) => source.players.find((p) => p.id === id)?.name ?? "Joueur");

  return (
    <div className="bg-navy-soft border border-card rounded-card p-4 md:p-5 flex-1 min-h-0 flex flex-col">
      <h3 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-lg md:text-xl mb-3 flex-shrink-0">
        Derniers matchs
      </h3>
      <div className="space-y-2 overflow-y-auto min-h-0 flex-1">
        {matches.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-cool-gray text-center py-4">
            En attente du premier match
          </p>
        ) : (
          matches.map((match, index) => {
            const teamA = teamNames(match.teamA);
            const teamB = teamNames(match.teamB);
            const winnerA = match.scoreA > match.scoreB;
            const isBlinking = blinkMatchId === match.id;
            return (
              <div
                key={match.id}
                className={`rounded-card border-[1.5px] p-3 transition-all ${
                  index === 0
                    ? "bg-electric-blue/10 border-electric-blue shadow-[0_3px_0_#0052D4]"
                    : "bg-navy/60 border-card"
                } ${isBlinking ? "animate-glow-pulse ring-2 ring-electric-blue" : ""}`}
                style={
                  isBlinking
                    ? ({ ["--glow"]: "rgba(47,107,255,0.85)" } as CSSProperties)
                    : undefined
                }
              >
                <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray font-bold mb-2">
                  {new Date(match.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {index === 0 && (
                    <span className="ml-2 text-electric-blue">· Dernier</span>
                  )}
                </div>

                {/* Versus : équipe A | score | équipe B */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <TeamSide names={teamA} isWinner={winnerA} align="left" />
                  <div className="font-archivo font-black tabular-nums text-lg leading-none flex items-baseline gap-0.5">
                    <span className={winnerA ? "text-lime" : "text-cool-gray"}>
                      {match.scoreA}
                    </span>
                    <span className="text-cool-gray/60 text-sm">-</span>
                    <span className={!winnerA ? "text-lime" : "text-cool-gray"}>
                      {match.scoreB}
                    </span>
                  </div>
                  <TeamSide names={teamB} isWinner={!winnerA} align="right" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TeamSide({
  names,
  isWinner,
  align,
}: {
  names: string[];
  isWinner: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`min-w-0 flex items-center gap-1 ${
        align === "right" ? "justify-end flex-row-reverse text-right" : "text-left"
      }`}
    >
      {isWinner && (
        <span aria-hidden className="text-xs leading-none flex-shrink-0">
          🏆
        </span>
      )}
      <span
        className={`truncate text-sm ${
          isWinner
            ? "font-archivo font-extrabold text-white"
            : "font-medium text-cool-gray"
        }`}
        title={names.join(", ")}
      >
        {names.join(", ")}
      </span>
    </div>
  );
}
