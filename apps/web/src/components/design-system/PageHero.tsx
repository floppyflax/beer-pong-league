/**
 * PageHero — Everything ELO display headline
 *
 * Bloc titre éditorial en haut de page, inspiré de la page Rejoindre :
 * - Eyebrow (petit label archivo extrabold uppercase 17px, aligné sur l'étiquette
 *   "REJOINDRE" de `Join.tsx`). Identifie le contexte de la page.
 * - Titre display `font-archivo font-black`, 34px mobile / 44px desktop
 *   avec `line-height: 0.95` et `letter-spacing: -1.2px`.
 * - Sous-titre optionnel (mini tagline) en dessous du titre.
 * - Bouton retour optionnel (pill 36×36, `border-card`). Par défaut absent —
 *   les pages principales (Mes événements, Stats globales, Profil, détails
 *   ligue/événement) n'ont pas de back button.
 *
 * Remplace `ContextualHeader` sur les pages qui veulent un titre éditorial
 * plutôt qu'une barre sticky.
 */

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeroProps {
  /** Petit label archivo extrabold uppercase 17px (ex: "Mes événements", "Profil"). */
  eyebrow?: string;
  /** Titre display — peut contenir `<br />` pour forcer la coupe. */
  title: ReactNode;
  /** Sous-titre (mini tagline) optionnel en dessous du titre. */
  subtitle?: ReactNode;
  /** Bouton retour (affiché à gauche de l'eyebrow). */
  onBack?: () => void;
  /** Classe additionnelle sur le wrapper. */
  className?: string;
}

export const PageHero = ({
  eyebrow,
  title,
  subtitle,
  onBack,
  className = "",
}: PageHeroProps) => {
  return (
    <div className={`pt-2 pb-4 ${className}`}>
      {(onBack || eyebrow) && (
        <div className="flex items-center gap-2.5 mb-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="w-9 h-9 rounded-full border-[1.5px] border-card flex items-center justify-center text-white hover:bg-navy-soft transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {eyebrow && (
            <div className="font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px] text-white">
              {eyebrow}
            </div>
          )}
        </div>
      )}

      <h1
        className="font-archivo font-black uppercase text-white text-[34px] sm:text-[44px]"
        style={{
          lineHeight: 0.95,
          letterSpacing: "-1.2px",
          textWrap: "balance",
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="text-cool-gray text-base mt-3 max-w-[520px]">
          {subtitle}
        </p>
      )}
    </div>
  );
};
