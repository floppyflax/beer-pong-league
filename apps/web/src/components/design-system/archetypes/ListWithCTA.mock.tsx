/**
 * ListWithCTA archetype — represents pages like Events / Leagues / Competitions.
 *
 * Pattern: ContextualHeader + SearchBar + SegmentedTabs + vertical card list +
 * floating action button.
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { SearchBar } from "../SearchBar";
import { SegmentedTabs } from "../SegmentedTabs";
import { FAB } from "../FAB";

export function ListWithCTAMock() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-full bg-navy text-white px-4 pt-4 pb-20">
      <div className="mb-4">
        <h1 className="text-2xl font-archivo font-black uppercase tracking-tight">
          Mes événements
        </h1>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un événement..."
      />

      <div className="mt-4">
        <SegmentedTabs
          tabs={[
            { id: "all", label: "Tous" },
            { id: "active", label: "Actifs" },
            { id: "finished", label: "Terminés" },
          ]}
          activeId={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-4 space-y-3">
        {[
          { name: "Méchoui XIII", live: true, sub: "8 joueurs · 5 matchs · 2v2" },
          { name: "Tournoi Halloween", live: false, sub: "12 joueurs · 22 matchs · 2v2" },
          { name: "Beer Cup #04", live: false, sub: "6 joueurs · 9 matchs · 1v1" },
        ].map((card, i) => (
          <div
            key={i}
            className="w-full bg-navy-soft border-[1.5px] border-white rounded-lg p-4 shadow-[0_3px_0_#F4F2E8] flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${card.live ? "bg-lime" : "bg-cool-gray"}`}
                />
                <span
                  className={`font-mono text-[10px] tracking-[1.5px] uppercase font-bold ${card.live ? "text-lime" : "text-cool-gray"}`}
                >
                  {card.live ? "En ce moment" : "Terminé"}
                </span>
              </div>
              <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] text-white truncate">
                {card.name}
              </div>
              <div className="text-[13px] text-cool-gray mt-0.5">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <FAB icon={Plus} ariaLabel="Créer" onClick={() => {}} inline />
    </div>
  );
}
