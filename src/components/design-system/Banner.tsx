/**
 * Banner — Story 14-7
 *
 * Composant réutilisable pour les feedbacks (succès, erreur).
 * Design system: design-system-convergence.md section 4.6
 */

import { CheckCircle, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type BannerVariant = 'success' | 'error';
export type BannerPosition = 'top' | 'inline';

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
  { bgClass: string; Icon: typeof CheckCircle }
> = {
  success: { bgClass: 'bg-success', Icon: CheckCircle },
  error: { bgClass: 'bg-error', Icon: XCircle },
};

export function Banner({
  message,
  variant,
  position = 'inline',
  onDismiss,
}: BannerProps) {
  const { bgClass, Icon } = variantConfig[variant];

  return (
    <div
      data-testid="banner"
      role="alert"
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-card text-white',
        bgClass,
        position === 'top' && 'fixed top-0 left-0 right-0 z-50'
      )}
    >
      <Icon size={20} className="flex-shrink-0" aria-hidden />
      <span className="flex-1 text-body font-medium">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="p-1 rounded-button hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X size={18} aria-hidden />
        </button>
      )}
    </div>
  );
}
