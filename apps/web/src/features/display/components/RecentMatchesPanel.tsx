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
 * Affichage compact : équipes nommées + scores, dernier match mis en avant.
 */
export function RecentMatchesPanel({ source, max = 12, blinkMatchId }: Props) {
  const matches = source.matches.slice(0, max);

  const playerName = (id: string) =>
    source.players.find((p) => p.id === id)?.name ?? "Joueur";

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
            const teamA = match.teamA.map(playerName).join(", ");
            const teamB = match.teamB.map(playerName).join(", ");
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
                <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray font-bold mb-1.5">
                  {new Date(match.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {index === 0 && (
                    <span className="ml-2 text-electric-blue">· Dernier</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div
                    className={`truncate ${
                      winnerA
                        ? "font-archivo font-extrabold text-white text-base"
                        : "text-cool-gray text-sm"
                    }`}
                  >
                    {teamA}{" "}
                    <span className={winnerA ? "text-lime" : "text-cool-gray"}>
                      {match.scoreA}
                    </span>
                  </div>
                  <div
                    className={`truncate ${
                      !winnerA
                        ? "font-archivo font-extrabold text-white text-base"
                        : "text-cool-gray text-sm"
                    }`}
                  >
                    {teamB}{" "}
                    <span className={!winnerA ? "text-lime" : "text-cool-gray"}>
                      {match.scoreB}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
