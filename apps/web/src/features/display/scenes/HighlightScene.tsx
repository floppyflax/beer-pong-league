import { useEffect, useState } from "react";
import { HighlightCard } from "../components/HighlightCard";
import { useDisplayHighlights } from "../hooks/useDisplayHighlights";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  /** Vitesse de rotation entre highlights internes, en ms. Défaut 4s. */
  rotateMs?: number;
}

/**
 * Scène "moment marquant" : cycle entre les highlights disponibles.
 * Si aucun highlight, fallback "Pas encore de moment marquant".
 */
export function HighlightScene({ source, rotateMs = 4000 }: Props) {
  const highlights = useDisplayHighlights(source);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (highlights.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % highlights.length);
    }, rotateMs);
    return () => clearInterval(interval);
  }, [highlights.length, rotateMs]);

  // Reset à 0 si la liste change
  useEffect(() => {
    setIndex(0);
  }, [highlights.length]);

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center">
        <p className="font-archivo font-black uppercase tracking-tight text-3xl text-cool-gray text-center">
          Pas encore de moment marquant
        </p>
        <p className="font-mono text-xs uppercase tracking-[2px] text-cool-gray/70 mt-3">
          Joue quelques matchs pour faire émerger les highlights
        </p>
      </div>
    );
  }

  const current = highlights[index];

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0 flex items-center justify-between">
        <span>Moment marquant</span>
        <span className="font-mono text-xs uppercase tracking-[2px] text-cool-gray font-bold">
          {index + 1} / {highlights.length}
        </span>
      </h2>

      <div className="flex-1 min-h-0">
        <HighlightCard highlight={current} />
      </div>
    </div>
  );
}
