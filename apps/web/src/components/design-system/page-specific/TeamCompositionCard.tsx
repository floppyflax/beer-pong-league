/**
 * TeamCompositionCard — slot card for one team during the compose step of
 * RecordMatch.
 *
 * Tapping the card sets it as the active "ajout en cours" team. Tapping a
 * chip removes the player from the team. Counter shows `n/maxSize` (or just
 * `n` when format is libre).
 */

import { X } from "lucide-react";
import type { Player } from "@/types";
import { PlayerChip } from "../atoms/PlayerChip";
import type { Team } from "./recordMatchInternals";

type PlayerWithAvatar = Player & { avatarUrl?: string | null };

export interface TeamCompositionCardProps {
  team: Team;
  players: PlayerWithAvatar[];
  /** `null` for free-format (no cap). */
  maxSize: number | null;
  active: boolean;
  onActivate: () => void;
  onRemove: (id: string) => void;
}

export function TeamCompositionCard({
  team,
  players,
  maxSize,
  active,
  onActivate,
  onRemove,
}: TeamCompositionCardProps) {
  const isA = team === "A";
  const label = isA ? "Équipe A" : "Équipe B";
  const accentText = isA ? "text-electric-blue" : "text-signal-red";
  const dotBg = isA ? "bg-electric-blue" : "bg-signal-red";
  const borderColor = active
    ? isA
      ? "border-electric-blue"
      : "border-signal-red"
    : "border-card";
  const glow = active ? (isA ? "shadow-glow-electric" : "shadow-glow-red") : "";
  const slotsLabel = maxSize
    ? `${players.length}/${maxSize}`
    : `${players.length}`;

  return (
    <button
      type="button"
      onClick={onActivate}
      className={`w-full text-left bg-navy-soft border-[1.5px] rounded-card p-4 transition-all ${borderColor} ${glow}`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
          <h3
            className={`font-archivo font-extrabold uppercase tracking-tight text-sm ${accentText}`}
          >
            {label}
          </h3>
          {active && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray truncate">
              · ajout en cours
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray shrink-0">
          {slotsLabel}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-xs text-cool-gray/60 italic">
          {active ? "Tap un joueur dans la liste ↓" : "Aucun joueur"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => (
            <span
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(p.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(p.id);
                }
              }}
              className="cursor-pointer"
              aria-label={`Retirer ${p.name}`}
            >
              <PlayerChip
                name={p.name}
                avatarUrl={p.avatarUrl}
                side={team}
                trailing={
                  <X size={12} className="opacity-70 flex-shrink-0" />
                }
              />
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
