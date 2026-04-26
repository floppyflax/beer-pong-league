/**
 * QuickAction — square tile with icon + label + sub.
 *
 * Used for action grids on Home (Nouveau match, Rejoindre, Tournoi, Ligue).
 * Caller controls `bg`/`color` so the tile inherits the right brand chip
 * (lime / electric / accent / ghost). Pass `border` for the outlined variant.
 */

import type { ReactNode } from "react";

export interface QuickActionProps {
  label: string;
  sub: string;
  icon: ReactNode;
  /** Tailwind bg utility (e.g. `bg-lime`, `bg-electric-blue/15`). */
  bg: string;
  /** Tailwind text-color utility paired with `bg` for contrast. */
  color: string;
  border?: boolean;
  onClick?: () => void;
}

export function QuickAction({
  label,
  sub,
  icon,
  bg,
  color,
  border,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${bg} ${color} ${
        border ? "border-[1.5px] border-card" : ""
      } rounded-lg p-3.5 flex flex-col justify-between gap-[22px] min-h-[86px] text-left transition-transform active:scale-[0.98]`}
    >
      <div className="opacity-80">{icon}</div>
      <div>
        <div className="font-archivo font-extrabold text-sm tracking-[-0.2px]">
          {label}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.5px] opacity-70 mt-0.5">
          {sub}
        </div>
      </div>
    </button>
  );
}
