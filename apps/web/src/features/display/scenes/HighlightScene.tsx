import {
  StatRevealCard,
  getStatAccent,
  type StatAccentKey,
  type StatCardData,
} from "../components/StatRevealCard";
import {
  useDisplayHighlights,
  type Highlight,
  type HighlightType,
} from "../hooks/useDisplayHighlights";
import type { DisplaySource } from "../types";

const ACCENT_BY_TYPE: Record<HighlightType, StatAccentKey> = {
  "biggest-elo-gain": "elo-gain",
  "biggest-rank-climb": "rank-climb",
  "current-streak": "streak",
  upset: "upset",
};

function toCard(h: Highlight): StatCardData {
  return {
    key: h.type,
    accent: ACCENT_BY_TYPE[h.type],
    headline: h.headline,
    metric: h.metric,
    tagline: h.tagline,
    subjects: [h.subject],
  };
}

/**
 * Scène "moments marquants" (joueur) : jusqu'à 3 highlights côte à côte.
 * Fallback si 0.
 */
export function HighlightScene({ source }: Props) {
  const cards = useDisplayHighlights(source).slice(0, 3).map(toCard);

  if (cards.length === 0) {
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
          cards.length === 1
            ? "grid-cols-1"
            : cards.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        }`}
      >
        {cards.map((card) => (
          <div
            key={card.key}
            className={`bg-navy-soft border-[1.5px] rounded-card min-h-0 overflow-hidden ${getStatAccent(card.accent).border}`}
          >
            <StatRevealCard data={card} variant="column" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  source: DisplaySource;
}
