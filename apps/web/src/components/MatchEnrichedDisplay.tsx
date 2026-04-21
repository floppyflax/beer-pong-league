/**
 * MatchEnrichedDisplay - Photo thumbnail and cups badge for match history
 * Story 14-28: Display photo and cups in match history
 */

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

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

  const hasPhotoUrl = Boolean(photoUrl?.trim());
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
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {/* Task 1: Photo thumbnail - lazy loading, click to enlarge */}
      {hasPhotoUrl && (
        <>
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => {
              if (imageError) return;
              setImageError(false);
              setShowEnlarged(true);
            }}
            className="block rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Agrandir la photo"
            disabled={imageError}
          >
            {imageError ? (
              <div className="w-16 h-16 flex items-center justify-center bg-slate-700 text-slate-400 text-xs">
                Erreur
              </div>
            ) : (
              <img
                src={photoUrl!}
                alt="Photo de l'équipe gagnante"
                loading="lazy"
                className="w-16 h-16 object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </button>

          {/* Click to enlarge modal */}
          {showEnlarged && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Photo agrandie"
              onClick={closeModal}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
              <img
                src={photoUrl!}
                alt="Photo de l'équipe gagnante"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}

      {/* Task 2: Cups badge - "X cups remaining" */}
      {hasCups && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40">
          {formatCupsBadge(cupsRemaining)}
        </span>
      )}
    </div>
  );
}
