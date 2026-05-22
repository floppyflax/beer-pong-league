/**
 * ClaimGuestSheet — bottom sheet "Êtes-vous une de ces personnes ?"
 *
 * Liste les "ghost" players non claimés du contexte (event ou ligue) et permet
 * à un utilisateur authentifié de réclamer la ligne qui le concerne.
 *
 * UX :
 *  - Un bouton "C'est moi" par pseudo. Le bouton actif passe en loading le
 *    temps de l'appel RPC.
 *  - Footer "Aucun de ces joueurs n'est moi" → onDismiss (l'utilisateur ne
 *    sera plus sollicité dans cette session pour ce contexte).
 *
 * Le composant est *contrôlé* (open / onClose) — il n'embarque pas la logique
 * RPC, seulement le `onClaim(playerId)` callback. Le parent gère l'appel à
 * `IdentityMergeService.claimAnonymousPlayer` et le toast.
 */

import { X, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { UnclaimedGuest } from "../../hooks/useUnclaimedGuests";

export interface ClaimGuestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Liste des ghosts non claimés (vient de `useUnclaimedGuests`). */
  guests: UnclaimedGuest[];
  /** Réclame un joueur. Doit résoudre la promesse pour fermer le loading. */
  onClaim: (playerId: string) => Promise<void>;
  /** Callback "aucun de ces joueurs n'est moi". Ferme + persistance côté parent. */
  onDismissAll?: () => void;
  /** Titre custom (par défaut "Êtes-vous une de ces personnes ?"). */
  title?: string;
}

export function ClaimGuestSheet({
  isOpen,
  onClose,
  guests,
  onClaim,
  onDismissAll,
  title = "Êtes-vous une de ces personnes ?",
}: ClaimGuestSheetProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingId) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, pendingId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !pendingId) onClose();
  };

  const handleClaim = async (playerId: string) => {
    if (pendingId) return;
    setPendingId(playerId);
    try {
      await onClaim(playerId);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-guest-sheet-title"
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
            id="claim-guest-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[15px] tracking-[-0.3px] text-center px-8"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={!!pendingId}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — list of guests */}
        <div className="px-5 pb-5 overflow-y-auto">
          <p className="text-cool-gray text-[13px] mb-3 text-center">
            Un admin t'a peut-être déjà ajouté en tant que joueur. Réclame ton
            historique d'un clic.
          </p>

          {guests.length === 0 ? (
            <div className="text-center py-6 text-cool-gray text-[13px]">
              Aucun joueur à réclamer ici.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {guests.map((g) => {
                const isPending = pendingId === g.playerId;
                const isDisabled = !!pendingId && !isPending;
                return (
                  <li key={g.playerId}>
                    <div className="flex items-center gap-3 bg-navy/60 rounded-xl px-4 py-3 border border-card">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-archivo font-bold text-[15px] truncate">
                          {g.pseudo}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClaim(g.playerId)}
                        disabled={isDisabled || isPending}
                        className="h-9 px-3 rounded-full bg-electric-blue text-navy font-archivo font-extrabold uppercase text-[11px] tracking-[1px] flex items-center gap-1.5 hover:brightness-110 transition disabled:opacity-50"
                      >
                        {isPending ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>…</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>C'est moi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer — dismiss all. Prominent: this is the "I'm new here" exit, the
            most common path for a first-time joiner, so it gets a full-size
            filled button rather than a thin outline. */}
        {onDismissAll && guests.length > 0 && (
          <div className="px-5 pb-6 pt-1">
            <button
              type="button"
              onClick={onDismissAll}
              disabled={!!pendingId}
              className="w-full h-14 rounded-full bg-white/10 border-2 border-white/25 text-white font-archivo font-extrabold uppercase text-[14px] tracking-[1px] hover:bg-white/15 active:scale-[0.99] transition disabled:opacity-40"
            >
              Je ne suis pas dans la liste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
