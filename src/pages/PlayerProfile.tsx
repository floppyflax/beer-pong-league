/**
 * PlayerProfile — Story 14-20
 *
 * Page profil joueur alignée avec le design system (design-system-convergence §5.4).
 * - Header: nom + retour
 * - Avatar + infos
 * - StatCards (ELO, W/L, Win rate)
 * - Carte streak
 * - Sections: Évolution ELO, Stats par league, Tête-à-tête, Matchs récents
 * - Bottom nav visible
 */

import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard, ListRow } from "@/components/design-system";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { databaseService } from "@/services/DatabaseService";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { getInitials } from "@/utils/string";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import type { Player } from "@/types";

export const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { leagues, tournaments } = useLeague();
  const navigate = useNavigate();
  const [fetchedPlayer, setFetchedPlayer] = useState<{
    player: Player;
    playerLeague: { id: string; name: string } | null;
    playersMap: Record<string, string>;
  } | null>(null);
  const [playerNotFound, setPlayerNotFound] = useState(false);
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
        const { player: p, leagueId, leagueName, tournamentId } = result;
        const playersMap: Record<string, string> = {};
        leagues.forEach((l) => {
          l.players.forEach((pl) => {
            playersMap[pl.id] = pl.name;
          });
        });
        playersMap[p.id] = p.name;

        if (tournamentId) {
          databaseService.loadTournamentParticipants(tournamentId).then((participants) => {
            if (cancelled) return;
            participants.forEach((tp) => {
              playersMap[tp.id] = tp.name;
            });
            setFetchedPlayer({
              player: p,
              playerLeague: leagueName ? { id: leagueId!, name: leagueName } : null,
              playersMap: { ...playersMap },
            });
            setIsLoadingPlayer(false);
          });
        } else {
          setFetchedPlayer({
            player: p,
            playerLeague: leagueName ? { id: leagueId!, name: leagueName } : null,
            playersMap,
          });
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

  if (fetchedPlayer) {
    player = fetchedPlayer.player;
    playerLeague = fetchedPlayer.playerLeague;
  }

  // Hooks MUST be called unconditionally before any early returns (Rules of Hooks)
  const allMatches = [
    ...leagues.flatMap((league) => league.matches),
    ...tournaments.flatMap((t) => t.matches),
  ];
  const currentPlayer = player;
  const playerMatches = currentPlayer
    ? allMatches.filter(
        (match) =>
          match.teamA.includes(currentPlayer.id) || match.teamB.includes(currentPlayer.id),
      )
    : [];
  const sortedMatches = [...playerMatches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const eloEvolution = useMemo(() => {
    if (!currentPlayer) return [];
    const evolution: { date: string; elo: number }[] = [];
    let currentElo = 1000;
    evolution.push({
      date: sortedMatches[0]?.date || new Date().toISOString(),
      elo: currentElo,
    });
    sortedMatches.forEach((match) => {
      if (currentPlayer && match.eloChanges && match.eloChanges[currentPlayer.id] !== undefined) {
        currentElo += match.eloChanges[currentPlayer.id];
        evolution.push({ date: match.date, elo: currentElo });
      }
    });
    return evolution;
  }, [sortedMatches, currentPlayer]);

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
    const isTeamA = match.teamA.includes(currentPlayer.id);
    const winner = match.scoreA > match.scoreB ? "A" : "B";
    return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
  }).length;

  const playerLosses = playerMatches.length - playerWins;
  const winRate =
    playerMatches.length > 0
      ? Math.round((playerWins / playerMatches.length) * 100)
      : 0;

  // Find head-to-head stats
  const headToHead: Record<string, { wins: number; losses: number }> = {};
  playerMatches.forEach((match) => {
    const opponents = [
      ...match.teamA.filter((id) => id !== currentPlayer.id),
      ...match.teamB.filter((id) => id !== currentPlayer.id),
    ];
    const isWinner =
      (match.teamA.includes(currentPlayer.id) && match.scoreA > match.scoreB) ||
      (match.teamB.includes(currentPlayer.id) && match.scoreB > match.scoreA);

    opponents.forEach((opponentId) => {
      if (!headToHead[opponentId]) {
        headToHead[opponentId] = { wins: 0, losses: 0 };
      }
      if (isWinner) {
        headToHead[opponentId].wins++;
      } else {
        headToHead[opponentId].losses++;
      }
    });
  });

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* AC1: Header — nom + retour */}
      <ContextualHeader
        title={player.name}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {/* AC2: Avatar + infos */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 overflow-hidden">
            <span>{getInitials(player.name)}</span>
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

      {/* AC4: Streak card */}
      <div className="px-4 pb-4">
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            player.streak > 0
              ? "bg-green-500/20 border-green-500/50"
              : player.streak < 0
                ? "bg-red-500/20 border-red-500/50"
                : "bg-slate-800/50 border-slate-700/50"
          }`}
        >
          {player.streak > 0 ? (
            <TrendingUp className="text-green-500 flex-shrink-0" size={24} />
          ) : player.streak < 0 ? (
            <TrendingDown className="text-red-500 flex-shrink-0" size={24} />
          ) : null}
          <div className="min-w-0">
            <div className="font-bold text-white">
              {player.streak > 0
                ? `${player.streak} victoires d'affilée`
                : player.streak < 0
                  ? `${Math.abs(player.streak)} défaites d'affilée`
                  : "Aucune série"}
            </div>
            <div className="text-xs text-slate-400">Série actuelle</div>
          </div>
        </div>
      </div>

      {/* AC5: Sections — ELO evolution, Stats par league, Head-to-head, Recent matches */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-6 pb-bottom-nav lg:pb-bottom-nav-lg">
        {/* ELO Evolution Chart */}
        {eloEvolution.length > 1 && (
          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
              <BarChart3 size={20} className="text-slate-400" />
              Évolution ELO
            </h3>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <div className="relative h-48">
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <line
                      key={percent}
                      x1="0"
                      y1={percent * 2}
                      x2="400"
                      y2={percent * 2}
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {eloEvolution.length > 1 && (
                    <polyline
                      points={eloEvolution
                        .map((point, index) => {
                          const x =
                            (index / (eloEvolution.length - 1)) * 400;
                          const minElo = Math.min(
                            ...eloEvolution.map((p) => p.elo),
                          );
                          const maxElo = Math.max(
                            ...eloEvolution.map((p) => p.elo),
                          );
                          const range = maxElo - minElo || 400;
                          const y =
                            200 - ((point.elo - minElo) / range) * 180 - 10;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="rgb(251, 191, 36)"
                      strokeWidth="3"
                    />
                  )}
                  {eloEvolution.map((point, index) => {
                    const minElo = Math.min(
                      ...eloEvolution.map((p) => p.elo),
                    );
                    const maxElo = Math.max(
                      ...eloEvolution.map((p) => p.elo),
                    );
                    const range = maxElo - minElo || 400;
                    const x = (index / (eloEvolution.length - 1)) * 400;
                    const y =
                      200 - ((point.elo - minElo) / range) * 180 - 10;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(251, 191, 36)"
                      />
                    );
                  })}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-2">
                  <span>{Math.min(...eloEvolution.map((p) => p.elo))}</span>
                  <span>{Math.max(...eloEvolution.map((p) => p.elo))}</span>
                </div>
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
                  const opponentName = playersMap[opponentId] || `Joueur ${opponentId.slice(0, 8)}`;
                  // rightLabel overrides elo display — elo unused in head-to-head context
                  return (
                    <ListRow
                      key={opponentId}
                      variant="player"
                      name={opponentName}
                      subtitle={`${stats.wins}V - ${stats.losses}D`}
                      elo={0}
                      rightLabel={`${stats.wins + stats.losses} matchs`}
                      onClick={() => navigate(`/player/${opponentId}`)}
                    />
                  );
                })}
            </div>
          </section>
        )}

        {/* Recent Matches */}
        <section>
          <h3 className="text-lg font-bold mb-3 text-white">
            Matchs récents
          </h3>
          <div className="space-y-2">
            {playerMatches.slice(0, 10).map((match) => {
              const isTeamA = match.teamA.includes(currentPlayer.id);
              const isWinner =
                (isTeamA && match.scoreA > match.scoreB) ||
                (!isTeamA && match.scoreB > match.scoreA);

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
                  <div className="flex justify-between items-center text-sm">
                    <div
                      className={`flex-1 truncate ${
                        isTeamA && isWinner
                          ? "text-white font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {teamA}
                    </div>
                    <div className="px-3 text-slate-500 flex-shrink-0">VS</div>
                    <div
                      className={`flex-1 text-right truncate ${
                        !isTeamA && isWinner
                          ? "text-white font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {teamB}
                    </div>
                  </div>
                  {match.eloChanges && match.eloChanges[currentPlayer.id] && (
                    <div
                      className={`text-xs mt-1 text-center ${
                        match.eloChanges[currentPlayer.id] > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {match.eloChanges[currentPlayer.id] > 0 ? "+" : ""}
                      {match.eloChanges[currentPlayer.id]} ELO
                    </div>
                  )}
                  <MatchEnrichedDisplay
                    photoUrl={match.photo_url}
                    cupsRemaining={match.cups_remaining}
                  />
                </div>
              );
            })}
            {playerMatches.length === 0 && (
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
