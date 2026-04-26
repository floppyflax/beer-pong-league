/**
 * GlobalLeaderboard — "Statistiques globales"
 *
 * Cross-league lifetime activity feed. Aggrège tous les joueurs de toutes les
 * ligues du contexte, déduplique par player ID, et affiche un classement par
 * activité (matchs joués · victoires · win rate).
 *
 * ⚠️ Pas de classement ELO global ici (cf. docs/architecture.md §ELO model) :
 * l'ELO n'est calibré qu'à l'intérieur d'un cluster local (Event ou League),
 * agréger l'ELO max ne produit pas un classement comparable. On surface donc
 * uniquement des stats lifetime, qui n'ont pas besoin de calibration.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { ScreenLayout, PageHero } from "@/components/design-system";
import { SegmentedTabs } from "@/components/design-system";
import { LeaderRow } from "@/components/ponglo/LeaderRow";
import type { LeaderboardPlayer } from "@/components/ponglo/LeaderRow";
import { Trophy } from "lucide-react";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";
import { AnonGatePlaceholder } from "@/components/AnonGatePlaceholder";

// ── Sort options ────────────────────────────────────────────────────────────

type SortKey = "matches" | "wins" | "winrate";

const SORT_TABS = [
  { id: "matches", label: "Matchs"   },
  { id: "wins",    label: "Victoires" },
  { id: "winrate", label: "Win Rate"  },
];

// ── Aggregated player shape ─────────────────────────────────────────────────

interface AggPlayer extends LeaderboardPlayer {
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function GlobalLeaderboard() {
  const { leagues } = useLeague();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("matches");
  const isAnonymous = useIsAnonymous();

  // Agrège les joueurs de toutes les ligues — cumul lifetime W/L/matches.
  // L'ELO max est conservé par compatibilité avec LeaderRow mais n'est PAS
  // utilisé comme clé de tri (cf. en-tête de fichier).
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
      const matches = data.wins + data.losses;
      return {
        id,
        name: data.name,
        elo: data.elo,
        wins: data.wins,
        losses: data.losses,
        matches,
        winRate: matches > 0 ? Math.round((data.wins / matches) * 100) : 0,
        avatarUrl: data.avatarUrl,
      };
    });
  }, [leagues]);

  const sorted = useMemo<AggPlayer[]>(() => {
    return [...aggregated].sort((a, b) => {
      if (sort === "wins")    return b.wins - a.wins;
      if (sort === "winrate") return b.winRate - a.winRate;
      // default: matches played
      return b.matches - a.matches;
    });
  }, [aggregated, sort]);

  const hasData = sorted.length > 0;

  // Anon users don't have access to the lifetime stats feed — they are guest
  // participants in events, not community members. Surface a paywall-style
  // placeholder that nudges sign-up. (Early return AFTER all hooks.)
  if (isAnonymous) {
    return (
      <AnonGatePlaceholder
        fullScreen
        title="Stats verrouillées"
        description="Crée un compte gratuit pour suivre tes matchs, ton win rate et tes streaks à travers toutes tes ligues et événements."
      />
    );
  }

  return (
    <ScreenLayout>
      <PageHero
        eyebrow="Stats"
        title="Activité globale"
        subtitle="Stats lifetime de tous les joueurs — aucun classement ELO global (l'ELO se calibre par contexte, pas globalement)."
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

        {/* Liste — tous les joueurs, classés par activité (pas de podium ELO). */}
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
