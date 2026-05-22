import { useState } from "react";
import { StatRevealCard } from "../components/StatRevealCard";
import { getStatAccent } from "../components/StatRevealCard";
import { useDuoRivalryStats } from "../hooks/useDuoRivalryStats";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène "Duos & Rivalités" : jusqu'à 3 cartes côte à côte (meilleur/pire binôme,
 * plus grande rivalité, bête noire / meilleur allié de joueurs **tirés au
 * hasard à chaque passage**). Le tirage est figé au mount → varie à chaque fois
 * que le diaporama repasse sur la scène.
 */
export function DuosRivalriesScene({ source }: Props) {
  const stats = useDuoRivalryStats(source);
  // Calcul figé au mount (la scène se démonte hors écran → nouveau tirage à
  // chaque passage).
  const [cards] = useState(() => stats.buildCards(3));

  if (cards.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center">
        <p className="font-archivo font-black uppercase tracking-tight text-3xl text-cool-gray text-center">
          Pas encore assez de matchs
        </p>
        <p className="font-mono text-xs uppercase tracking-[2px] text-cool-gray/70 mt-3">
          Les duos & rivalités émergent après quelques parties
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Duos & Rivalités
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
