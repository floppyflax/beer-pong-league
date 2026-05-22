import { HighlightCard, getHighlightAccent } from "../components/HighlightCard";
import { useDisplayHighlights } from "../hooks/useDisplayHighlights";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène "moments marquants" : affiche jusqu'à 3 highlights **côte à côte** en
 * colonnes. Si < 3 dispo, affiche ceux qu'on a. Fallback si 0.
 */
export function HighlightScene({ source }: Props) {
  const highlights = useDisplayHighlights(source).slice(0, 3);

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Moments marquants
      </h2>

      <div
        className={`flex-1 min-h-0 grid gap-3 md:gap-4 ${
          highlights.length === 1
            ? "grid-cols-1"
            : highlights.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        }`}
      >
        {highlights.map((h) => (
          <div
            key={h.type}
            className={`bg-navy-soft border-[1.5px] rounded-card min-h-0 overflow-hidden ${getHighlightAccent(h.type).border}`}
          >
            <HighlightCard highlight={h} variant="column" />
          </div>
        ))}
      </div>
    </div>
  );
}
