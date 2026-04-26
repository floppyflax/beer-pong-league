/**
 * DetailDashboard archetype — represents EventDashboard / LeagueDashboard / Home.
 *
 * Pattern: hero with stats + segmented tabs + scrollable list of rows + FAB.
 */

import { useState } from "react";
import { Swords } from "lucide-react";
import { SegmentedTabs } from "../SegmentedTabs";
import { FAB } from "../FAB";
import { FIXTURE_PLAYERS } from "./_fixtures";

export function DetailDashboardMock() {
  const [tab, setTab] = useState("ranking");

  return (
    <div className="min-h-full bg-navy text-white">
      {/* Hero */}
      <div className="bg-electric-blue px-4 pt-4 pb-6">
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-white/70">
          Événement · 2v2
        </p>
        <h1 className="text-3xl font-archivo font-black uppercase tracking-tight">
          Méchoui XIII
        </h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Joueurs", value: 4 },
            { label: "Matchs", value: 0 },
            { label: "Top ELO", value: 1000 },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 rounded-lg p-3"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                {s.label}
              </p>
              <p className="text-2xl font-archivo font-extrabold text-white tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-20">
        <SegmentedTabs
          tabs={[
            { id: "matches", label: "Matchs" },
            { id: "ranking", label: "Classement" },
          ]}
          activeId={tab}
          onChange={setTab}
        />

        <div className="mt-4 space-y-2">
          {FIXTURE_PLAYERS.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className="bg-navy-soft rounded-card border border-card px-3 py-3 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-cool-gray/15 text-cool-gray flex items-center justify-center font-archivo font-extrabold text-xs">
                {i + 1}
              </div>
              <div className="w-9 h-9 rounded-full bg-electric-blue/15 ring-1 ring-electric-blue/40 flex items-center justify-center text-electric-blue font-archivo font-extrabold text-xs">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 font-archivo font-extrabold text-sm text-white truncate">
                {p.name}
              </div>
              <div className="font-mono text-sm text-lime tabular-nums">
                {p.elo}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FAB icon={Swords} ariaLabel="Nouveau match" onClick={() => {}} inline />
    </div>
  );
}
