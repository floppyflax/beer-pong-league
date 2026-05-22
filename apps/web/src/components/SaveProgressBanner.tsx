/**
 * SaveProgressBanner — slim inline nudge for ANONYMOUS players.
 *
 * A guest identity lives only in localStorage; losing the cache loses access to
 * the claimed player. We don't recover anonymous identities by device
 * fingerprint (a shared party phone would collide), so the durable path is:
 * create an account, which transfers the guest's player to the account
 * (AuthCallback). This banner surfaces that at the right moment — right after
 * joining, on the event/league dashboard.
 *
 * Self-contained: owns its AuthModal + authReturnTo so a dashboard only renders
 * `<SaveProgressBanner />`. Renders nothing for authenticated users.
 */

import { useState } from "react";
import { Save, ChevronRight, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useIdentity } from "../hooks/useIdentity";
import { AuthModal } from "./AuthModal";

export function SaveProgressBanner() {
  // useAuth (not useAuthContext) so the banner is self-contained and doesn't
  // require an AuthProvider in the tree (it's dropped into dashboards as-is).
  const { isAuthenticated } = useAuth();
  const { localUser } = useIdentity();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only guests (anonymous, with a local identity) need this. Authenticated
  // users already persist across devices.
  if (isAuthenticated || !localUser || dismissed) return null;

  const handleOpen = () => {
    // Persist where we are so the OTP magic-link round-trip (often a new tab →
    // no sessionStorage) brings the user back here, account in hand.
    localStorage.setItem(
      "authReturnTo",
      window.location.pathname + window.location.search,
    );
    setShowAuthModal(true);
  };

  return (
    <>
      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-card border border-card bg-gradient-to-r from-lime/15 to-electric-blue/10">
        <button
          type="button"
          onClick={handleOpen}
          data-testid="save-progress-banner"
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-lime/25 flex items-center justify-center">
            <Save size={16} className="text-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-archivo font-extrabold uppercase text-white text-[13px] tracking-[-0.2px] truncate">
              Sauvegarde ta progression
            </div>
            <div className="text-cool-gray text-[11px] truncate">
              Crée un compte pour garder ton joueur même si tu changes
              d'appareil ou vides ton cache.
            </div>
          </div>
          <ChevronRight size={18} className="text-cool-gray flex-shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Masquer"
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
