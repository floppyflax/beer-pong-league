/**
 * LeagueContext - Global Application Data Context
 * 
 * ⚠️ NAMING NOTE: Despite the name "LeagueContext", this context manages ALL application data:
 * - Leagues (ligues): Season-long or event-based player groups
 * - Tournaments (tournois): Individual competitions with matches
 * - Players: Participants in leagues and tournaments
 * - Matches: Game results and ELO calculations
 * 
 * The name is historical (from when only leagues existed) but kept for backward compatibility.
 * Consider this as "AppDataContext" or "GameContext" conceptually.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import { League, Player, Match, Tournament } from "../types";
import { calculateEloChange } from "../utils/elo";
import { useAuth } from "../hooks/useAuth";
import { useIdentity } from "../hooks/useIdentity";
import { databaseService } from "../services/DatabaseService";
import { migrationService } from "../services/MigrationService";
import { localUserService } from "../services/LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

/**
 * Global context interface for managing leagues, tournaments, players, and matches.
 * 
 * Note: Despite being called "LeagueContext", this manages both leagues AND tournaments.
 */
interface LeagueContextType {
  leagues: League[];
  tournaments: Tournament[];
  currentLeague: League | null;
  currentTournament: Tournament | null;
  isLoadingInitialData: boolean;
  reloadData: () => Promise<void>;
  createLeague: (name: string, type: "event" | "season") => Promise<string>;
  createTournament: (
    name: string,
    date: string,
    format: '1v1' | '2v2' | '3v3' | 'libre',
    location: string | undefined,
    leagueId: string | null,
    playerIds: string[],
    antiCheatEnabled?: boolean
  ) => Promise<string>;
  selectLeague: (id: string) => void;
  selectTournament: (id: string) => void;
  associateTournamentToLeague: (tournamentId: string, leagueId: string) => void;
  addPlayer: (leagueId: string, name: string) => Promise<void>;
  addPlayerToTournament: (tournamentId: string, playerId: string) => void;
  addAnonymousPlayerToTournament: (tournamentId: string, playerName: string) => Promise<string>;
  recordMatch: (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ) => Promise<Record<string, number> | null>;
  recordTournamentMatch: (
    tournamentId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    scores?: { scoreA: number; scoreB: number },
    participantsOverride?: Player[]
  ) => Promise<Record<string, number> | null>;
  deleteLeague: (id: string) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  toggleTournamentStatus: (tournamentId: string) => Promise<void>;
  updateLeague: (
    leagueId: string,
    name: string,
    type: "event" | "season"
  ) => Promise<void>;
  updateTournament: (
    tournamentId: string, 
    name: string, 
    date: string, 
    antiCheatEnabled?: boolean,
    format?: '1v1' | '2v2' | '3v3' | 'libre'
  ) => Promise<void>;
  updatePlayer: (leagueId: string, playerId: string, name: string) => Promise<void>;
  deletePlayer: (leagueId: string, playerId: string) => Promise<void>;
  getTournamentLocalRanking: (tournamentId: string, participantsOverride?: Player[]) => Player[];
  getLeagueGlobalRanking: (leagueId: string) => Player[];
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

/**
 * Hook to access global application data (leagues, tournaments, players, matches).
 * 
 * Despite the name "useLeague", this hook provides access to ALL app data,
 * including both leagues and tournaments.
 * 
 * @example
 * const { leagues, tournaments, reloadData } = useLeague();
 */
export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
};

/**
 * Global data provider for the application.
 * 
 * Manages state and operations for:
 * - Leagues: Long-term player groups with rankings
 * - Tournaments: Individual competitions 
 * - Players: Participants with ELO ratings
 * - Matches: Game results and history
 * 
 * Synchronizes data between localStorage (cache) and Supabase (backend).
 */
export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  // Get auth and identity info
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { localUser, isLoading: identityLoading } = useIdentity();

  // Initialize from localStorage for immediate display (optimistic)
  // Note: These will be filtered by user when data loads from Supabase
  const [leagues, setLeagues] = useState<League[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(() => {
    return localStorage.getItem("bpl_current_league_id");
  });

  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(
    () => {
      return localStorage.getItem("bpl_current_tournament_id");
    }
  );

  // Loading state for initial data fetch
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  // Extract primitive values to avoid unnecessary re-renders
  const userId = isAuthenticated && user ? user.id : undefined;
  const anonymousUserId = !isAuthenticated && localUser ? localUser.anonymousUserId : undefined;

  // Extracted function to load data from Supabase (reusable) - memoized to prevent re-creation
  const loadDataFromSupabase = useCallback(async () => {
    // Wait for auth and identity to be ready
    if (authLoading || identityLoading) {
      return;
    }

    setIsLoadingInitialData(true);

    try {
      // SECURITY: If user has no identity, clear all data and return empty
      if (!userId && !anonymousUserId) {
        console.log('🔒 No user identity - clearing all data for security');
        setLeagues([]);
        setTournaments([]);
        localStorage.removeItem("bpl_leagues");
        localStorage.removeItem("bpl_tournaments");
        setIsLoadingInitialData(false);
        return;
      }

      // Step 1: Migrate localStorage data to Supabase if not already done
      if (!migrationService.isMigrationDone()) {
        const migrationToast = toast.loading('Migration des données en cours...');
        const migrationResult = await migrationService.migrateLocalStorageToSupabase();
        
        if (migrationResult.error) {
          toast.error('Erreur lors de la migration', { id: migrationToast });
          console.error('Migration error:', migrationResult.error);
        } else if (migrationResult.leaguesMigrated > 0 || migrationResult.tournamentsMigrated > 0) {
          toast.success(
            `${migrationResult.leaguesMigrated} ligues et ${migrationResult.tournamentsMigrated} tournois migrés`,
            { id: migrationToast }
          );
        } else {
          toast.dismiss(migrationToast);
        }
      }

      // Step 2: Load data from Supabase
      const [loadedLeagues, loadedTournaments] = await Promise.all([
        databaseService.loadLeagues(userId, anonymousUserId),
        databaseService.loadTournaments(userId, anonymousUserId),
      ]);

      // Step 3: Filter localStorage data by current user before merging
      // This ensures we don't mix data from different users
      const localStorageLeagues = JSON.parse(localStorage.getItem("bpl_leagues") || "[]") as League[];
      const localStorageTournaments = JSON.parse(localStorage.getItem("bpl_tournaments") || "[]") as Tournament[];

      // Filter localStorage data by current user
      const filteredLocalStorageLeagues = localStorageLeagues.filter((league) => {
        if (userId) {
          return league.creator_user_id === userId;
        } else if (anonymousUserId) {
          return league.creator_anonymous_user_id === anonymousUserId;
        }
        return false; // If no user ID, don't include localStorage data
      });

      const filteredLocalStorageTournaments = localStorageTournaments.filter((tournament) => {
        if (userId) {
          return tournament.creator_user_id === userId;
        } else if (anonymousUserId) {
          return tournament.creator_anonymous_user_id === anonymousUserId;
        }
        return false; // If no user ID, don't include localStorage data
      });

      // Merge strategy: Use Supabase data if available, otherwise use filtered localStorage
      const mergedLeagues = loadedLeagues.length > 0 
        ? loadedLeagues 
        : filteredLocalStorageLeagues;
      
      const mergedTournaments = loadedTournaments.length > 0 
        ? loadedTournaments 
        : filteredLocalStorageTournaments;

      // Update state
      setLeagues(mergedLeagues);
      setTournaments(mergedTournaments);

      // Update localStorage cache
      localStorage.setItem("bpl_leagues", JSON.stringify(mergedLeagues));
      localStorage.setItem("bpl_tournaments", JSON.stringify(mergedTournaments));

      if (mergedLeagues.length > 0 || mergedTournaments.length > 0) {
        console.log(`✅ Loaded ${mergedLeagues.length} leagues and ${mergedTournaments.length} tournaments from Supabase`);
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      // On error, keep localStorage data (already loaded in initial state)
      console.log('⚠️ Using localStorage data as fallback');
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [userId, anonymousUserId, authLoading, identityLoading]);

  // Load data from Supabase on mount and when auth/identity changes
  // Using primitive values (userId, anonymousUserId) instead of objects (user, localUser)
  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  // Keep localStorage in sync with state (as cache)
  useEffect(() => {
    if (!isLoadingInitialData) {
      localStorage.setItem("bpl_leagues", JSON.stringify(leagues));
    }
  }, [leagues, isLoadingInitialData]);

  useEffect(() => {
    if (!isLoadingInitialData) {
      localStorage.setItem("bpl_tournaments", JSON.stringify(tournaments));
    }
  }, [tournaments, isLoadingInitialData]);

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

  const createLeague = async (name: string, type: "event" | "season") => {
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
    
    // Save to Supabase
    try {
      await databaseService.saveLeague(newLeague);
      toast.success(`Ligue "${name}" créée avec succès`);
    } catch (error) {
      console.error('Error saving league to Supabase:', error);
      toast.error('Erreur lors de la sauvegarde de la ligue');
    }
    
    return newLeague.id;
  };

  const createTournament = async (
    name: string,
    date: string,
    format: '1v1' | '2v2' | '3v3' | 'libre',
    location: string | undefined,
    leagueId: string | null,
    playerIds: string[],
    antiCheatEnabled: boolean = false
  ) => {
    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name,
      date,
      format,
      location,
      leagueId,
      createdAt: new Date().toISOString(),
      playerIds,
      matches: [],
      isFinished: false,
      // Associate creator based on auth state
      creator_user_id: isAuthenticated && user ? user.id : null,
      creator_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
      anti_cheat_enabled: antiCheatEnabled,
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
    
    // Save to Supabase
    try {
      await databaseService.saveTournament(newTournament);
      toast.success(`Tournoi "${name}" créé avec succès`);
    } catch (error) {
      console.error('Error saving tournament to Supabase:', error);
      toast.error('Erreur lors de la sauvegarde du tournoi');
    }
    
    return newTournament.id;
  };

  const selectTournament = (id: string) => {
    setCurrentTournamentId(id);
  };

  const associateTournamentToLeague = (
    tournamentId: string,
    leagueId: string
  ) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    const oldLeagueId = tournament?.leagueId;

    // Update tournament
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        return { ...tournament, leagueId: leagueId || null };
      })
    );

    // Remove from old league if exists
    if (oldLeagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== oldLeagueId) return league;
          return {
            ...league,
            tournaments: (league.tournaments || []).filter((id) => id !== tournamentId),
          };
        })
      );
    }

    // Add to new league if provided
    if (leagueId) {
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
    }
  };

  const deleteTournament = async (id: string) => {
    // Delete from Supabase
    try {
      await databaseService.deleteTournament(id);
    } catch (error) {
      console.error('Error deleting tournament from Supabase:', error);
      toast.error('Erreur lors de la suppression du tournoi');
      return;
    }

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
    toast.success('Tournoi supprimé avec succès');
  };

  const toggleTournamentStatus = async (tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const newStatus = !tournament.isFinished;
    
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        return { ...tournament, isFinished: newStatus };
      })
    );

    // Update in Supabase
    try {
      await databaseService.toggleTournamentStatus(tournamentId, newStatus);
      toast.success(newStatus ? 'Tournoi clôturé' : 'Tournoi rouvert');
    } catch (error) {
      console.error('Error toggling tournament status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const selectLeague = (id: string) => {
    setCurrentLeagueId(id);
  };

  const deleteLeague = async (id: string) => {
    setLeagues((prev) => prev.filter((l) => l.id !== id));
    if (currentLeagueId === id) {
      setCurrentLeagueId(null);
    }
    
    // Delete from Supabase
    try {
      await databaseService.deleteLeague(id);
      toast.success('Ligue supprimée');
    } catch (error) {
      console.error('Error deleting league:', error);
      toast.error('Erreur lors de la suppression de la ligue');
    }
  };

  const addPlayer = async (leagueId: string, name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      elo: 1000, // Starting ELO
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    };

    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return {
          ...league,
          players: [...league.players, newPlayer],
        };
      })
    );

    // Save to Supabase
    try {
      await databaseService.addPlayerToLeague(
        leagueId,
        newPlayer,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null
      );
      toast.success(`Joueur "${name}" ajouté`);
    } catch (error) {
      console.error('Error adding player to league:', error);
      toast.error('Erreur lors de l\'ajout du joueur');
    }
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

  const addAnonymousPlayerToTournament = async (
    tournamentId: string,
    playerName: string
  ): Promise<string> => {
    // Get or create local user identity
    let localUser = localUserService.getLocalUser();
    if (!localUser) {
      const deviceFingerprint = getDeviceFingerprint();
      localUser = localUserService.createLocalUser(playerName, deviceFingerprint);
    }

    // Add anonymous player to tournament via database service
    const playerId = await databaseService.addAnonymousPlayerToTournament(
      tournamentId,
      playerName,
      localUser.anonymousUserId
    );

    // Update tournament in context
    addPlayerToTournament(tournamentId, playerId);

    return playerId;
  };

  const recordMatch = async (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B"
  ): Promise<Record<string, number> | null> => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return null;

    const teamA = league.players.filter((p) => teamAIds.includes(p.id));
    const teamB = league.players.filter((p) => teamBIds.includes(p.id));

    const newRatings = calculateEloChange(teamA, teamB, winner);

    // Calculate ELO changes for return and for DB
    const eloChanges: Record<string, number> = {};
    const eloChangesForDB: Record<string, { before: number; after: number; change: number }> = {};
    
    [...teamA, ...teamB].forEach((player) => {
      const oldElo = player.elo;
      const newElo = newRatings[player.id];
      eloChanges[player.id] = newElo - oldElo;
      eloChangesForDB[player.id] = {
        before: oldElo,
        after: newElo,
        change: newElo - oldElo,
      };
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
      created_by_user_id: isAuthenticated && user ? user.id : null,
      created_by_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
    };

    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return {
          ...league,
          players: updatedPlayers,
          matches: [newMatch, ...league.matches],
        };
      })
    );

    // Save to Supabase
    try {
      await databaseService.recordMatch(
        leagueId,
        newMatch,
        eloChangesForDB,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null
      );
      toast.success('Match enregistré !');
    } catch (error) {
      console.error('Error recording match:', error);
      toast.error('Erreur lors de l\'enregistrement du match');
    }

    return eloChanges;
  };

  const recordTournamentMatch = async (
    tournamentId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    scores?: { scoreA: number; scoreB: number },
    participantsOverride?: Player[]
  ): Promise<Record<string, number> | null> => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return null;

    // Use participantsOverride (tournament_players) when provided, else fallback to league.players
    let tournamentPlayers: Player[] = [];
    if (participantsOverride && participantsOverride.length > 0) {
      tournamentPlayers = participantsOverride;
    } else if (tournament.leagueId) {
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
    const eloChanges: Record<string, number> = {};
    const eloChangesForDB: Record<string, { before: number; after: number; change: number }> = {};

    [...teamA, ...teamB].forEach((player) => {
      const oldElo = player.elo;
      const newElo = newRatings[player.id];
      eloChanges[player.id] = newElo - oldElo;
      eloChangesForDB[player.id] = {
        before: oldElo,
        after: newElo,
        change: newElo - oldElo,
      };
    });

    // Use provided scores or calculate from winner
    const scoreA = scores?.scoreA ?? (winner === "A" ? 10 : 0);
    const scoreB = scores?.scoreB ?? (winner === "B" ? 10 : 0);

    // Add match to Tournament
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      teamA: teamAIds,
      teamB: teamBIds,
      scoreA: scoreA,
      scoreB: scoreB,
      eloChanges: eloChanges,
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
    // When using participantsOverride, teamAIds/teamBIds are tournament_players.id - map to league_players via leaguePlayerId
    if (tournament.leagueId) {
      const participantsWithLeague = participantsOverride as (Player & { leaguePlayerId?: string })[];
      const leaguePlayerIdsInMatch = new Set(
        [...teamAIds, ...teamBIds].flatMap((tpId) => {
          const p = participantsWithLeague?.find((x) => x.id === tpId);
          return p?.leaguePlayerId ? [p.leaguePlayerId] : [];
        }),
      );
      const leaguePlayerIdToTpId = new Map<string, string>();
      participantsWithLeague?.forEach((p) => {
        if (p.leaguePlayerId) leaguePlayerIdToTpId.set(p.leaguePlayerId, p.id);
      });

      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== tournament.leagueId) return league;

          const updatedPlayers = league.players.map((player) => {
            const tpId = leaguePlayerIdToTpId.get(player.id);
            const inMatch = leaguePlayerIdsInMatch.has(player.id);
            const newElo = tpId ? newRatings[tpId] : newRatings[player.id];
            if (!inMatch && !newElo && !teamAIds.includes(player.id) && !teamBIds.includes(player.id)) {
              return player;
            }
            if (!inMatch && !leaguePlayerIdsInMatch.has(player.id)) return player;

            const isTeamA = tpId ? teamAIds.includes(tpId) : teamAIds.includes(player.id);
            const isTeamB = tpId ? teamBIds.includes(tpId) : teamBIds.includes(player.id);
            if (!isTeamA && !isTeamB) return player;

            const isWinner =
              (winner === "A" && isTeamA) || (winner === "B" && isTeamB);
            const eloUpdate = newElo ?? player.elo;

            return {
              ...player,
              elo: eloUpdate,
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

    // Save to Supabase - build mapping for league_players update when using tournament_players.id
    const tournamentPlayerIdToLeaguePlayerId: Record<string, string> = {};
    (participantsOverride as (Player & { leaguePlayerId?: string })[])?.forEach((p) => {
      if (p.leaguePlayerId) tournamentPlayerIdToLeaguePlayerId[p.id] = p.leaguePlayerId;
    });

    try {
      await databaseService.recordTournamentMatch(
        tournamentId,
        newMatch,
        eloChangesForDB,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null,
        tournamentPlayerIdToLeaguePlayerId
      );
      toast.success('Match enregistré !');
    } catch (error) {
      console.error('Error recording tournament match:', error);
      toast.error('Erreur lors de l\'enregistrement du match');
    }

    return eloChanges;
  };

  // Calculate local ranking for a Tournament (based only on Tournament matches, starting from base ELO)
  // participantsOverride: when provided (from loadTournamentParticipants), use these - their ids match match.teamA/teamB (tournament_players.id)
  const getTournamentLocalRanking = (tournamentId: string, participantsOverride?: Player[]): Player[] => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return [];

    // Get base players: use override (tournament_players) when provided, else fallback to league.players filtered by tournament.playerIds
    let basePlayers: Player[] = [];
    if (participantsOverride && participantsOverride.length > 0) {
      basePlayers = participantsOverride;
    } else if (tournament.leagueId) {
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

  const updateLeague = async (
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

    // Update in Supabase
    try {
      await databaseService.updateLeague(leagueId, name, type);
      toast.success('Ligue mise à jour');
    } catch (error) {
      console.error('Error updating league:', error);
      toast.error('Erreur lors de la mise à jour de la ligue');
    }
  };

  const updateTournament = async (
    tournamentId: string,
    name: string,
    date: string,
    antiCheatEnabled?: boolean,
    format?: '1v1' | '2v2' | '3v3' | 'libre'
  ) => {
    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== tournamentId) return tournament;
        const updates: Partial<Tournament> = { name, date };
        if (antiCheatEnabled !== undefined) {
          updates.anti_cheat_enabled = antiCheatEnabled;
        }
        if (format !== undefined) {
          updates.format = format;
        }
        return { ...tournament, ...updates };
      })
    );

    // Update in Supabase
    try {
      await databaseService.updateTournament(tournamentId, name, date, antiCheatEnabled, format);
      toast.success('Tournoi mis à jour');
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Erreur lors de la mise à jour du tournoi');
    }
  };

  const updatePlayer = async (leagueId: string, playerId: string, name: string) => {
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

    // Update in Supabase
    try {
      await databaseService.updatePlayer(leagueId, playerId, { name });
      toast.success('Joueur mis à jour');
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Erreur lors de la mise à jour du joueur');
    }
  };

  const deletePlayer = async (leagueId: string, playerId: string) => {
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

    // Delete from Supabase
    try {
      await databaseService.deletePlayer(leagueId, playerId);
      toast.success('Joueur supprimé');
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Erreur lors de la suppression du joueur');
    }
  };

  return (
    <LeagueContext.Provider
      value={{
        leagues,
        tournaments,
        currentLeague,
        currentTournament,
        isLoadingInitialData,
        reloadData: loadDataFromSupabase,
        createLeague,
        createTournament,
        selectLeague,
        selectTournament,
        associateTournamentToLeague,
        addPlayer,
        addPlayerToTournament,
        addAnonymousPlayerToTournament,
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
