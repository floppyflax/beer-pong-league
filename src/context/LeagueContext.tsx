import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { League, Player, Match, Tournament } from "../types";
import { calculateEloChange } from "../utils/elo";
import { useAuth } from "../hooks/useAuth";
import { useIdentity } from "../hooks/useIdentity";

interface LeagueContextType {
  leagues: League[];
  tournaments: Tournament[];
  currentLeague: League | null;
  currentTournament: Tournament | null;
  createLeague: (name: string, type: "event" | "season") => string;
  createTournament: (
    name: string,
    date: string,
    leagueId: string | null,
    playerIds: string[]
  ) => string;
  selectLeague: (id: string) => void;
  selectTournament: (id: string) => void;
  associateTournamentToLeague: (tournamentId: string, leagueId: string) => void;
  addPlayer: (leagueId: string, name: string) => void;
  addPlayerToTournament: (tournamentId: string, playerId: string) => void;
  recordMatch: (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ) => Record<string, number> | null;
  recordTournamentMatch: (
    tournamentId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ) => Record<string, number> | null;
  deleteLeague: (id: string) => void;
  deleteTournament: (id: string) => void;
  toggleTournamentStatus: (tournamentId: string) => void;
  updateLeague: (
    leagueId: string,
    name: string,
    type: "event" | "season"
  ) => void;
  updateTournament: (tournamentId: string, name: string, date: string) => void;
  updatePlayer: (leagueId: string, playerId: string, name: string) => void;
  deletePlayer: (leagueId: string, playerId: string) => void;
  getTournamentLocalRanking: (tournamentId: string) => Player[];
  getLeagueGlobalRanking: (leagueId: string) => Player[];
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
};

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  // Get auth and identity info
  const { user, isAuthenticated } = useAuth();
  const { localUser } = useIdentity();

  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem("bpl_leagues");
    return saved ? JSON.parse(saved) : [];
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem("bpl_tournaments");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(() => {
    return localStorage.getItem("bpl_current_league_id");
  });

  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(
    () => {
      return localStorage.getItem("bpl_current_tournament_id");
    }
  );

  useEffect(() => {
    localStorage.setItem("bpl_leagues", JSON.stringify(leagues));
  }, [leagues]);

  useEffect(() => {
    localStorage.setItem("bpl_tournaments", JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentLeagueId) {
      localStorage.setItem("bpl_current_league_id", currentLeagueId);
    } else {
      localStorage.removeItem("bpl_current_league_id");
    }
  }, [currentLeagueId]);

  useEffect(() => {
    if (currentTournamentId) {
      localStorage.setItem("bpl_current_tournament_id", currentTournamentId);
    } else {
      localStorage.removeItem("bpl_current_tournament_id");
    }
  }, [currentTournamentId]);

  const currentLeague = leagues.find((l) => l.id === currentLeagueId) || null;
  const currentTournament =
    tournaments.find((t) => t.id === currentTournamentId) || null;

  const createLeague = (name: string, type: "event" | "season") => {
    const newLeague: League = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: new Date().toISOString(),
      players: [],
      matches: [],
      tournaments: [],
      // Associate creator based on auth state
      creator_user_id: isAuthenticated && user ? user.id : null,
      creator_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
    };
    setLeagues((prev) => [...prev, newLeague]);
    setCurrentLeagueId(newLeague.id);
    return newLeague.id;
  };

  const createTournament = (
    name: string,
    date: string,
    leagueId: string | null,
    playerIds: string[]
  ) => {
    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name,
      date,
      leagueId,
      createdAt: new Date().toISOString(),
      playerIds,
      matches: [],
      isFinished: false,
      // Associate creator based on auth state
      creator_user_id: isAuthenticated && user ? user.id : null,
      creator_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
    };
    setTournaments((prev) => [...prev, newTournament]);

    // If linked to a League, add tournament to League's tournaments list
    if (leagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== leagueId) return league;
          return {
            ...league,
            tournaments: [...(league.tournaments || []), newTournament.id],
          };
        })
      );
    }

    setCurrentTournamentId(newTournament.id);
    return newTournament.id;
  };

  const selectTournament = (id: string) => {
    setCurrentTournamentId(id);
  };

  const associateTournamentToLeague = (
    tournamentId: string,
    leagueId: string
  ) => {
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        return { ...tournament, leagueId };
      })
    );

    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        if (!league.tournaments?.includes(tournamentId)) {
          return {
            ...league,
            tournaments: [...(league.tournaments || []), tournamentId],
          };
        }
        return league;
      })
    );
  };

  const deleteTournament = (id: string) => {
    setTournaments((prev) => {
      const tournament = prev.find((t) => t.id === id);
      if (tournament?.leagueId) {
        setLeagues((prevLeagues) =>
          prevLeagues.map((league) => {
            if (league.id === tournament.leagueId) {
              return {
                ...league,
                tournaments:
                  league.tournaments?.filter((tId) => tId !== id) || [],
              };
            }
            return league;
          })
        );
      }
      return prev.filter((t) => t.id !== id);
    });
    if (currentTournamentId === id) {
      setCurrentTournamentId(null);
    }
  };

  const toggleTournamentStatus = (tournamentId: string) => {
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        return { ...tournament, isFinished: !tournament.isFinished };
      })
    );
  };

  const selectLeague = (id: string) => {
    setCurrentLeagueId(id);
  };

  const deleteLeague = (id: string) => {
    setLeagues((prev) => prev.filter((l) => l.id !== id));
    if (currentLeagueId === id) {
      setCurrentLeagueId(null);
    }
  };

  const addPlayer = (leagueId: string, name: string) => {
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;

        const newPlayer: Player = {
          id: crypto.randomUUID(),
          name,
          elo: 1000, // Starting ELO
          wins: 0,
          losses: 0,
          matchesPlayed: 0,
          streak: 0,
        };

        return {
          ...league,
          players: [...league.players, newPlayer],
        };
      })
    );
  };

  const addPlayerToTournament = (tournamentId: string, playerId: string) => {
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        if (tournament.playerIds.includes(playerId)) return tournament;
        return {
          ...tournament,
          playerIds: [...tournament.playerIds, playerId],
        };
      })
    );

    // If tournament is linked to a League, ensure player exists in League
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (tournament?.leagueId) {
      const league = leagues.find((l) => l.id === tournament.leagueId);
      if (league && !league.players.find((p) => p.id === playerId)) {
        // Player doesn't exist in League, we need to add them
        // But we don't have the player object here, so we'll need to handle this differently
        // For now, we'll assume the player already exists in the League
      }
    }
  };

  const recordMatch = (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ): Record<string, number> | null => {
    let eloChanges: Record<string, number> = {};

    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;

        const teamA = league.players.filter((p) => teamAIds.includes(p.id));
        const teamB = league.players.filter((p) => teamBIds.includes(p.id));

        const newRatings = calculateEloChange(teamA, teamB, winner);

        // Calculate ELO changes for return
        [...teamA, ...teamB].forEach((player) => {
          const oldElo = player.elo;
          const newElo = newRatings[player.id];
          eloChanges[player.id] = newElo - oldElo;
        });

        // Update players
        const updatedPlayers = league.players.map((player) => {
          if (
            !newRatings[player.id] &&
            !teamAIds.includes(player.id) &&
            !teamBIds.includes(player.id)
          ) {
            return player;
          }

          const isTeamA = teamAIds.includes(player.id);
          const isTeamB = teamBIds.includes(player.id);

          // If player wasn't in the match, skip deep update (though logic above handles it)
          if (!isTeamA && !isTeamB) return player;

          const isWinner =
            (winner === "A" && isTeamA) || (winner === "B" && isTeamB);

          return {
            ...player,
            elo: newRatings[player.id],
            matchesPlayed: player.matchesPlayed + 1,
            wins: player.wins + (isWinner ? 1 : 0),
            losses: player.losses + (isWinner ? 0 : 1),
            streak: isWinner
              ? player.streak > 0
                ? player.streak + 1
                : 1
              : player.streak < 0
              ? player.streak - 1
              : -1,
          };
        });

        const newMatch: Match = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          teamA: teamAIds,
          teamB: teamBIds,
          scoreA: winner === "A" ? 10 : 0,
          scoreB: winner === "B" ? 10 : 0,
          eloChanges: eloChanges,
          // Associate creator based on auth state
          created_by_user_id: isAuthenticated && user ? user.id : null,
          created_by_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
        };

        return {
          ...league,
          players: updatedPlayers,
          matches: [newMatch, ...league.matches],
        };
      })
    );

    return eloChanges;
  };

  const recordTournamentMatch = (
    tournamentId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ): Record<string, number> | null => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return null;

    // Get players from the League (if linked) or create temporary players for autonomous tournaments
    let tournamentPlayers: Player[] = [];
    if (tournament.leagueId) {
      const league = leagues.find((l) => l.id === tournament.leagueId);
      if (league) {
        tournamentPlayers = league.players.filter((p) =>
          tournament.playerIds.includes(p.id)
        );
      }
    }

    const teamA = tournamentPlayers.filter((p) => teamAIds.includes(p.id));
    const teamB = tournamentPlayers.filter((p) => teamBIds.includes(p.id));

    const newRatings = calculateEloChange(teamA, teamB, winner);
    let eloChanges: Record<string, number> = {};

    [...teamA, ...teamB].forEach((player) => {
      const oldElo = player.elo;
      const newElo = newRatings[player.id];
      eloChanges[player.id] = newElo - oldElo;
    });

    // Add match to Tournament
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      teamA: teamAIds,
      teamB: teamBIds,
      scoreA: winner === "A" ? 10 : 0,
      scoreB: winner === "B" ? 10 : 0,
      eloChanges: eloChanges,
      // Associate creator based on auth state
      created_by_user_id: isAuthenticated && user ? user.id : null,
      created_by_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
    };

    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id !== tournamentId) return t;
        return {
          ...t,
          matches: [newMatch, ...t.matches],
        };
      })
    );

    // If Tournament is linked to a League, also update League players and matches
    if (tournament.leagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== tournament.leagueId) return league;

          const updatedPlayers = league.players.map((player) => {
            if (
              !newRatings[player.id] &&
              !teamAIds.includes(player.id) &&
              !teamBIds.includes(player.id)
            ) {
              return player;
            }

            const isTeamA = teamAIds.includes(player.id);
            const isTeamB = teamBIds.includes(player.id);
            if (!isTeamA && !isTeamB) return player;

            const isWinner =
              (winner === "A" && isTeamA) || (winner === "B" && isTeamB);

            return {
              ...player,
              elo: newRatings[player.id],
              matchesPlayed: player.matchesPlayed + 1,
              wins: player.wins + (isWinner ? 1 : 0),
              losses: player.losses + (isWinner ? 0 : 1),
              streak: isWinner
                ? player.streak > 0
                  ? player.streak + 1
                  : 1
                : player.streak < 0
                ? player.streak - 1
                : -1,
            };
          });

          return {
            ...league,
            players: updatedPlayers,
            matches: [newMatch, ...league.matches],
          };
        })
      );
    }

    return eloChanges;
  };

  // Calculate local ranking for a Tournament (based only on Tournament matches, starting from base ELO)
  const getTournamentLocalRanking = (tournamentId: string): Player[] => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return [];

    // Get base players from League or create temporary ones
    let basePlayers: Player[] = [];
    if (tournament.leagueId) {
      const league = leagues.find((l) => l.id === tournament.leagueId);
      if (league) {
        basePlayers = league.players.filter((p) =>
          tournament.playerIds.includes(p.id)
        );
      }
    }

    // Start from base ELO (1000 for local ranking, reset at each Tournament)
    // We use the League ELO as starting point, but calculate changes only from Tournament matches
    let localPlayers: Player[] = basePlayers.map((p) => ({
      ...p,
      elo: 1000, // Reset to 1000 for local ranking
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    }));

    // Replay all Tournament matches in chronological order to calculate local ranking
    const sortedMatches = [...tournament.matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match) => {
      const teamA = localPlayers.filter((p) => match.teamA.includes(p.id));
      const teamB = localPlayers.filter((p) => match.teamB.includes(p.id));
      const winner = match.scoreA > match.scoreB ? "A" : "B";
      const newRatings = calculateEloChange(teamA, teamB, winner);

      // Update local players
      localPlayers = localPlayers.map((player) => {
        const isTeamA = match.teamA.includes(player.id);
        const isTeamB = match.teamB.includes(player.id);

        if (!isTeamA && !isTeamB) return player;

        const isWinner =
          (winner === "A" && isTeamA) || (winner === "B" && isTeamB);
        const newElo = newRatings[player.id] || player.elo;

        return {
          ...player,
          elo: newElo,
          matchesPlayed: player.matchesPlayed + 1,
          wins: player.wins + (isWinner ? 1 : 0),
          losses: player.losses + (isWinner ? 0 : 1),
          streak: isWinner
            ? player.streak > 0
              ? player.streak + 1
              : 1
            : player.streak < 0
            ? player.streak - 1
            : -1,
        };
      });
    });

    return localPlayers.sort((a, b) => b.elo - a.elo);
  };

  // Calculate global ranking for a League (includes all matches, including Tournament matches)
  const getLeagueGlobalRanking = (leagueId: string): Player[] => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return [];

    // League ranking is just the current ELO of players (already updated by all matches)
    return [...league.players].sort((a, b) => b.elo - a.elo);
  };

  const updateLeague = (
    leagueId: string,
    name: string,
    type: "event" | "season"
  ) => {
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return { ...league, name, type };
      })
    );
  };

  const updateTournament = (
    tournamentId: string,
    name: string,
    date: string
  ) => {
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        return { ...tournament, name, date };
      })
    );
  };

  const updatePlayer = (leagueId: string, playerId: string, name: string) => {
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return {
          ...league,
          players: league.players.map((player) =>
            player.id === playerId ? { ...player, name } : player
          ),
        };
      })
    );
  };

  const deletePlayer = (leagueId: string, playerId: string) => {
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return {
          ...league,
          players: league.players.filter((p) => p.id !== playerId),
          matches: league.matches.filter(
            (m) => !m.teamA.includes(playerId) && !m.teamB.includes(playerId)
          ),
        };
      })
    );

    // Also remove from tournaments
    setTournaments((prev) =>
      prev.map((tournament) => ({
        ...tournament,
        playerIds: tournament.playerIds.filter((id) => id !== playerId),
      }))
    );
  };

  return (
    <LeagueContext.Provider
      value={{
        leagues,
        tournaments,
        currentLeague,
        currentTournament,
        createLeague,
        createTournament,
        selectLeague,
        selectTournament,
        associateTournamentToLeague,
        addPlayer,
        addPlayerToTournament,
        recordMatch,
        recordTournamentMatch,
        deleteLeague,
        deleteTournament,
        toggleTournamentStatus,
        updateLeague,
        updateTournament,
        updatePlayer,
        deletePlayer,
        getTournamentLocalRanking,
        getLeagueGlobalRanking,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};
