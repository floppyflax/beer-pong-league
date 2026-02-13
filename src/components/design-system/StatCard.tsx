/**
 * StatCard — Story 14-2
 *
 * Composant réutilisable pour afficher des résumés chiffrés (Joueurs, Matchs, ELO, etc.).
 * Design system: design-system-convergence.md section 4.1
 */

import type { ReactNode } from 'react';

export type StatCardVariant = 'primary' | 'success' | 'accent';

const variantColorMap: Record<StatCardVariant, string> = {
  primary: 'text-info', // bleu
  success: 'text-success', // vert
  accent: 'text-primary', // ambre/jaune
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
  const valueColor = variant ? variantColorMap[variant] : 'text-text-primary';

  return (
    <div
      className="bg-slate-800 p-3 rounded-xl text-center"
      data-testid="statcard"
    >
      <div
        className={`text-2xl font-bold ${valueColor}`}
        data-testid="statcard-value"
      >
        {value}
      </div>
      <div
        className="text-[10px] text-slate-400 uppercase font-bold"
        data-testid="statcard-label"
      >
        {label}
      </div>
    </div>
  );
}
