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
  active: 'bg-signal-red/20 text-signal-red',
  finished: 'bg-lime/20 text-lime',
  cancelled: 'bg-cool-gray/20 text-cool-gray',
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
      className="bg-navy-soft rounded-card p-4 border border-card"
      data-testid="infocard"
    >
      <div className="flex items-center gap-4 text-sm">
        <h2 className="text-white font-archivo font-extrabold uppercase tracking-tight text-base">
          {title}
        </h2>
        <span
          className={`text-[10px] uppercase font-archivo font-extrabold tracking-[0.6px] px-2 py-0.5 rounded-sm ${badgeClasses}`}
        >
          {statusBadge}
        </span>
      </div>

      {children ? (
        children
      ) : infos.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 text-xs text-cool-gray mt-2">
          {infos.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-1">
                <Icon size={14} className="text-cool-gray shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
