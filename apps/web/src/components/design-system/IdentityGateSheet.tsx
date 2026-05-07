/**
 * IdentityGateSheet — pre-flow on join (event or league).
 *
 * Shown the first time a user lands on `/event/:id/join` or
 * `/league/:id/join` so they explicitly choose how they want to participate.
 * Three actions are surfaced (one is hidden when the user has no existing
 * identity to continue with):
 *
 *   1. **Continuer en tant que {pseudo}** — a one-tap path when the device
 *      already has an authenticated user OR an anonymous localUser. We default
 *      to this so returning visitors don't have to re-pick.
 *   2. **Me connecter par email** — opens the OTP magic-link `AuthModal` so the
 *      user can either link to an existing account or create one. There's no
 *      sign-in/sign-up split because OTP doesn't distinguish them.
 *   3. **Jouer sans compte** — anonymous path. The parent page is responsible
 *      for triggering `CreateIdentityModal` if no `localUser` exists yet (via
 *      `useRequireIdentity`).
 *
 * The sheet is *purely presentational* — it emits intent via `onChoose` and
 * lets the parent wire the modals. This keeps the component dumb and easy to
 * preview in DesignSystemShowcase.
 *
 * Layout mirrors `ClaimGuestSheet` (mobile bottom-sheet, desktop centered)
 * for visual coherence across the join flow.
 */

import { Mail, UserCheck, Ghost, X } from "lucide-react";
import { useEffect } from "react";

export type IdentityGateChoice = "continue" | "auth" | "anonymous";

export interface IdentityGateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback when the user picks a path. */
  onChoose: (choice: IdentityGateChoice) => void;
  /**
   * Pseudo of the existing identity (auth display name or anon localUser
   * pseudo). When provided, the "Continuer en tant que" CTA is rendered.
   * When undefined, only the auth + anonymous paths are shown.
   */
  currentPseudo?: string | null;
  /** Title override (default tailored to the event/league context). */
  title?: string;
  /** Subtitle override. */
  subtitle?: string;
  /** When true, the sheet cannot be dismissed (forces a choice). */
  required?: boolean;
}

interface ActionRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant: "primary" | "secondary";
}

function ActionRow({
  icon,
  title,
  description,
  onClick,
  variant,
}: ActionRowProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition border",
        isPrimary
          ? "bg-electric-blue/10 border-electric-blue/40 hover:bg-electric-blue/15"
          : "bg-navy/60 border-card hover:bg-navy/80",
      ].join(" ")}
    >
      <div
        className={[
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isPrimary ? "bg-electric-blue text-navy" : "bg-white/5 text-cool-gray",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-archivo font-extrabold uppercase text-white text-[13px] tracking-tight truncate">
          {title}
        </div>
        <div className="text-[12px] text-cool-gray truncate">{description}</div>
      </div>
    </button>
  );
}

export function IdentityGateSheet({
  isOpen,
  onClose,
  onChoose,
  currentPseudo,
  title = "Comment veux-tu participer ?",
  subtitle = "Choisis comment t'identifier pour rejoindre.",
  required = false,
}: IdentityGateSheetProps) {
  // Escape to close (unless required)
  useEffect(() => {
    if (!isOpen || required) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, required]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !required) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-gate-sheet-title"
    >
      <div
        className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[66dvh] md:max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id="identity-gate-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[15px] tracking-[-0.3px] text-center px-8"
          >
            {title}
          </h2>
          {!required && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 pb-5 overflow-y-auto">
          <p className="text-cool-gray text-[13px] mb-4 text-center">
            {subtitle}
          </p>

          <div className="flex flex-col gap-2">
            {currentPseudo && (
              <ActionRow
                variant="primary"
                icon={<UserCheck size={18} />}
                title={`Continuer en tant que ${currentPseudo}`}
                description="Reprends ton identité actuelle"
                onClick={() => onChoose("continue")}
              />
            )}

            <ActionRow
              variant={currentPseudo ? "secondary" : "primary"}
              icon={<Mail size={18} />}
              title="Me connecter par email"
              description="On t'envoie un lien magique"
              onClick={() => onChoose("auth")}
            />

            <ActionRow
              variant="secondary"
              icon={<Ghost size={18} />}
              title="Jouer sans compte"
              description="Choisis juste un pseudo"
              onClick={() => onChoose("anonymous")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
