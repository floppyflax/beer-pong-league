/**
 * MyRankBadge — affiche mon rang `1er / 10`, `2e / 10`, … `Ne / 10`.
 *
 * Couleur `ping-yellow` (palette : « podium 1st », cf. tailwind.config.js).
 * Utilisé sur EventCard, LeagueCard, et la bannière "Active event" de la Home.
 */

import React from "react";

export interface MyRankBadgeProps {
  rank: number;
  total: number;
  /** Taille du texte. `sm` = `text-[13px]` (banner inline), `md` = `text-base` (card title row, défaut). */
  size?: "sm" | "md";
}

function formatRankOrdinal(rank: number): string {
  if (rank === 1) return "1er";
  return `${rank}e`;
}

export const MyRankBadge: React.FC<MyRankBadgeProps> = ({
  rank,
  total,
  size = "md",
}) => {
  const textCls = size === "sm" ? "text-[13px]" : "text-base";
  return (
    <span
      className={`font-archivo font-extrabold text-ping-yellow shrink-0 ${textCls}`}
      data-testid="my-rank-badge"
      aria-label={`Tu es ${formatRankOrdinal(rank)} sur ${total}`}
    >
      {formatRankOrdinal(rank)} / {total}
    </span>
  );
};
