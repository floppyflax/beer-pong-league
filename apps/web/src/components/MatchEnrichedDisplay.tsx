/**
 * MatchEnrichedDisplay - Photo Finish thumbnail + cups badge for match history.
 *
 * Depuis la feature Photo Finish (PR #31), `photo_url` stocke un **collage
 * 9:16** (gagnant + perdant) plutôt qu'une simple photo solo. La thumbnail
 * adopte donc un ratio portrait + un label « Photo finish » pour identifier
 * clairement le contenu, et le lightbox utilise `object-contain` pour
 * respecter le ratio Story Instagram.
 */

import { useState, useRef, useEffect } from "react";
import { X, Camera } from "lucide-react";

interface MatchEnrichedDisplayProps {
  photoUrl?: string | null;
  cupsRemaining?: number | null;
}

function formatCupsBadge(count: number): string {
  return count === 1 ? "1 gobelet restant" : `${count} gobelets restants`;
}

export function MatchEnrichedDisplay({
  photoUrl,
  cupsRemaining,
}: MatchEnrichedDisplayProps) {
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [imageError, setImageError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const hasPhotoUrl = Boolean(photoUrl?.trim()) && !imageError;
  const hasCups =
    cupsRemaining != null && cupsRemaining >= 1 && cupsRemaining <= 10;

  const closeModal = () => {
    setShowEnlarged(false);
    triggerButtonRef.current?.focus();
  };

  // Escape key, scroll lock, focus management
  useEffect(() => {
    if (!showEnlarged) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showEnlarged]);

  if (!hasPhotoUrl && !hasCups) return null;

  return (
    <div className="flex items-stretch gap-3 mt-3">
      {hasPhotoUrl && (
        <>
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setShowEnlarged(true)}
            className="group relative shrink-0 rounded-lg overflow-hidden border-2 border-lime/60 hover:border-lime shadow-[0_0_18px_rgba(183,255,59,0.25)] hover:shadow-[0_0_24px_rgba(183,255,59,0.45)] transition-all focus:outline-none focus:ring-2 focus:ring-lime"
            aria-label="Voir la photo finish"
          >
            <img
              src={photoUrl!}
              alt="Collage Photo Finish"
              loading="lazy"
              className="w-[60px] h-[107px] object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/90 to-transparent text-[9px] font-archivo font-extrabold uppercase tracking-widest text-lime text-center py-1">
              Photo
            </span>
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-lime">
              <Camera size={11} />
              Photo finish
            </span>
            <button
              type="button"
              onClick={() => setShowEnlarged(true)}
              className="text-xs text-cool-gray hover:text-white text-left underline-offset-2 hover:underline transition-colors"
            >
              Voir le collage
            </button>
            {hasCups && (
              <span className="mt-1 inline-flex items-center self-start px-2 py-0.5 rounded text-[10px] font-medium bg-ping-yellow/20 text-ping-yellow border border-ping-yellow/40">
                {formatCupsBadge(cupsRemaining)}
              </span>
            )}
          </div>
        </>
      )}

      {!hasPhotoUrl && hasCups && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ping-yellow/20 text-ping-yellow border border-ping-yellow/40">
          {formatCupsBadge(cupsRemaining)}
        </span>
      )}

      {hasPhotoUrl && showEnlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo finish agrandie"
          onClick={closeModal}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
            className="absolute top-4 right-4 p-2 rounded-lg bg-navy-soft hover:bg-navy text-white z-10"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
          <img
            src={photoUrl!}
            alt="Collage Photo Finish agrandi"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
