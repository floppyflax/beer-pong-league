/**
 * InfoCard — Story 14-5
 *
 * Composant réutilisable pour les bandeaux de contexte (dashboard tournoi/league).
 * Design system: design-system-convergence.md section 4.4
 *
 * Usage: En-tête de dashboard avec statut, code, format, date.
 * Flexible: props structurées (title, statusBadge, infos) ou children.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type InfoCardStatusVariant = 'active' | 'finished' | 'cancelled';

export interface InfoCardInfoItem {
  icon: LucideIcon;
  text: string;
}

export interface InfoCardProps {
  /** Titre principal (ex: nom du tournoi/league) */
  title: string;
  /** Texte du badge de statut (ex: En cours, Terminé, Annulé) */
  statusBadge: string;
  /** Variante sémantique pour le style du badge */
  statusVariant?: InfoCardStatusVariant;
  /** Ligne d'infos avec icônes (calendrier, users, format) */
  infos?: InfoCardInfoItem[];
  /** Contenu personnalisé (alternative aux infos structurées) */
  children?: ReactNode;
}

const statusVariantClasses: Record<InfoCardStatusVariant, string> = {
  active: 'bg-amber-500/20 text-amber-500',
  finished: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-red-500/20 text-red-500',
};

export function InfoCard({
  title,
  statusBadge,
  statusVariant = 'active',
  infos = [],
  children,
}: InfoCardProps) {
  const badgeClasses = statusVariantClasses[statusVariant];

  return (
    <div
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
      data-testid="infocard"
    >
      <div className="flex items-center gap-4 text-sm">
        <h2 className="text-white font-bold text-base">{title}</h2>
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeClasses}`}
        >
          {statusBadge}
        </span>
      </div>

      {children ? (
        children
      ) : infos.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
          {infos.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-1">
                <Icon size={14} className="text-slate-500 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
