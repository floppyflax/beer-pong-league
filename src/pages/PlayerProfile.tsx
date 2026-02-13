/**
 * PlayerProfile — Story 14-20, 14-35
 *
 * Page profil joueur alignée avec le design system (design-system-convergence §5.4).
 * Story 14-35: Avatar photo, Membre depuis, streak "En feu !", matchs enrichis, head-to-head avatars, ELO graph.
 */

import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard, ListRow } from "@/components/design-system";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { databaseService } from "@/services/DatabaseService";
import { TrendingUp, TrendingDown, BarChart3, Flame } from "lucide-react";
import { useState, useMemo, useEffect, useId } from "react";
import { getInitials } from "@/utils/string";
import { formatRelativeTime, formatJoinedSince } from "@/utils/dateUtils";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Player } from "@/types";
import type { Match } from "@/types";

export const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const eloGradientId = useId();
  const { leagues, tournaments } = useLeague();
  const navigate = useNavigate();
  const [fetchedPlayer, setFetchedPlayer] = useState<{
    player: Player;
    playerLeague: { id: string; name: string } | null;
    playersMap: Record<string, string>;
    avatarUrl?: string | null;
    joinedAt?: string | null;
  } | null>(null);
  const [enrichment, setEnrichment] = useState<{
    avatarUrl: string | null;
    joinedAt: string | null;
    userId: string | null;
    anonymousUserId: string | null;
  } | null>(null);
  const [opponentAvatars, setOpponentAvatars] = useState<Record<string, string | null>>({});
  const [eloHistoryFromDb, setEloHistoryFromDb] = useState<{ date: string; elo: number }[]>([]);
  const [playerNotFound, setPlayerNotFound] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);

  // Find player in leagues first (sync)
  let player: Player | null = null;
  let playerLeague: { id: string; name: string } | null = null;

  for (const league of leagues) {
    const foundPlayer = league.players.find((p) => p.id === playerId);
    if (foundPlayer) {
      player = foundPlayer;
      playerLeague = { id: league.id, name: league.name };
      break;
    }
  }

  // Reset avatar error when switching players
  useEffect(() => {
    setAvatarLoadError(false);
  }, [playerId]);

  // If not in leagues, fetch from DB (tournament players, or league players from leagues we're not in)
  useEffect(() => {
    if (!playerId || player) {
      setFetchedPlayer(null);
      setPlayerNotFound(false);
      setIsLoadingPlayer(false);
      return;
    }
    let cancelled = false;
    setIsLoadingPlayer(true);
    setPlayerNotFound(false);
    databaseService
      .loadPlayerById(playerId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setIsLoadingPlayer(false);
          setPlayerNotFound(true);
          setFetchedPlayer(null);
          return;
        }
        const { player: p, leagueId, leagueName, tournamentId, avatarUrl, joinedAt } = result;
        const playersMap: Record<string, string> = {};
        leagues.forEach((l) => {
          l.players.forEach((pl) => {
            playersMap[pl.id] = pl.name;
          });
        });
        playersMap[p.id] = p.name;

        const basePayload = {
          player: p,
          playerLeague: leagueName ? { id: leagueId!, name: leagueName } : null,
          playersMap: {} as Record<string, string>,
          avatarUrl: avatarUrl ?? null,
          joinedAt: joinedAt ?? null,
        };

        if (tournamentId) {
          databaseService.loadTournamentParticipants(tournamentId).then((participants) => {
            if (cancelled) return;
            const map = { ...playersMap };
            participants.forEach((tp) => {
              map[tp.id] = tp.name;
            });
            setFetchedPlayer({ ...basePayload, playersMap: map });
            setIsLoadingPlayer(false);
          });
        } else {
          setFetchedPlayer({ ...basePayload, playersMap });
          setIsLoadingPlayer(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[PlayerProfile] loadPlayerById failed:", err);
          setIsLoadingPlayer(false);
          setPlayerNotFound(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playerId, player, leagues]);

  // Story 14-35: Load enrichment (avatar, joined_at, userId) — for league players or when we need userId for ELO history
  useEffect(() => {
    if (!playerId || !player) {
      setEnrichment(null);
      return;
    }
    let cancelled = false;
    databaseService.loadPlayerEnrichment(playerId).then((e) => {
      if (!cancelled) setEnrichment(e);
    });
    return () => {
      cancelled = true;
    };
  }, [playerId, player]);

  // Story 14-35: Load ELO history from DB when we have user identity (fallback to match data in eloEvolution)
  useEffect(() => {
    const userId = enrichment?.userId ?? null;
    const anonId = enrichment?.anonymousUserId ?? null;
    if (!userId && !anonId) {
      setEloHistoryFromDb([]);
      return;
    }
    let cancelled = false;
    databaseService
      .loadEloHistoryForPlayer(userId, anonId, playerLeague?.id ?? null)
      .then((data) => {
        if (!cancelled) setEloHistoryFromDb(data);
      });
    return () => {
      cancelled = true;
    };
  }, [enrichment, playerLeague?.id]);

  if (fetchedPlayer) {
    player = fetchedPlayer.player;
    playerLeague = fetchedPlayer.playerLeague;
  }

  // Hooks MUST be called unconditionally before any early returns (Rules of Hooks)
  const currentPlayer = player;

  // Story 14-35: Build player matches with league/tournament context for display
  const playerMatchesWithContext = useMemo(() => {
    if (!currentPlayer) return [];
    const items: { match: Match; leagueName: string | null; tournamentName: string | null }[] = [];
    leagues.forEach((league) => {
      league.matches.forEach((match) => {
        if (
          match.teamA.includes(currentPlayer.id) ||
          match.teamB.includes(currentPlayer.id)
        ) {
          items.push({ match, leagueName: league.name, tournamentName: null });
        }
      });
    });
    tournaments.forEach((tournament) => {
      tournament.matches.forEach((match) => {
        if (
          match.teamA.includes(currentPlayer.id) ||
          match.teamB.includes(currentPlayer.id)
        ) {
          const leagueName = tournament.leagueId
            ? leagues.find((l) => l.id === tournament.leagueId)?.name ?? null
            : null;
          items.push({
            match,
            leagueName,
            tournamentName: tournament.name,
          });
        }
      });
    });
    return items.sort(
      (a, b) =>
        new Date(a.match.date).getTime() - new Date(b.match.date).getTime(),
    );
  }, [leagues, tournaments, currentPlayer]);

  const playerMatches = playerMatchesWithContext.map((x) => x.match);
  const sortedMatches = playerMatches;

  // Head-to-head stats (needed for opponent IDs and display)
  const headToHead = useMemo(() => {
    const h2h: Record<string, { wins: number; losses: number }> = {};
    playerMatches.forEach((match) => {
      const opponents = [
        ...match.teamA.filter((id) => id !== currentPlayer?.id),
        ...match.teamB.filter((id) => id !== currentPlayer?.id),
      ];
      const isWinner =
        (match.teamA.includes(currentPlayer!.id) && match.scoreA > match.scoreB) ||
        (match.teamB.includes(currentPlayer!.id) && match.scoreB > match.scoreA);
      opponents.forEach((opponentId) => {
        if (!h2h[opponentId]) h2h[opponentId] = { wins: 0, losses: 0 };
        if (isWinner) h2h[opponentId].wins++;
        else h2h[opponentId].losses++;
      });
    });
    return h2h;
  }, [playerMatches, currentPlayer]);

  const headToHeadOpponentIds = useMemo(
    () =>
      Object.entries(headToHead)
        .sort((a, b) => b[1].wins + b[1].losses - (a[1].wins + a[1].losses))
        .slice(0, 5)
        .map(([id]) => id),
    [headToHead],
  );

  useEffect(() => {
    if (headToHeadOpponentIds.length === 0) {
      setOpponentAvatars({});
      return;
    }
    databaseService
      .loadAvatarUrlsForPlayerIds(headToHeadOpponentIds)
      .then(setOpponentAvatars);
  }, [headToHeadOpponentIds.join(",")]);

  const eloEvolution = useMemo(() => {
    if (!currentPlayer) return [];
    // Story 14-35: Prefer elo_history from DB when available (monthly aggregation)
    if (eloHistoryFromDb.length > 0) return eloHistoryFromDb;
    // Fallback: compute from match data
    const evolution: { date: string; elo: number }[] = [];
    let currentElo = 1000;
    evolution.push({
      date: sortedMatches[0]?.date || new Date().toISOString(),
      elo: currentElo,
    });
    sortedMatches.forEach((match) => {
      if (
        currentPlayer &&
        match.eloChanges &&
        match.eloChanges[currentPlayer.id] !== undefined
      ) {
        currentElo += match.eloChanges[currentPlayer.id];
        evolution.push({ date: match.date, elo: currentElo });
      }
    });
    return evolution;
  }, [sortedMatches, currentPlayer, eloHistoryFromDb]);

  const playersMap = useMemo(() => {
    const map: Record<string, string> = {};
    leagues.forEach((l) => {
      l.players.forEach((pl) => {
        map[pl.id] = pl.name;
      });
    });
    if (fetchedPlayer?.playersMap) Object.assign(map, fetchedPlayer.playersMap);
    if (player) map[player.id] = player.name;
    return map;
  }, [leagues, player, fetchedPlayer]);

  const statsByLeague = useMemo(() => {
    if (!player) return {};
    const stats: Record<
      string,
      { leagueName: string; matches: number; wins: number; losses: number; elo: number; winRate: number }
    > = {};
    leagues.forEach((league) => {
      if (!currentPlayer) return;
      const leagueMatches = league.matches.filter(
        (match) =>
          match.teamA.includes(currentPlayer.id) || match.teamB.includes(currentPlayer.id),
      );
      if (leagueMatches.length > 0) {
        const wins = leagueMatches.filter((match) => {
          const isTeamA = match.teamA.includes(currentPlayer.id);
          const winner = match.scoreA > match.scoreB ? "A" : "B";
          return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
        }).length;
        const leaguePlayer = league.players.find((p) => p.id === currentPlayer.id);
        stats[league.id] = {
          leagueName: league.name,
          matches: leagueMatches.length,
          wins,
          losses: leagueMatches.length - wins,
          elo: leaguePlayer?.elo || 1000,
          winRate: Math.round((wins / leagueMatches.length) * 100),
        };
      }
    });
    return stats;
  }, [leagues, currentPlayer]);

  // Early returns AFTER all hooks
  if (isLoadingPlayer && !player) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!player && playerNotFound) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-400">Joueur introuvable.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary mt-4 font-semibold"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const playerWins = playerMatches.filter((match) => {
    const isTeamA = match.teamA.includes(player!.id);
    const winner = match.scoreA > match.scoreB ? "A" : "B";
    return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
  }).length;
  const currentPlayerId = player!.id;

  const playerLosses = playerMatches.length - playerWins;
  const winRate =
    playerMatches.length > 0
      ? Math.round((playerWins / playerMatches.length) * 100)
      : 0;

  // Story 14-35: Resolve avatar and joined_at (from fetchedPlayer or enrichment)
  const avatarUrl =
    fetchedPlayer?.avatarUrl ?? enrichment?.avatarUrl ?? null;
  const joinedAt = fetchedPlayer?.joinedAt ?? enrichment?.joinedAt ?? null;

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* AC1: Header — nom + retour */}
      <ContextualHeader
        title={player.name}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {/* AC1, AC2: Avatar (photo or initials) + infos + Membre depuis */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 overflow-hidden">
            {avatarUrl && !avatarLoadError ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <span>{getInitials(player.name)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">
              {player.name}
            </h2>
            {playerLeague && (
              <p className="text-sm text-slate-400 truncate">
                {playerLeague.name}
              </p>
            )}
            {joinedAt && (
              <p className="text-xs text-slate-500 mt-0.5">
                {formatJoinedSince(joinedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AC3: StatCards (ELO, W/L, Win rate) */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <StatCard value={player.elo} label="ELO" variant="accent" />
        <StatCard
          value={`${playerWins}V - ${playerLosses}D`}
          label="W/L"
        />
        <StatCard value={`${winRate}%`} label="Win rate" variant="success" />
      </div>

      {/* AC3, AC4: Streak card — "En feu !" variant when streak >= 3 */}
      <div className="px-4 pb-4">
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            player.streak >= 3
              ? "bg-amber-500/20 border-amber-500/50"
              : player.streak > 0
                ? "bg-green-500/20 border-green-500/50"
                : player.streak < 0
                  ? "bg-red-500/20 border-red-500/50"
                  : "bg-slate-800/50 border-slate-700/50"
          }`}
        >
          {player.streak >= 3 ? (
            <Flame className="text-amber-500 flex-shrink-0" size={24} />
          ) : player.streak > 0 ? (
            <TrendingUp className="text-green-500 flex-shrink-0" size={24} />
          ) : player.streak < 0 ? (
            <TrendingDown className="text-red-500 flex-shrink-0" size={24} />
          ) : null}
          <div className="min-w-0">
            <div className="font-bold text-white">
              {player.streak >= 3
                ? "En feu !"
                : player.streak > 0
                  ? `${player.streak} victoires d'affilée`
                  : player.streak < 0
                    ? `${Math.abs(player.streak)} défaites d'affilée`
                    : "Aucune série"}
            </div>
            <div className="text-xs text-slate-400">
              {player.streak >= 3
                ? `${player.streak} victoires d'affilée`
                : "Série actuelle"}
            </div>
          </div>
        </div>
      </div>

      {/* AC5: Sections — ELO evolution, Stats par league, Head-to-head, Recent matches */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-6 pb-bottom-nav lg:pb-bottom-nav-lg">
        {/* ELO Evolution Chart — Story 14-35: Recharts area chart */}
        {eloEvolution.length > 1 && (
          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
              <BarChart3 size={20} className="text-slate-400" />
              Évolution ELO
            </h3>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={eloEvolution.map((p) => ({
                      ...p,
                      label: new Date(p.date).toLocaleDateString("fr-FR", {
                        month: "short",
                        year: "2-digit",
                      }),
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={eloGradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="rgb(251, 191, 36)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="rgb(251, 191, 36)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.15)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgb(148, 163, 184)", fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[
                        (dataMin: number) =>
                          Math.max(800, Math.floor(dataMin / 50) * 50 - 50),
                        (dataMax: number) =>
                          Math.min(2000, Math.ceil(dataMax / 50) * 50 + 50),
                      ]}
                      tick={{ fill: "rgb(148, 163, 184)", fontSize: 10 }}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(30, 41, 59)",
                        border: "1px solid rgb(51, 65, 85)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "rgb(148, 163, 184)" }}
                      formatter={(value: number | undefined) =>
                        value !== undefined ? [`${value} ELO`, "ELO"] : ["—", "ELO"]
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="elo"
                      stroke="rgb(251, 191, 36)"
                      strokeWidth={2}
                      fill={`url(#${eloGradientId})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-slate-400 text-center">
                {eloEvolution.length} points de données
              </div>
            </div>
          </section>
        )}

        {/* Stats par league */}
        {Object.keys(statsByLeague).length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-white">
              Statistiques par League
            </h3>
            <div className="space-y-2">
              {Object.entries(statsByLeague).map(([leagueId, stats]) => (
                <div
                  key={leagueId}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">
                        {stats.leagueName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {stats.matches} matchs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {stats.elo} ELO
                      </div>
                      <div className="text-xs text-slate-400">
                        {stats.winRate}% win rate
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-500">{stats.wins}V</span>
                    <span className="text-red-500">{stats.losses}D</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Head-to-Head — ListRow (AC5) */}
        {Object.keys(headToHead).length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-white">
              Tête-à-tête
            </h3>
            <div className="space-y-2">
              {Object.entries(headToHead)
                .sort(
                  (a, b) =>
                    b[1].wins + b[1].losses - (a[1].wins + a[1].losses),
                )
                .slice(0, 5)
                .map(([opponentId, stats]) => {
                  const opponentName =
                    playersMap[opponentId] || `Joueur ${opponentId.slice(0, 8)}`;
                  const avatarUrl = opponentAvatars[opponentId] ?? undefined;
                  return (
                    <ListRow
                      key={opponentId}
                      variant="player"
                      name={opponentName}
                      subtitle={`${stats.wins}V - ${stats.losses}D`}
                      elo={0}
                      rightLabel={`${stats.wins + stats.losses} matchs`}
                      avatarUrl={avatarUrl ?? undefined}
                      onClick={() => navigate(`/player/${opponentId}`)}
                    />
                  );
                })}
            </div>
          </section>
        )}

        {/* Recent Matches — Story 14-35: relative time, league/tournament, badge Victoire/Défaite, delta ELO */}
        <section>
          <h3 className="text-lg font-bold mb-3 text-white">
            Matchs récents
          </h3>
          <div className="space-y-2">
            {playerMatchesWithContext.slice(0, 10).map(({ match, leagueName, tournamentName }) => {
              const isTeamA = match.teamA.includes(currentPlayerId);
              const isWinner =
                (isTeamA && match.scoreA > match.scoreB) ||
                (!isTeamA && match.scoreB > match.scoreA);
              const deltaElo =
                match.eloChanges?.[currentPlayerId] ?? undefined;
              const contextName =
                tournamentName ?? leagueName ?? null;

              const teamA = match.teamA
                .map((id) => playersMap[id] || `Joueur ${id.slice(0, 8)}`)
                .join(", ");
              const teamB = match.teamB
                .map((id) => playersMap[id] || `Joueur ${id.slice(0, 8)}`)
                .join(", ");

              return (
                <div
                  key={match.id}
                  className={`bg-slate-800 p-4 rounded-xl border border-slate-700/50 ${
                    isWinner ? "border-green-500/50" : "border-red-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(match.date)}
                    </span>
                    {contextName && (
                      <span className="text-xs text-slate-400 truncate max-w-[60%]">
                        {contextName}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                        isWinner
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isWinner ? "Victoire" : "Défaite"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div
                      className={`flex-1 truncate ${
                        isTeamA && isWinner ? "text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      {teamA}
                    </div>
                    <div className="px-3 text-slate-500 flex-shrink-0">VS</div>
                    <div
                      className={`flex-1 text-right truncate ${
                        !isTeamA && isWinner ? "text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      {teamB}
                    </div>
                  </div>
                  {deltaElo !== undefined && (
                    <div
                      className={`text-xs mt-1 text-center font-medium ${
                        deltaElo > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {deltaElo > 0 ? "+" : ""}
                      {deltaElo} ELO
                    </div>
                  )}
                  <MatchEnrichedDisplay
                    photoUrl={match.photo_url}
                    cupsRemaining={match.cups_remaining}
                  />
                </div>
              );
            })}
            {playerMatchesWithContext.length === 0 && (
              <p className="text-slate-500 text-center py-4">
                Aucun match enregistré
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
