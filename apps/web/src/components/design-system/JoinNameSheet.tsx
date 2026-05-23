/**
 * JoinNameSheet — last step of the join flow: pick the display name.
 *
 * Two modes (the name is always asked LAST, after the participants modal):
 *   - **confirm** — the user just claimed an existing participant. The input is
 *     prefilled with that participant's pseudo: keep it as-is or edit it.
 *   - **create** — the user is not in the list. They enter a fresh pseudo for
 *     the new player.
 *
 * Purely presentational: the parent wires `onSubmit(name)` (claim-rename or
 * new-player creation) and handles navigation.
 */

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export interface JoinNameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "confirm" | "create";
  /** Prefill — claimed participant pseudo (confirm) or suggested pseudo (create). */
  initialName?: string;
  /** Context display name (event/league) used in the copy. */
  contextName?: string;
  /** Submit the chosen name. Resolve to let the parent navigate; reject to stay. */
  onSubmit: (name: string) => Promise<void>;
}

export function JoinNameSheet({
  isOpen,
  onClose,
  mode,
  initialName = "",
  contextName,
  onSubmit,
}: JoinNameSheetProps) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  // Reset the field from the prefill each time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPending(false);
    }
  }, [isOpen, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose, pending]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 100;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setPending(false);
    }
  };

  const title = mode === "confirm" ? "Garde ou modifie ton nom" : "Choisis ton pseudo";
  const subtitle =
    mode === "confirm"
      ? "Tu reprends ce joueur. Garde son nom ou change-le."
      : contextName
        ? `Sous quel nom veux-tu jouer dans ${contextName} ?`
        : "Sous quel nom veux-tu jouer ?";
  const cta = mode === "confirm" ? "C'est parti" : "Rejoindre";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-name-sheet-title"
    >
      <div
        className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[66dvh] md:max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber (mobile) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id="join-name-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[15px] tracking-[-0.3px] text-center px-8"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 pt-1">
          <p className="text-cool-gray text-[13px] mb-3 text-center">{subtitle}</p>

          <label
            htmlFor="join-name-input"
            className="block text-xs font-mono font-bold uppercase tracking-widest text-cool-gray mb-2"
          >
            Nom du joueur
          </label>
          <input
            id="join-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton pseudo"
            className="w-full bg-navy border border-card rounded-input px-4 py-3 text-white placeholder-cool-gray/50 focus:outline-none focus:ring-2 focus:ring-lime/30 text-base"
            autoFocus
            minLength={1}
            maxLength={100}
            autoComplete="name"
            disabled={pending}
          />
          {name.length > 0 && (
            <p className="text-xs text-cool-gray mt-1 font-mono">
              {trimmed.length}/100
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || pending}
            className="mt-4 w-full h-14 rounded-full bg-lime text-navy font-archivo font-extrabold uppercase text-[14px] tracking-[1px] hover:bg-lime-deep transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span>{cta}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
