/**
 * StatCard — Story 14-2 + §5.3 (variant="compact")
 *
 * Composant réutilisable pour afficher des résumés chiffrés (Joueurs, Matchs, ELO, etc.).
 * Design system: design-system-convergence.md section 4.1
 *
 * Variants:
 * - `default`  : standard card (bg-navy-soft, large stat value)
 * - `compact`  : smaller cell for Profile 3×2 grid (reduced padding + font)
 * - `primary`  : blue value color (electric-blue)
 * - `accent`   : red value color (signal-red)
 * - `success`  : green value color (lime)
 */

import type { ReactNode } from "react";

export type StatCardVariant = "default" | "compact" | "primary" | "success" | "accent";

const variantColorMap: Record<StatCardVariant, string> = {
  default: "text-white",
  compact: "text-white",
  primary: "text-electric-blue",
  success: "text-lime",
  accent: "text-signal-red",
};

export interface StatCardProps {
  /** Valeur affichée (nombre, texte ou ReactNode) */
  value: ReactNode;
  /** Label sous la valeur (ex: Joueurs, Matchs, ELO) */
  label: string;
  /** Variante sémantique pour la couleur de la valeur et la densité */
  variant?: StatCardVariant;
}

export function StatCard({ value, label, variant = "default" }: StatCardProps) {
  const valueColor = variantColorMap[variant];
  const isCompact = variant === "compact";

  return (
    <div
      className={`bg-navy-soft rounded-card text-center border border-card ${
        isCompact ? "p-2" : "p-3"
      }`}
      data-testid="statcard"
    >
      <div
        className={`font-mono font-bold tabular-nums ${valueColor} ${
          isCompact ? "text-lg" : "text-stat"
        }`}
        data-testid="statcard-value"
      >
        {value}
      </div>
      <div
        className={`text-cool-gray uppercase font-mono font-extrabold tracking-[0.6px] ${
          isCompact ? "text-[9px]" : "text-[10px]"
        }`}
        data-testid="statcard-label"
      >
        {label}
      </div>
    </div>
  );
}
