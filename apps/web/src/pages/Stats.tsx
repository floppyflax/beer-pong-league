/**
 * Stats — Personal Stats Hub à l'URL `/stats`.
 *
 * Page perso (cf. plan misty-shimmying-hellman) : remplace l'ancien
 * `GlobalLeaderboard` qui était un classement cross-league par activité
 * (concept bancal — l'ELO est local, cf. invariant #8 et docs/architecture.md
 * §ELO model).
 *
 * Layout : hero 3 KPIs + 4 sections (Forme récente · Win rate par format ·
 * Allié & Nemesis · Ma progression par league). Pas d'agrégat ELO global,
 * uniquement W/L/winrate cross-context. Anon → AnonGatePlaceholder.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronRight,
  Flame,
  Heart,
  Skull,
  Swords,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";
import { useHomeData } from "@/hooks/useHomeData";
import { useLeague } from "@/context/LeagueContext";
import { useCurrentUserMemberships } from "@/hooks/useCurrentUserMemberships";
import { supabase, isSupabaseAvailable } from "@/lib/supabase";
import { AnonGatePlaceholder } from "@/components/AnonGatePlaceholder";
import {
  EmptyState,
  PageHero,
  ScreenLayout,
  StatCard,
} from "@/components/design-system";
import {
  computeBestAlly,
  computeFormTrend,
  computeNemesis,
  computeWinRateByFormat,
  type PlayerStatsMatch,
} from "@/utils/playerStatsAdvanced";

const ME_KEY = "__me__";

interface PerLeagueRow {
  leagueId: string;
  leagueName: string;
  elo: number;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
}

export function Stats() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const isAnonymous = useIsAnonymous();
  const { leagues, events } = useLeague();

  const userId = user?.id ?? localUser?.anonymousUserId ?? null;
  const { personalStats, recentResults, currentStreak, isLoading } =
    useHomeData(userId);
  const memberships = useCurrentUserMemberships(userId);

  // Normalise les matchs du user à travers leagues + events en mappant son
  // membership id vers la clé synthétique `__me__`. Les utilitaires de
  // playerStatsAdvanced opèrent depuis une "perspective unique" — sans
  // normalisation on ne pourrait pas agréger cross-context.
  const myMatches = useMemo<PlayerStatsMatch[]>(() => {
    const result: PlayerStatsMatch[] = [];
    for (const league of leagues) {
      const myId = memberships.leagueMembershipByLeague.get(league.id);
      if (!myId) continue;
      for (const m of league.matches) {
        const inA = m.teamA.includes(myId);
        const inB = m.teamB.includes(myId);
        if (!inA && !inB) continue;
        result.push({
          id: m.id,
          date: m.date,
          teamA: m.teamA.map((id) => (id === myId ? ME_KEY : id)),
          teamB: m.teamB.map((id) => (id === myId ? ME_KEY : id)),
          scoreA: m.scoreA,
          scoreB: m.scoreB,
        });
      }
    }
    for (const event of events) {
      const myId = memberships.eventMembershipByEvent.get(event.id);
      if (!myId) continue;
      for (const m of event.matches) {
        const inA = m.teamA.includes(myId);
        const inB = m.teamB.includes(myId);
        if (!inA && !inB) continue;
        result.push({
          id: m.id,
          date: m.date,
          teamA: m.teamA.map((id) => (id === myId ? ME_KEY : id)),
          teamB: m.teamB.map((id) => (id === myId ? ME_KEY : id)),
          scoreA: m.scoreA,
          scoreB: m.scoreB,
        });
      }
    }
    return result;
  }, [leagues, events, memberships]);

  // Charge les noms des event_memberships pour tous les events où le user
  // joue. Sans ça, allié/nemesis trouvés via des matchs d'event tombent
  // dans le fallback `Joueur <id>` car le map league.players ne contient
  // que les league_memberships.
  const eventIds = useMemo(
    () => Array.from(memberships.eventMembershipByEvent.keys()),
    [memberships],
  );
  const { data: eventParticipantNames } = useQuery({
    queryKey: ["statsEventParticipantNames", eventIds],
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!isSupabaseAvailable() || !supabase || eventIds.length === 0) {
        return map;
      }
      const { data } = await supabase
        .from("event_memberships")
        .select("id, pseudo_override, player:players(pseudo)")
        .in("event_id", eventIds);
      for (const row of (data ?? []) as Array<{
        id: string;
        pseudo_override: string | null;
        player: { pseudo: string } | { pseudo: string }[] | null;
      }>) {
        const pseudo = Array.isArray(row.player)
          ? row.player[0]?.pseudo
          : row.player?.pseudo;
        const name = row.pseudo_override || pseudo || "Joueur";
        map.set(row.id, name);
      }
      return map;
    },
    enabled: eventIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Map membership id (cross-context) → display name pour les allié/nemesis.
  // Fusionne league.players (league_memberships) + eventParticipantNames
  // (event_memberships) puisque match.teamA[i] peut porter l'un ou l'autre.
  const playerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const league of leagues) {
      for (const p of league.players) map.set(p.id, p.name);
    }
    if (eventParticipantNames) {
      for (const [id, name] of eventParticipantNames) {
        if (!map.has(id)) map.set(id, name);
      }
    }
    return map;
  }, [leagues, eventParticipantNames]);

  const formatWinRates = useMemo(
    () => computeWinRateByFormat(ME_KEY, myMatches),
    [myMatches],
  );
  const bestAlly = useMemo(
    () => computeBestAlly(ME_KEY, myMatches),
    [myMatches],
  );
  const nemesis = useMemo(() => computeNemesis(ME_KEY, myMatches), [myMatches]);
  const formTrend = useMemo(
    () => computeFormTrend(ME_KEY, myMatches),
    [myMatches],
  );

  const perLeague = useMemo<PerLeagueRow[]>(() => {
    const rows: PerLeagueRow[] = [];
    for (const league of leagues) {
      const myId = memberships.leagueMembershipByLeague.get(league.id);
      if (!myId) continue;
      const me = league.players.find((p) => p.id === myId);
      if (!me) continue;
      const matchesCount = me.wins + me.losses;
      rows.push({
        leagueId: league.id,
        leagueName: league.name,
        elo: me.elo,
        wins: me.wins,
        losses: me.losses,
        matches: matchesCount,
        winRate:
          matchesCount > 0 ? Math.round((me.wins / matchesCount) * 100) : 0,
      });
    }
    rows.sort((a, b) => b.matches - a.matches);
    return rows;
  }, [leagues, memberships]);

  if (isAnonymous) {
    return (
      <AnonGatePlaceholder
        fullScreen
        title="Stats verrouillées"
        description="Crée un compte gratuit pour suivre tes matchs, ton win rate et tes alliés à travers toutes tes ligues."
      />
    );
  }

  const totalMatches = personalStats?.totalMatches ?? 0;
  const winRate = personalStats?.winRate ?? 0;
  const hasAdvancedSections =
    formatWinRates.some((f) => f.matches > 0) ||
    bestAlly ||
    nemesis ||
    formTrend.lifetimeMatches >= 5;

  return (
    <ScreenLayout>
      <PageHero
        eyebrow="Stats"
        title="Tes stats"
        subtitle="Tes performances cross-context, lifetime. Pas de classement ELO global — l'ELO se calibre par contexte."
      />
      <div className="space-y-6 pb-bottom-nav lg:pb-bottom-nav-lg">
        {/* Hero KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            value={isLoading ? "—" : totalMatches}
            label="Matchs"
            variant="accent"
          />
          <StatCard
            value={
              isLoading || totalMatches === 0 ? "—" : `${Math.round(winRate)}%`
            }
            label="Win rate"
            variant="success"
          />
          <StatCard
            value={formatStreak(currentStreak)}
            label="Série"
            variant={currentStreak > 0 ? "success" : currentStreak < 0 ? "accent" : "default"}
          />
        </div>

        {/* Empty state if no match at all */}
        {totalMatches === 0 && !isLoading && (
          <EmptyState
            icon={<Flame size={48} className="text-cool-gray" aria-hidden />}
            title="Pas encore de matchs"
            description="Rejoins une league ou un event et joue tes premiers matchs pour voir tes stats apparaître ici."
            minHeight="min-h-[30vh]"
          />
        )}

        {/* Forme récente */}
        {recentResults.length > 0 && (
          <section>
            <SectionHeader
              icon={<Activity size={18} aria-hidden />}
              title="Forme récente"
            />
            <div className="bg-navy-soft rounded-card border border-card p-4 flex items-center gap-4">
              <div className="flex items-center gap-1" role="img" aria-label="5 derniers résultats">
                {recentResults.map((won, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full ${won ? "bg-lime" : "bg-signal-red"}`}
                    title={won ? "Victoire" : "Défaite"}
                  />
                ))}
              </div>
              {formTrend.recentMatches >= 5 && (
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">
                    {formTrend.delta > 0 ? "+" : ""}
                    {formTrend.delta}% vs lifetime
                  </div>
                  <div className="text-xs text-cool-gray">
                    {formTrend.recentMatches} derniers : {formTrend.recentWinRate}% · Lifetime : {formTrend.lifetimeWinRate}%
                  </div>
                </div>
              )}
              {formTrend.delta > 0 ? (
                <TrendingUp className="text-lime flex-shrink-0" size={20} aria-hidden />
              ) : formTrend.delta < 0 ? (
                <TrendingDown className="text-signal-red flex-shrink-0" size={20} aria-hidden />
              ) : null}
            </div>
          </section>
        )}

        {/* Win rate par format */}
        {formatWinRates.some((f) => f.matches > 0) && (
          <section>
            <SectionHeader
              icon={<Swords size={18} aria-hidden />}
              title="Win rate par format"
            />
            <div className="grid grid-cols-3 gap-2">
              {formatWinRates.map((f) => (
                <StatCard
                  key={f.format}
                  value={f.matches > 0 ? `${f.winRate}%` : "—"}
                  label={`${f.format} · ${f.matches} m.`}
                  variant={f.matches > 0 && f.winRate >= 50 ? "success" : "default"}
                />
              ))}
            </div>
          </section>
        )}

        {/* Allié & Nemesis */}
        {(bestAlly || nemesis) && (
          <section>
            <SectionHeader
              icon={<Heart size={18} aria-hidden />}
              title="Allié & Nemesis"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bestAlly && (
                <button
                  type="button"
                  onClick={() => navigate(`/player/${bestAlly.playerId}`)}
                  className="bg-lime/10 border border-lime/40 p-4 rounded-card flex items-center gap-3 text-left hover:bg-lime/15 transition-colors"
                >
                  <Heart className="text-lime flex-shrink-0" size={24} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                      Meilleur allié
                    </div>
                    <div className="font-bold text-white truncate">
                      {playerNameById.get(bestAlly.playerId) ??
                        `Joueur ${bestAlly.playerId.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {bestAlly.wins}V - {bestAlly.losses}D · {bestAlly.winRate}%
                    </div>
                  </div>
                </button>
              )}
              {nemesis && (
                <button
                  type="button"
                  onClick={() => navigate(`/player/${nemesis.playerId}`)}
                  className="bg-signal-red/10 border border-signal-red/40 p-4 rounded-card flex items-center gap-3 text-left hover:bg-signal-red/15 transition-colors"
                >
                  <Skull
                    className="text-signal-red flex-shrink-0"
                    size={24}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                      Nemesis
                    </div>
                    <div className="font-bold text-white truncate">
                      {playerNameById.get(nemesis.playerId) ??
                        `Joueur ${nemesis.playerId.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {nemesis.wins}V - {nemesis.losses}D · {nemesis.winRate}%
                    </div>
                  </div>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Ma progression par league */}
        {perLeague.length > 0 && (
          <section>
            <SectionHeader
              icon={<TrendingUp size={18} aria-hidden />}
              title="Ma progression par league"
            />
            <div className="space-y-2">
              {perLeague.map((row) => (
                <button
                  key={row.leagueId}
                  type="button"
                  onClick={() => navigate(`/league/${row.leagueId}`)}
                  className="w-full bg-navy-soft rounded-card border border-card p-4 flex items-center gap-3 hover:border-card-muted transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-archivo font-extrabold uppercase tracking-tight text-white truncate">
                      {row.leagueName}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {row.matches} matchs · {row.wins}V - {row.losses}D · {row.winRate}%
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold tabular-nums text-electric-blue">
                      {row.elo}
                    </div>
                    <div className="text-[10px] text-cool-gray font-mono uppercase tracking-widest">
                      ELO
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-cool-gray flex-shrink-0" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Fallback : user a des matchs lifetime mais aucune section avancée
            n'a de données (cas rare — par exemple seulement des events, pas
            de league rejointe). On reste silencieux ici, le hero suffit. */}
        {totalMatches > 0 && !hasAdvancedSections && perLeague.length === 0 && (
          <div className="text-center text-xs text-cool-gray italic">
            Tes stats apparaissent au fur et à mesure que tu joues.
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}

function formatStreak(streak: number): string {
  if (streak === 0) return "—";
  return streak > 0 ? `+${streak}` : `${streak}`;
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
      <span className="text-cool-gray">{icon}</span>
      {title}
    </h3>
  );
}
