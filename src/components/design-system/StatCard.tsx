/**
 * StatCard — Story 14-2
 *
 * Composant réutilisable pour afficher des résumés chiffrés (Joueurs, Matchs, ELO, etc.).
 * Design system: design-system-convergence.md section 4.1
 */

import type { ReactNode } from "react";

export type StatCardVariant = "primary" | "success" | "accent";

const variantColorMap: Record<StatCardVariant, string> = {
  primary: "text-cup-blue",
  success: "text-lime",
  accent: "text-cup-red",
};

export interface StatCardProps {
  /** Valeur affichée (nombre, texte ou ReactNode) */
  value: ReactNode;
  /** Label sous la valeur (ex: Joueurs, Matchs, ELO) */
  label: string;
  /** Variante sémantique pour la couleur de la valeur */
  variant?: StatCardVariant;
}

export function StatCard({ value, label, variant }: StatCardProps) {
  const valueColor = variant ? variantColorMap[variant] : "text-ink";

  return (
    <div
      className="bg-paper p-3 rounded-card text-center border border-card"
      data-testid="statcard"
    >
      <div
        className={`text-stat font-mono font-bold tabular-nums ${valueColor}`}
        data-testid="statcard-value"
      >
        {value}
      </div>
      <div
        className="text-[10px] text-ink-mute uppercase font-archivo font-extrabold tracking-[0.6px]"
        data-testid="statcard-label"
      >
        {label}
      </div>
    </div>
  );
}
