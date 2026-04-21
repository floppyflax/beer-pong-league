/**
 * Banner — Story 14-7
 *
 * Composant réutilisable pour les feedbacks (succès, erreur).
 * Design system: design-system-convergence.md section 4.6
 */

import { CheckCircle, XCircle, X } from "lucide-react";
import { clsx } from "clsx";

export type BannerVariant = "success" | "error";
export type BannerPosition = "top" | "inline";

export interface BannerProps {
  /** Message affiché dans la bannière */
  message: string;
  /** Variante sémantique : succès (vert) ou erreur (rouge) */
  variant: BannerVariant;
  /** Position : top (fixe en haut) ou inline (dans le flux) */
  position?: BannerPosition;
  /** Callback optionnel pour fermer la bannière (affiche un bouton X) */
  onDismiss?: () => void;
}

const variantConfig: Record<
  BannerVariant,
  { bgClass: string; textClass: string; Icon: typeof CheckCircle }
> = {
  success: {
    bgClass: "bg-lime",
    textClass: "text-cream",
    Icon: CheckCircle,
  },
  error: {
    bgClass: "bg-ruby",
    textClass: "text-ink",
    Icon: XCircle,
  },
};

export function Banner({
  message,
  variant,
  position = "inline",
  onDismiss,
}: BannerProps) {
  const { bgClass, textClass, Icon } = variantConfig[variant];

  return (
    <div
      data-testid="banner"
      role="alert"
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-md font-archivo uppercase tracking-tight",
        bgClass,
        textClass,
        position === "top" &&
          "fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)]",
      )}
    >
      <Icon size={20} className="flex-shrink-0" aria-hidden />
      <span className="flex-1 text-body font-bold">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="p-1 rounded-sm hover:bg-black/10 transition-colors flex-shrink-0"
        >
          <X size={18} aria-hidden />
        </button>
      )}
    </div>
  );
}
