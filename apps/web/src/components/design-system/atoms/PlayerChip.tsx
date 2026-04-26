/**
 * PlayerChip — small pill with avatar + pseudo, side-tinted.
 *
 * Used in score views to identify a player on a team without taking much
 * vertical space. Falls back to colored initials when `avatarUrl` is missing.
 */

import type { ReactNode } from "react";

export type PlayerChipSide = "A" | "B" | "neutral";

export interface PlayerChipProps {
  name: string;
  avatarUrl?: string | null;
  /** Visual tint of the avatar ring. `neutral` = cool-gray. */
  side?: PlayerChipSide;
  /** Soft-fade the chip (e.g. losing team). */
  dim?: boolean;
  /** Optional trailing element (e.g. ELO delta). */
  trailing?: ReactNode;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

const RING: Record<PlayerChipSide, string> = {
  A: "ring-electric-blue/50",
  B: "ring-signal-red/50",
  neutral: "ring-cool-gray/40",
};

const FALLBACK_BG: Record<PlayerChipSide, string> = {
  A: "bg-electric-blue/15 text-electric-blue",
  B: "bg-signal-red/15 text-signal-red",
  neutral: "bg-cool-gray/15 text-cool-gray",
};

export function PlayerChip({
  name,
  avatarUrl,
  side = "neutral",
  dim,
  trailing,
}: PlayerChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-navy/50 border border-card transition-opacity ${
        dim ? "opacity-50" : ""
      }`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={`w-5 h-5 rounded-full object-cover ring-1 ${RING[side]}`}
        />
      ) : (
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-archivo font-extrabold ring-1 ${RING[side]} ${FALLBACK_BG[side]}`}
          aria-hidden
        >
          {initialsOf(name) || "?"}
        </div>
      )}
      <span className="text-xs font-archivo font-bold text-white truncate max-w-[80px]">
        {name}
      </span>
      {trailing}
    </div>
  );
}
