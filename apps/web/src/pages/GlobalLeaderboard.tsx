/**
 * GlobalLeaderboard — Phase D.5
 *
 * Cross-league ELO leaderboard. Agrège tous les joueurs de toutes les ligues
 * du contexte, déduplique par player ID (ELO max), et affiche Podium + LeaderRow.
 *
 * Sort pills : ELO (défaut) · Victoires · Win Rate.
 * Pattern : ScreenLayout + PageHero (titre éditorial, pas de back button).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { ScreenLayout, PageHero } from "@/components/design-system";
import { SegmentedTabs } from "@/components/design-system";
import { Podium } from "@/components/ponglo/Podium";
import { LeaderRow } from "@/components/ponglo/LeaderRow";
import type { LeaderboardPlayer } from "@/components/ponglo/LeaderRow";
import { Trophy } from "lucide-react";

// ── Sort options ────────────────────────────────────────────────────────────

type SortKey = "elo" | "wins" | "winrate";

const SORT_TABS = [
  { id: "elo",     label: "ELO"       },
  { id: "wins",    label: "Victoires" },
  { id: "winrate", label: "Win Rate"  },
];

// ── Aggregated player shape ─────────────────────────────────────────────────

interface AggPlayer extends LeaderboardPlayer {
  wins: number;
  losses: number;
  winRate: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function GlobalLeaderboard() {
  const { leagues } = useLeague();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("elo");

  // Agrège les joueurs de toutes les ligues — max ELO, cumul W/L
  const aggregated = useMemo<AggPlayer[]>(() => {
    const map = new Map<
      string,
      { name: string; elo: number; wins: number; losses: number; avatarUrl?: string }
    >();

    leagues.forEach((league) => {
      league.players.forEach((p) => {
        const existing = map.get(p.id);
        if (!existing) {
          map.set(p.id, {
            name: p.name,
            elo: p.elo,
            wins: p.wins ?? 0,
            losses: p.losses ?? 0,
          });
        } else {
          map.set(p.id, {
            ...existing,
            elo: Math.max(existing.elo, p.elo),
            wins: existing.wins + (p.wins ?? 0),
            losses: existing.losses + (p.losses ?? 0),
          });
        }
      });
    });

    return Array.from(map.entries()).map(([id, data]) => {
      const total = data.wins + data.losses;
      return {
        id,
        name: data.name,
        elo: data.elo,
        wins: data.wins,
        losses: data.losses,
        winRate: total > 0 ? Math.round((data.wins / total) * 100) : 0,
        avatarUrl: data.avatarUrl,
      };
    });
  }, [leagues]);

  const sorted = useMemo<AggPlayer[]>(() => {
    return [...aggregated].sort((a, b) => {
      if (sort === "wins")    return b.wins - a.wins;
      if (sort === "winrate") return b.winRate - a.winRate;
      return b.elo - a.elo;
    });
  }, [aggregated, sort]);

  const top3 = sorted.slice(0, 3);
  const hasData = sorted.length > 0;

  return (
    <ScreenLayout>
      <PageHero
        eyebrow="Classement"
        title="Classement global"
        subtitle="Tous les joueurs, toutes ligues confondues — l'ELO max est conservé."
      />
      <div className="space-y-5 pb-bottom-nav lg:pb-bottom-nav-lg">

        {/* Sort tabs */}
        <SegmentedTabs
          tabs={SORT_TABS}
          activeId={sort}
          onChange={(id) => setSort(id as SortKey)}
          variant="encapsulated"
        />

        {/* Empty state */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy size={48} className="text-cool-gray mb-4 opacity-40" />
            <p className="text-cool-gray font-semibold">Aucun joueur trouvé</p>
            <p className="text-xs text-cool-gray/60 mt-1">
              Rejoins une league pour apparaître ici.
            </p>
          </div>
        )}

        {/* Podium top 3 */}
        {top3.length >= 3 && (
          <Podium
            top3={top3.map((p) => ({
              id: p.id,
              name: p.name,
              elo: p.elo,
              avatar: p.avatarUrl,
            }))}
            scope="Classement global"
          />
        )}

        {/* Liste complète */}
        {sorted.length > 0 && (
          <div className="space-y-1.5">
            {sorted.map((player, idx) => (
              <LeaderRow
                key={player.id}
                rank={idx + 1}
                player={player}
                onClick={() => navigate(`/player/${player.id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </ScreenLayout>
  );
}
