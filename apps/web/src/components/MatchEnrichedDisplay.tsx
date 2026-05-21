/**
 * MatchEnrichedDisplay — petite icône Photo Finish + badge gobelets restants
 * pour les cards de matchs.
 *
 * Conçu pour rester discret : pas de thumbnail visible. Si `photoUrl` est
 * présent, on rend une icône `Camera` lime cliquable ; le lightbox plein
 * écran s'ouvre au clic (et reste responsive au ratio 9:16 du collage via
 * `object-contain`).
 *
 * Historique
 * - Story 14-28 : thumbnail carrée 64×64 + cups badge.
 * - PR #31 (Photo Finish) : thumbnail portrait 60×107 + label.
 * - PR #31 follow-up : retour à une simple icône cliquable (la photo
 *   prend trop de place dans une liste dense).
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
    <>
      <div className="flex items-center gap-2">
        {hasPhotoUrl && (
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setShowEnlarged(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-lime/50 bg-lime/10 text-lime hover:bg-lime/20 transition-colors focus:outline-none focus:ring-2 focus:ring-lime"
            aria-label="Voir la photo finish"
            title="Voir la photo finish"
          >
            <Camera size={12} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
              Photo
            </span>
          </button>
        )}
        {hasCups && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-ping-yellow/20 text-ping-yellow border border-ping-yellow/40">
            {formatCupsBadge(cupsRemaining)}
          </span>
        )}
        {/* Hidden img tag to detect broken photo_url early without showing the
            thumbnail; gracefully hides the photo button if the file is gone. */}
        {photoUrl && !imageError && (
          <img
            src={photoUrl}
            alt=""
            aria-hidden
            loading="lazy"
            className="hidden"
            onError={() => setImageError(true)}
          />
        )}
      </div>

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
    </>
  );
}
