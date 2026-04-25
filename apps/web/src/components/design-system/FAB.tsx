/**
 * FAB (Floating Action Button) — Story 14-6
 *
 * Bouton d'action principale flottant. Utilisé pour Créer tournoi, Nouveau match, etc.
 * Design system: design-system-convergence.md sections 2.2, 4.5
 *
 * @example
 * // Créer tournoi / Créer league
 * <FAB icon={Plus} onClick={handleCreate} ariaLabel="Créer un événement" />
 *
 * @example
 * // Nouveau match (icône identitaire BeerPongMatchIcon — dashboards tournoi/league)
 * import { BeerPongMatchIcon } from '@/components/icons/BeerPongMatchIcon';
 * <FAB icon={BeerPongMatchIcon} onClick={handleNewMatch} ariaLabel="Nouveau match" />
 *
 * BeerPongMatchIcon s'affiche en blanc (24px) sur le gradient. Pour Créer tournoi/league,
 * utiliser Plus ou Trophy/Medal de lucide-react.
 */

import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export type FABVariant = 'primary' | 'secondary';

export interface FABProps {
  /** Icône à afficher (Lucide ou BeerPongMatchIcon) */
  icon: LucideIcon | ComponentType<{ size?: number; className?: string }>;
  /** Callback au clic */
  onClick: () => void;
  /** Label d'accessibilité (obligatoire) */
  ariaLabel: string;
  /** Variante visuelle : primary (gradient), secondary (muted) */
  variant?: FABVariant;
  /** Mode inline pour showcase (position relative au lieu de fixed) */
  inline?: boolean;
}

export function FAB({
  icon: Icon,
  onClick,
  ariaLabel,
  variant = 'primary',
  inline = false,
}: FABProps) {
  const isPrimary = variant === 'primary';
  const positionClasses = inline
    ? 'relative bottom-0 right-0 m-2'
    : 'fixed bottom-20 right-4';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        ${positionClasses}
        w-14 h-14 md:w-16 md:h-16
        flex items-center justify-center
        rounded-full
        transition-[transform,box-shadow,filter] duration-100
        hover:brightness-110 active:translate-y-[2px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        ${isPrimary
          ? 'bg-lime text-navy border-[1.5px] border-[#8BCC1F] shadow-fab'
          : 'bg-navy-soft text-white border-[1.5px] border-card'}
      `}
      data-testid="fab"
    >
      <span data-testid="fab-icon">
        <Icon size={24} className={isPrimary ? 'text-navy' : 'text-white'} />
      </span>
    </button>
  );
}
