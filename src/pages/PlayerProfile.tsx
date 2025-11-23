import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { ArrowLeft, Edit, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

export const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { leagues, updatePlayer } = useLeague();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState("");

  // Find player across all leagues
  let player = null;
  let playerLeague = null;

  for (const league of leagues) {
    const foundPlayer = league.players.find((p) => p.id === playerId);
    if (foundPlayer) {
      player = foundPlayer;
      playerLeague = league;
      break;
    }
  }

  if (!player) {
    return (
      <div className="p-4 text-center">
        <p>Joueur introuvable.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary mt-4"
        >
          Retour
        </button>
      </div>
    );
  }

  // Calculate global stats across all leagues
  const allMatches = leagues.flatMap((league) => league.matches);
  const playerMatches = allMatches.filter(
    (match) =>
      match.teamA.includes(player!.id) || match.teamB.includes(player!.id)
  );

  // Sort matches chronologically
  const sortedMatches = [...playerMatches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate ELO evolution over time
  const eloEvolution = useMemo(() => {
    const evolution: { date: string; elo: number }[] = [];
    let currentElo = 1000; // Starting ELO

    evolution.push({
      date: sortedMatches[0]?.date || new Date().toISOString(),
      elo: currentElo,
    });

    sortedMatches.forEach((match) => {
      if (match.eloChanges && match.eloChanges[player!.id] !== undefined) {
        currentElo += match.eloChanges[player!.id];
        evolution.push({
          date: match.date,
          elo: currentElo,
        });
      }
    });

    return evolution;
  }, [sortedMatches, player]);

  // Calculate stats per league
  const statsByLeague = useMemo(() => {
    const stats: Record<
      string,
      {
        leagueName: string;
        matches: number;
        wins: number;
        losses: number;
        elo: number;
        winRate: number;
      }
    > = {};

    leagues.forEach((league) => {
      const leagueMatches = league.matches.filter(
        (match) =>
          match.teamA.includes(player!.id) || match.teamB.includes(player!.id)
      );

      if (leagueMatches.length > 0) {
        const wins = leagueMatches.filter((match) => {
          const isTeamA = match.teamA.includes(player!.id);
          const winner = match.scoreA > match.scoreB ? "A" : "B";
          return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
        }).length;

        const leaguePlayer = league.players.find((p) => p.id === player!.id);
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
  }, [leagues, player]);

  const playerWins = playerMatches.filter((match) => {
    const isTeamA = match.teamA.includes(player!.id);
    const winner = match.scoreA > match.scoreB ? "A" : "B";
    return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
  }).length;

  const playerLosses = playerMatches.length - playerWins;
  const winRate = playerMatches.length > 0 
    ? Math.round((playerWins / playerMatches.length) * 100) 
    : 0;

  // Find head-to-head stats
  const headToHead: Record<string, { wins: number; losses: number }> = {};
  playerMatches.forEach((match) => {
    const opponents = [
      ...match.teamA.filter((id) => id !== player!.id),
      ...match.teamB.filter((id) => id !== player!.id),
    ];
    const isWinner =
      (match.teamA.includes(player!.id) && match.scoreA > match.scoreB) ||
      (match.teamB.includes(player!.id) && match.scoreB > match.scoreA);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-800/50 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <div className="text-xs text-slate-400">
            {playerLeague?.name || "Joueur"}
          </div>
        </div>
        <button
          onClick={() => {
            setNewName(player.name);
            setShowEditModal(true);
          }}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Edit size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">{player.elo}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            ELO
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">
            {playerWins}V - {playerLosses}D
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Global
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">{winRate}%</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Win Rate
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="px-4 pb-4">
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            player.streak > 0
              ? "bg-green-500/20 border border-green-500/50"
              : "bg-red-500/20 border border-red-500/50"
          }`}
        >
          {player.streak > 0 ? (
            <TrendingUp className="text-green-500" size={24} />
          ) : (
            <TrendingDown className="text-red-500" size={24} />
          )}
          <div>
            <div className="font-bold text-white">
              {player.streak > 0
                ? `${player.streak} victoires d'affilée`
                : `${Math.abs(player.streak)} défaites d'affilée`}
            </div>
            <div className="text-xs text-slate-400">Série actuelle</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* ELO Evolution Chart */}
        {eloEvolution.length > 1 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <BarChart3 size={20} />
              Évolution ELO
            </h3>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <div className="relative h-48">
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
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

                  {/* ELO line */}
                  {eloEvolution.length > 1 && (
                    <polyline
                      points={eloEvolution
                        .map((point, index) => {
                          const x = (index / (eloEvolution.length - 1)) * 400;
                          const minElo = Math.min(...eloEvolution.map((p) => p.elo));
                          const maxElo = Math.max(...eloEvolution.map((p) => p.elo));
                          const range = maxElo - minElo || 400;
                          const y = 200 - ((point.elo - minElo) / range) * 180 - 10;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="rgb(251, 191, 36)"
                      strokeWidth="3"
                    />
                  )}

                  {/* Points */}
                  {eloEvolution.map((point, index) => {
                    const minElo = Math.min(...eloEvolution.map((p) => p.elo));
                    const maxElo = Math.max(...eloEvolution.map((p) => p.elo));
                    const range = maxElo - minElo || 400;
                    const x = (index / (eloEvolution.length - 1)) * 400;
                    const y = 200 - ((point.elo - minElo) / range) * 180 - 10;
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
                  <span>
                    {Math.min(...eloEvolution.map((p) => p.elo))}
                  </span>
                  <span>
                    {Math.max(...eloEvolution.map((p) => p.elo))}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400 text-center">
                {eloEvolution.length} points de données
              </div>
            </div>
          </div>
        )}

        {/* Stats by League */}
        {Object.keys(statsByLeague).length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">Statistiques par League</h3>
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
                    <div className="text-green-500">
                      {stats.wins}V
                    </div>
                    <div className="text-red-500">
                      {stats.losses}D
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Head-to-Head */}
        {Object.keys(headToHead).length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">Tête-à-tête</h3>
            <div className="space-y-2">
              {Object.entries(headToHead)
                .sort(
                  (a, b) =>
                    b[1].wins + b[1].losses - (a[1].wins + a[1].losses)
                )
                .slice(0, 5)
                .map(([opponentId, stats]) => {
                  const opponent = leagues
                    .flatMap((l) => l.players)
                    .find((p) => p.id === opponentId);
                  if (!opponent) return null;

                  return (
                    <div
                      key={opponentId}
                      className="bg-slate-800 p-3 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {opponent.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {stats.wins + stats.losses} matchs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">
                          {stats.wins}V
                        </div>
                        <div className="text-xs text-red-500">
                          {stats.losses}D
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recent Matches */}
        <div>
          <h3 className="text-lg font-bold mb-3">Matchs récents</h3>
          <div className="space-y-2">
            {playerMatches.slice(0, 10).map((match) => {
              const isTeamA = match.teamA.includes(player!.id);
              const isWinner =
                (isTeamA && match.scoreA > match.scoreB) ||
                (!isTeamA && match.scoreB > match.scoreA);

              const teamA = leagues
                .flatMap((l) => l.players)
                .filter((p) => match.teamA.includes(p.id))
                .map((p) => p.name)
                .join(", ");
              const teamB = leagues
                .flatMap((l) => l.players)
                .filter((p) => match.teamB.includes(p.id))
                .map((p) => p.name)
                .join(", ");

              return (
                <div
                  key={match.id}
                  className={`bg-slate-800 p-3 rounded-xl border ${
                    isWinner
                      ? "border-green-500/50"
                      : "border-red-500/50"
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <div
                      className={`flex-1 ${
                        isTeamA && isWinner
                          ? "text-white font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {teamA}
                    </div>
                    <div className="px-3 text-slate-500">VS</div>
                    <div
                      className={`flex-1 text-right ${
                        !isTeamA && isWinner
                          ? "text-white font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {teamB}
                    </div>
                  </div>
                  {match.eloChanges && match.eloChanges[player!.id] && (
                    <div
                      className={`text-xs mt-1 text-center ${
                        match.eloChanges[player!.id] > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {match.eloChanges[player!.id] > 0 ? "+" : ""}
                      {match.eloChanges[player!.id]} ELO
                    </div>
                  )}
                </div>
              );
            })}
            {playerMatches.length === 0 && (
              <p className="text-slate-500 text-center py-4">
                Aucun match enregistré
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Modifier le nom</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-white focus:ring-2 focus:ring-primary outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (playerLeague && newName.trim()) {
                    updatePlayer(playerLeague.id, player!.id, newName.trim());
                    setShowEditModal(false);
                  }
                }}
                disabled={!newName.trim()}
                className="flex-1 bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-3 rounded-xl"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

