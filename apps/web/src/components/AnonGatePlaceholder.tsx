/**
 * AnonGatePlaceholder — bloc "Crée un compte" affiché quand un anonymous user
 * tente d'accéder à une zone réservée aux comptes (Stats, Home enrichie,
 * profil détaillé, listes publiques, premium).
 *
 * Layout : icône + titre court + sous-titre explicatif + bouton "Créer un
 * compte" qui ouvre l'AuthModal.
 */

import { useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { AuthModal } from "./AuthModal";
import { PButton } from "./ponglo/PButton";

interface AnonGatePlaceholderProps {
  /** Court titre affiché en gras (ex: "Stats verrouillées"). */
  title: string;
  /** Phrase d'explication sous le titre. */
  description: string;
  /** Optionnel — texte du CTA (défaut "Créer un compte"). */
  ctaLabel?: string;
  /** Quand true, prend tout l'écran (h-screen). Sinon en bloc card. */
  fullScreen?: boolean;
}

export const AnonGatePlaceholder = ({
  title,
  description,
  ctaLabel = "Créer un compte",
  fullScreen = false,
}: AnonGatePlaceholderProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const wrapperClass = fullScreen
    ? "min-h-screen bg-navy flex items-center justify-center px-6"
    : "bg-navy-soft border border-card rounded-card p-6 md:p-8";

  return (
    <>
      <div className={wrapperClass}>
        <div className="max-w-sm mx-auto text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-electric-blue/15 flex items-center justify-center">
            <Lock size={24} className="text-electric-blue" />
          </div>
          <h2 className="font-archivo font-extrabold uppercase text-white text-lg tracking-tight">
            {title}
          </h2>
          <p className="text-cool-gray text-sm leading-relaxed">{description}</p>
          <PButton
            variant="primary"
            size="lg"
            full
            onClick={() => {
              // Persist where we are so the OTP magic-link round-trip (often a
              // new tab → no sessionStorage) brings the user back here.
              localStorage.setItem(
                "authReturnTo",
                window.location.pathname + window.location.search,
              );
              setShowAuthModal(true);
            }}
          >
            <UserPlus size={16} className="mr-2" />
            {ctaLabel}
          </PButton>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
};
