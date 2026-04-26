/**
 * StickyCTA — Everything ELO, conteneur sticky bottom pour CTA principal
 *
 * Pattern unifié pour les pages avec un CTA plein-largeur collé en bas d'écran
 * (CreateEvent, CreateLeague, Join, etc.).
 *
 * Comportement :
 * - `position: fixed` en bas de viewport (flush), avec safe-area mobile (iOS)
 * - Fond gradient `from-navy` → transparent pour fondu visuel
 * - Centré dans un max-width `720px` (cohérent avec les formulaires DS)
 * - Aucun divider (pas de `border-top`) — le fondu suffit
 *
 * Modes de padding bas :
 * - `default` (par défaut) : `pb-6` + safe-area iOS (sous-pages sans tab bar)
 * - `bottomNav` : `pb-bottom-nav` (5rem) pour libérer le BottomTabMenu
 *   (uniquement sur routes core : `/`, `/competitions`, `/leaderboard`, etc.)
 *
 * Convention parent : la page doit ajouter `pb-[160px]` (ou plus) au wrapper
 * scrollable pour que le contenu ne soit pas caché derrière la zone sticky.
 *
 * @example
 * <StickyCTA>
 *   <PButton type="submit" form="my-form" full>
 *     Créer l'événement
 *   </PButton>
 * </StickyCTA>
 */

import type { ReactNode } from "react";

export interface StickyCTAProps {
  /** Le ou les CTA à rendre. Généralement un `<PButton full />`. */
  children: ReactNode;
  /**
   * Mode padding bas :
   * - `default` : `pb-6` + safe-area iOS — pages sans BottomTabMenu (Create*, Join).
   * - `bottomNav` : `pb-bottom-nav` — pages avec BottomTabMenu (core routes).
   * @default "default"
   */
  bottomSpacing?: "default" | "bottomNav";
  /** Classe additionnelle sur le wrapper fixed. */
  className?: string;
  /** Classe additionnelle sur le container interne max-width. */
  innerClassName?: string;
}

export const StickyCTA = ({
  children,
  bottomSpacing = "default",
  className = "",
  innerClassName = "",
}: StickyCTAProps) => {
  const paddingClass =
    bottomSpacing === "bottomNav"
      ? "pb-bottom-nav lg:pb-bottom-nav-lg"
      : // pb-6 + safe-area iOS (notch/home indicator)
        "pb-[max(1.5rem,env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 px-6 pt-4 ${paddingClass} bg-gradient-to-t from-navy via-navy/95 to-transparent z-20 pointer-events-none ${className}`}
    >
      <div className={`max-w-[720px] mx-auto pointer-events-auto ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
