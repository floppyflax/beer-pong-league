/**
 * ClaimGuestBanner — bannière inline "Un de ces joueurs c'est toi ?"
 *
 * Affichée en haut d'un dashboard event/league quand l'utilisateur authentifié
 * y arrive et qu'il existe des "ghost" players non claimés. Click → ouvre
 * `ClaimGuestSheet` (sheet géré par le parent).
 *
 * Si la liste est vide, le composant ne rend rien (no-op).
 *
 * Le composant est purement visuel + déclenche `onOpen`. La fetch des guests
 * et l'appel RPC vivent dans le parent (`useUnclaimedGuests` +
 * `IdentityMergeService.claimAnonymousPlayer`).
 */

import { Sparkles, ChevronRight } from "lucide-react";

export interface ClaimGuestBannerProps {
  /** Nombre de ghosts non claimés. 0 → composant ne rend rien. */
  count: number;
  /** Click sur la bannière. */
  onOpen: () => void;
  /** Optionnel : pseudo unique à mettre en avant si count===1. */
  singlePseudo?: string;
}

export function ClaimGuestBanner({
  count,
  onOpen,
  singlePseudo,
}: ClaimGuestBannerProps) {
  if (count <= 0) return null;

  const label =
    count === 1 && singlePseudo
      ? `« ${singlePseudo} » c'est toi ?`
      : `Un de ces ${count} joueurs c'est toi ?`;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="claim-guest-banner"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-card border border-card bg-gradient-to-r from-electric-blue/15 to-ping-yellow/10 hover:from-electric-blue/25 hover:to-ping-yellow/20 transition text-left"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-electric-blue/30 flex items-center justify-center">
        <Sparkles size={16} className="text-electric-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-archivo font-extrabold uppercase text-white text-[13px] tracking-[-0.2px] truncate">
          {label}
        </div>
        <div className="text-cool-gray text-[11px] truncate">
          Récupère ton historique de matchs et ton ELO.
        </div>
      </div>
      <ChevronRight size={18} className="text-cool-gray flex-shrink-0" />
    </button>
  );
}
