import { Crown } from "lucide-react";
import { getInitials } from "@/utils/string";
import type { DisplaySourcePlayer } from "../types";

interface Props {
  /** Top 3 joueurs, déjà triés par rang. */
  players: DisplaySourcePlayer[];
  /** "compact" pour le widget en colonne droite, "fullscreen" pour la scène. */
  variant?: "compact" | "fullscreen";
}

const RANK_RING: Record<number, string> = {
  1: "ring-ping-yellow",
  2: "ring-cool-gray",
  3: "ring-bronze",
};

const RANK_BG: Record<number, string> = {
  1: "bg-ping-yellow text-navy",
  2: "bg-cool-gray text-navy",
  3: "bg-bronze text-white",
};

/**
 * Podium top 3, marches stylisées : 1 au milieu en haut, 2 à gauche, 3 à
 * droite. Réutilise les tokens DS.
 */
export function PodiumStand({ players, variant = "compact" }: Props) {
  if (players.length === 0) {
    return (
      <div className="bg-navy-soft border-[1.5px] border-cool-gray/25 rounded-card p-4 md:p-5 text-center">
        <h3 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-base md:text-lg mb-2">
          Podium
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-cool-gray">
          En attente des premiers matchs
        </p>
      </div>
    );
  }

  const first = players[0];
  const second = players[1];
  const third = players[2];

  const isFs = variant === "fullscreen";

  // Tailles des avatars + marches selon variant. En compact, on reste petit
  // pour tenir dans le rail droit (sinon la 3e colonne est croppée).
  const avatarSize = isFs ? "w-32 h-32" : "w-12 h-12 md:w-14 md:h-14";
  const avatarText = isFs ? "text-4xl" : "text-base";
  const nameSize = isFs ? "text-3xl" : "text-sm";
  const eloSize = isFs ? "text-4xl" : "text-lg";
  const stepHeights = isFs
    ? { 1: "h-32", 2: "h-20", 3: "h-12" }
    : { 1: "h-12", 2: "h-8", 3: "h-6" };

  return (
    <div
      className={`bg-navy-soft border-[1.5px] border-cool-gray/25 rounded-card ${
        isFs ? "p-8 lg:p-10" : "p-4 md:p-5"
      }`}
      data-testid="podium-stand"
    >
      <h3
        className={`font-archivo font-black uppercase tracking-[-0.4px] ${
          isFs ? "text-4xl mb-8 text-center" : "text-base md:text-lg mb-3 text-center"
        }`}
      >
        Podium
      </h3>

      <div
        className={`grid grid-cols-3 items-end ${isFs ? "gap-6" : "gap-1.5"}`}
      >
        {/* #2 — gauche */}
        {second ? (
          <PodiumColumn
            player={second}
            rank={2}
            avatarSize={avatarSize}
            avatarText={avatarText}
            nameSize={nameSize}
            eloSize={eloSize}
            stepHeight={stepHeights[2]}
          />
        ) : (
          <div />
        )}

        {/* #1 — centre, plus haut */}
        <PodiumColumn
          player={first}
          rank={1}
          avatarSize={avatarSize}
          avatarText={avatarText}
          nameSize={nameSize}
          eloSize={eloSize}
          stepHeight={stepHeights[1]}
          highlight
        />

        {/* #3 — droite */}
        {third ? (
          <PodiumColumn
            player={third}
            rank={3}
            avatarSize={avatarSize}
            avatarText={avatarText}
            nameSize={nameSize}
            eloSize={eloSize}
            stepHeight={stepHeights[3]}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

function PodiumColumn({
  player,
  rank,
  avatarSize,
  avatarText,
  nameSize,
  eloSize,
  stepHeight,
  highlight = false,
}: {
  player: DisplaySourcePlayer;
  rank: 1 | 2 | 3;
  avatarSize: string;
  avatarText: string;
  nameSize: string;
  eloSize: string;
  stepHeight: string;
  highlight?: boolean;
}) {
  const initials = getInitials(player.name);
  const ringCls = RANK_RING[rank];
  const stepBg = RANK_BG[rank];

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="relative flex flex-col items-center">
        {highlight && (
          <Crown
            className="text-ping-yellow mb-1"
            size={avatarText.includes("4xl") ? 28 : 22}
            aria-label="Tête du classement"
          />
        )}
        <div
          className={`${avatarSize} rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-2 ${ringCls} ${avatarText}`}
        >
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
      <div
        className={`font-archivo font-extrabold uppercase tracking-tight text-white truncate text-center max-w-full px-1 ${nameSize}`}
        title={player.name}
      >
        {player.name}
      </div>
      <div
        className={`font-archivo font-black tabular-nums text-white ${eloSize}`}
      >
        {player.elo}
      </div>
      <div
        className={`w-full ${stepHeight} ${stepBg} rounded-t-card flex items-start justify-center pt-1 font-archivo font-black`}
      >
        <span className={highlight ? "text-2xl" : "text-base"}>{rank}</span>
      </div>
    </div>
  );
}
