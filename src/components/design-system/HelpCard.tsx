import { useId, type ReactNode } from "react";
import { HelpCircle, CheckCircle } from "lucide-react";

export interface HelpCardStep {
  number: number;
  text: string;
}

export interface HelpCardProps {
  /** Titre du bloc d'aide (ex: "Comment ça marche ?") */
  title: string;
  /** Étapes numérotées */
  steps?: HelpCardStep[];
  /** Message de succès final optionnel (ex: "C'est parti pour la compétition !") */
  successMessage?: string;
  /** Contenu personnalisé (alternative aux steps) */
  children?: ReactNode;
}

/**
 * HelpCard — Variante aide/tuto du design system
 *
 * Carte dédiée aux blocs d'aide et tutoriels.
 * Style: fond bleu clair accentué, bordure bleue, icône point d'interrogation.
 * Identifiable visuellement comme section d'aide.
 */
export function HelpCard({
  title,
  steps = [],
  successMessage,
  children,
}: HelpCardProps) {
  const titleId = useId();
  return (
    <div
      role="region"
      aria-labelledby={titleId}
      className="bg-blue-500/20 rounded-xl p-4 md:p-6 border-2 border-blue-400/50"
      data-testid="helpcard"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
          <HelpCircle size={22} className="text-blue-300" aria-hidden />
        </div>
        <h4 id={titleId} className="text-base font-bold text-blue-200 pt-1.5">
          {title}
        </h4>
      </div>

      {children ? (
        children
      ) : (
        <ul className="text-sm text-slate-200 space-y-3">
          {steps.map((step, index) => (
            <li key={`${step.number}-${index}`} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center text-xs font-bold text-white">
                {step.number}
              </span>
              <span className="pt-0.5">{step.text}</span>
            </li>
          ))}
          {successMessage && (
            <li className="flex items-start gap-3 pt-1">
              <CheckCircle
                size={20}
                className="shrink-0 text-green-400 mt-0.5"
                aria-hidden
              />
              <span className="text-green-300 font-medium pt-0.5">
                {successMessage}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
