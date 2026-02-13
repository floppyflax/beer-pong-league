/**
 * MatchEnrichedDisplay - Photo thumbnail and cups badge for match history
 * Story 14-28: Display photo and cups in match history
 */

import { useState } from "react";
import { X } from "lucide-react";

interface MatchEnrichedDisplayProps {
  photoUrl?: string | null;
  cupsRemaining?: number | null;
}

export function MatchEnrichedDisplay({
  photoUrl,
  cupsRemaining,
}: MatchEnrichedDisplayProps) {
  const [showEnlarged, setShowEnlarged] = useState(false);

  const hasPhoto = Boolean(photoUrl?.trim());
  const hasCups =
    cupsRemaining != null && cupsRemaining >= 1 && cupsRemaining <= 10;

  if (!hasPhoto && !hasCups) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {/* Task 1: Photo thumbnail - lazy loading, click to enlarge */}
      {hasPhoto && (
        <>
          <button
            type="button"
            onClick={() => setShowEnlarged(true)}
            className="block rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Agrandir la photo"
          >
            <img
              src={photoUrl!}
              alt="Photo de l'équipe gagnante"
              loading="lazy"
              className="w-16 h-16 object-cover"
            />
          </button>

          {/* Click to enlarge modal */}
          {showEnlarged && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Photo agrandie"
            >
              <button
                type="button"
                onClick={() => setShowEnlarged(false)}
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
          {cupsRemaining} gobelet{cupsRemaining > 1 ? "s" : ""} restant
          {cupsRemaining > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
