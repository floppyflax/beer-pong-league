import type { CSSProperties } from "react";
import { Avatar } from "@/components/design-system/Avatar";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  max?: number;
  /** Match à faire clignoter (nouveau match qui vient de tomber). */
  blinkMatchId?: string | null;
}

interface CardPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Liste des derniers matchs — rail droit du DisplayShell.
 *
 * Card "versus" : équipe A à gauche, équipe B à droite. Les **noms + avatars**
 * (photo quand dispo, sinon initiales) sont l'info primaire ; le **score est
 * secondaire** (petit, au centre). Si le match a une photo finish, on l'affiche
 * en vignette. Gagnant en blanc + 🏆 ; perdant en cool-gray.
 */
export function RecentMatchesPanel({ source, max = 10, blinkMatchId }: Props) {
  const matches = source.matches.slice(0, max);

  const resolveTeam = (ids: string[]): CardPlayer[] =>
    ids.map((id) => {
      const p = source.players.find((sp) => sp.id === id);
      return { id, name: p?.name ?? "Joueur", avatarUrl: p?.avatarUrl };
    });

  return (
    <div className="bg-navy-soft border-[1.5px] border-cool-gray/25 rounded-card p-4 md:p-5 flex-1 min-h-0 flex flex-col">
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
            const teamA = resolveTeam(match.teamA);
            const teamB = resolveTeam(match.teamB);
            const winnerA = match.scoreA > match.scoreB;
            const isBlinking = blinkMatchId === match.id;
            return (
              <div
                key={match.id}
                className={`rounded-card border-[1.5px] p-3 transition-all ${
                  index === 0
                    ? "bg-electric-blue/15 border-electric-blue shadow-[0_3px_0_#0052D4]"
                    : "bg-navy-deep border-cool-gray/20"
                } ${isBlinking ? "animate-glow-pulse ring-2 ring-electric-blue" : ""}`}
                style={
                  isBlinking
                    ? ({ ["--glow"]: "rgba(47,107,255,0.85)" } as CSSProperties)
                    : undefined
                }
              >
                <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-white/85 font-bold mb-2">
                  {new Date(match.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {index === 0 && (
                    <span className="ml-2 text-electric-blue">· Dernier</span>
                  )}
                </div>

                {/* Photo finish (si présente) */}
                {match.photo_url && (
                  <div className="mb-2 rounded-card overflow-hidden border border-card h-16 bg-navy-deep">
                    <img
                      src={match.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Versus : noms + avatars primaires, score secondaire au centre */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <TeamSide players={teamA} isWinner={winnerA} align="left" />
                  <div className="font-mono text-sm tabular-nums text-white/85 font-bold flex items-baseline gap-0.5 flex-shrink-0">
                    <span className={winnerA ? "text-white font-black" : ""}>
                      {match.scoreA}
                    </span>
                    <span className="opacity-60">-</span>
                    <span className={!winnerA ? "text-white font-black" : ""}>
                      {match.scoreB}
                    </span>
                  </div>
                  <TeamSide players={teamB} isWinner={!winnerA} align="right" />
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
  players,
  isWinner,
  align,
}: {
  players: CardPlayer[];
  isWinner: boolean;
  align: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div
      className={`min-w-0 flex items-center gap-2 ${
        isRight ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatars (photo quand dispo, sinon initiales) */}
      <div className={`flex flex-shrink-0 ${isRight ? "flex-row-reverse" : ""}`}>
        {players.slice(0, 2).map((p, i) => (
          <Avatar
            key={p.id}
            name={p.name}
            src={p.avatarUrl}
            size="xs"
            className={i > 0 ? "-ml-2 ring-2 ring-navy-soft" : "ring-2 ring-navy-soft"}
          />
        ))}
      </div>
      <div className={`min-w-0 flex items-center gap-1 ${isRight ? "flex-row-reverse" : ""}`}>
        {isWinner && (
          <span aria-hidden className="text-xs leading-none flex-shrink-0">
            🏆
          </span>
        )}
        {/* Un joueur = une ligne */}
        <div
          className={`min-w-0 flex flex-col ${
            isRight ? "items-end text-right" : "items-start text-left"
          }`}
        >
          {players.map((p) => (
            <span
              key={p.id}
              className={`truncate max-w-full text-sm leading-tight ${
                isWinner
                  ? "font-archivo font-extrabold text-white"
                  : "font-semibold text-white/75"
              }`}
              title={p.name}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
