/**
 * LeagueContext - Global Application Data Context
 * 
 * ⚠️ NAMING NOTE: Despite the name "LeagueContext", this context manages ALL application data:
 * - Leagues (ligues): Season-long or event-based player groups
 * - Events (tournois): Individual competitions with matches
 * - Players: Participants in leagues and events
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
import { League, Player, Match, Event } from "../types";
import { calculateEloChange } from "../utils/elo";
import { useAuth } from "../hooks/useAuth";
import { useIdentity } from "../hooks/useIdentity";
import {
  databaseService,
  type EventUpdates,
  type LeagueUpdates,
} from "../services/DatabaseService";
import { migrationService } from "../services/MigrationService";
import { localUserService } from "../services/LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";
import { generateEventCode } from "../utils/eventCode";

/**
 * Mig 029 — payload de création d'une league.
 * Tous les champs hors `name` et `type` sont optionnels et `null` = "non
 * configuré" (la league reste active dès création, sans limite, etc.).
 */
export interface CreateLeagueInput {
  name: string;
  type: 'one-shot' | 'season';
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  seasonDurationDays: number | null;
  maxPlayers: number | null;
  isPrivate: boolean;
  antiCheatEnabled: boolean;
  /**
   * Mig 032 — Who validates scores when antiCheatEnabled = TRUE on a
   * league-only match. Default 'opponent' if omitted.
   */
  scoreValidator?: 'opponent' | 'admin';
  defaultFormat: '1v1' | '2v2' | '3v3' | 'libre' | null;
}

/**
 * Mig 030 — résultat d'un `recordMatch` / `recordEventMatch`.
 *   - `status`: 'confirmed' = ELO appliqué tout de suite.
 *              'pending'   = anti-cheat ON, en attente de validation.
 *   - `eloChanges`: preview client (calculée optimistiquement). Vide
 *                   pour les matchs pending (rien à afficher tant que la
 *                   confirmation n'est pas passée).
 */
export interface RecordMatchOutcome {
  /** ID of the inserted match row — needed by post-record flows (photo
   *  finish wizard, contest review, etc.). */
  matchId: string;
  /** Mig 030 — `pending` when the parent event/league has anti-cheat on. */
  status: 'confirmed' | 'pending';
  /** ELO deltas keyed by player id. Empty record for pending matches
   *  (apply_match_elo is dispatched by confirm_match). */
  eloChanges: Record<string, number>;
}

/**
 * Global context interface for managing leagues, events, players, and matches.
 *
 * Note: Despite being called "LeagueContext", this manages both leagues AND events.
 */
interface LeagueContextType {
  leagues: League[];
  events: Event[];
  currentLeague: League | null;
  currentEvent: Event | null;
  isLoadingInitialData: boolean;
  /** Error message when initial data load fails (e.g. network). Null when load succeeded. */
  loadError: string | null;
  reloadData: () => Promise<void>;
  createLeague: (input: CreateLeagueInput) => Promise<string>;
  createEvent: (
    name: string,
    date: string,
    format: '1v1' | '2v2' | '3v3' | 'libre',
    location: string | undefined,
    leagueId: string | null,
    playerIds: string[],
    antiCheatEnabled?: boolean,
    scoreValidator?: 'opponent' | 'admin'
  ) => Promise<string>;
  selectLeague: (id: string) => void;
  selectEvent: (id: string) => void;
  associateEventToLeague: (eventId: string, leagueId: string) => Promise<void>;
  addPlayer: (leagueId: string, name: string) => Promise<void>;
  addPlayerToEvent: (eventId: string, playerId: string) => void;
  addAnonymousPlayerToEvent: (eventId: string, playerName: string) => Promise<string>;
  addGuestPlayerToEvent: (eventId: string, playerName: string) => Promise<string>;
  recordMatch: (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    enrichment?: { cupsRemaining?: number }
  ) => Promise<RecordMatchOutcome | null>;
  recordEventMatch: (
    eventId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    scores?: { scoreA: number; scoreB: number; cupsRemaining?: number },
    participantsOverride?: Player[]
  ) => Promise<RecordMatchOutcome | null>;
  deleteLeague: (id: string) => Promise<void>;
  // Lifecycle league (mig 028)
  pauseLeague: (leagueId: string) => Promise<void>;
  resumeLeague: (leagueId: string) => Promise<void>;
  finishLeague: (leagueId: string) => Promise<void>;
  reopenLeague: (leagueId: string) => Promise<void>;
  // Cycle de saison à 2 étapes (mig 029)
  finishCurrentLeagueSeason: (leagueId: string) => Promise<void>;
  startNewLeagueSeason: (leagueId: string) => Promise<number>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventStatus: (eventId: string) => Promise<void>;
  startEvent: (eventId: string) => Promise<void>;
  pauseEvent: (eventId: string) => Promise<void>;
  resumeEvent: (eventId: string) => Promise<void>;
  updateLeague: (
    leagueId: string,
    updates: LeagueUpdates
  ) => Promise<void>;
  updateEvent: (
    eventId: string,
    updates: EventUpdates
  ) => Promise<void>;
  updatePlayer: (leagueId: string, playerId: string, name: string) => Promise<void>;
  deletePlayer: (leagueId: string, playerId: string) => Promise<void>;
  getEventLocalRanking: (eventId: string, participantsOverride?: Player[]) => Player[];
  getLeagueGlobalRanking: (leagueId: string) => Player[];
}

// Exported (along with the type below) so the design-system showcase can
// wrap pages with a fixture-only League context (see MockProviders.tsx).
const LeagueContext = createContext<LeagueContextType | undefined>(undefined);
export { LeagueContext };
export type { LeagueContextType };

/**
 * Hook to access ALL global application data — leagues, events, players,
 * matches, and the data-sync controls. Despite the name "useLeague", this
 * is the umbrella context.
 *
 * **Prefer the focused facade hooks for new code** (cf. audit plan §2.2):
 * - `useLeagues()` — league list + CRUD + ranking
 * - `useEvents()`  — event list + CRUD + ranking + propagation
 * - `usePlayers()` — player ops (add / rename / delete / claim ghost)
 * - `useMatches()` — match recording (server-side ELO since mig 025)
 *
 * `useLeague()` itself stays available — use it when a single consumer
 * genuinely needs a wide slice of the umbrella state (e.g. the dashboard
 * orchestrator). Not deprecated, but no longer the default entry point.
 *
 * @example
 * const { leagues, events, reloadData } = useLeague();
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
 * - Events: Individual competitions 
 * - Players: Participants with ELO ratings
 * - Matches: Game results and history
 * 
 * Synchronizes data between localStorage (cache) and Supabase (backend).
 */
export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  // Get auth and identity info
  const { user, userProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { localUser, isLoading: identityLoading } = useIdentity();

  // Initialize from localStorage for immediate display (optimistic)
  // Note: These will be filtered by user when data loads from Supabase
  const [leagues, setLeagues] = useState<League[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(() => {
    return localStorage.getItem("bpl_current_league_id");
  });

  const [currentEventId, setCurrentEventId] = useState<string | null>(
    () => {
      return localStorage.getItem("bpl_current_event_id");
    }
  );

  // Loading state for initial data fetch
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);

    try {
      // SECURITY: If user has no identity, clear all data and return empty
      if (!userId && !anonymousUserId) {
        console.log('🔒 No user identity - clearing all data for security');
        setLeagues([]);
        setEvents([]);
        localStorage.removeItem("bpl_leagues");
        localStorage.removeItem("bpl_events");
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
        } else if (migrationResult.leaguesMigrated > 0 || migrationResult.eventsMigrated > 0) {
          toast.success(
            `${migrationResult.leaguesMigrated} ligues et ${migrationResult.eventsMigrated} événements migrés`,
            { id: migrationToast }
          );
        } else {
          toast.dismiss(migrationToast);
        }
      }

      // Step 2: Load data from Supabase
      const [loadedLeagues, loadedEvents] = await Promise.all([
        databaseService.loadLeagues(userId, anonymousUserId),
        databaseService.loadEvents(userId, anonymousUserId),
      ]);

      // Supabase is the source of truth as soon as it answers (here we are
      // past the auth/identity guard, so we have a userId/anonymousUserId).
      // The repositories already fall back to localStorage when Supabase is
      // not configured at all (`isSupabaseAvailable()` check at the repo
      // entry point), so `loadedLeagues`/`loadedEvents` either reflect the
      // server truth or — in offline mode — the local cache. Either way we
      // trust them directly. The previous "DB empty → keep localStorage"
      // fallback caused phantom rows when the DB had legitimately been
      // emptied (leagues deleted, account switched, stale cache from another
      // device), which then broke FK constraints when the user tried to
      // attach an event to one of these ghosts.
      setLeagues(loadedLeagues);
      setEvents(loadedEvents);

      // Refresh the local cache so a subsequent cold start sees DB truth.
      localStorage.setItem("bpl_leagues", JSON.stringify(loadedLeagues));
      localStorage.setItem("bpl_events", JSON.stringify(loadedEvents));

      if (loadedLeagues.length > 0 || loadedEvents.length > 0) {
        console.log(`✅ Loaded ${loadedLeagues.length} leagues and ${loadedEvents.length} events from Supabase`);
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Erreur lors du chargement des données'
      );
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
      localStorage.setItem("bpl_events", JSON.stringify(events));
    }
  }, [events, isLoadingInitialData]);

  useEffect(() => {
    if (currentLeagueId) {
      localStorage.setItem("bpl_current_league_id", currentLeagueId);
    } else {
      localStorage.removeItem("bpl_current_league_id");
    }
  }, [currentLeagueId]);

  useEffect(() => {
    if (currentEventId) {
      localStorage.setItem("bpl_current_event_id", currentEventId);
    } else {
      localStorage.removeItem("bpl_current_event_id");
    }
  }, [currentEventId]);

  const currentLeague = leagues.find((l) => l.id === currentLeagueId) || null;
  const currentEvent =
    events.find((t) => t.id === currentEventId) || null;

  const createLeague = async (input: CreateLeagueInput) => {
    const { name, type } = input;
    // Migration 016 — generate a 6-char join_code with collision retry
    // (mirrors CreateEvent.generateUniqueCode logic).
    let joinCode: string | undefined;
    try {
      const maxAttempts = 10;
      for (let i = 0; i < maxAttempts; i++) {
        const code = generateEventCode();
        const exists = await databaseService.leagueCodeExists(code);
        if (!exists) {
          joinCode = code;
          break;
        }
      }
    } catch (error) {
      // Non-blocking: leagues created before mig 016 had no code; if
      // generation fails (offline, RLS), keep going without one.
      console.warn('Failed to generate league join_code:', error);
    }

    // Mig 029 — la saison courante démarre au planned_start_at si fourni,
    // sinon maintenant. Permet à une league "future" d'avoir une borne ELO
    // cohérente même avant son activation.
    const nowIso = new Date().toISOString();
    const seasonStartIso = input.plannedStartAt ?? nowIso;

    const newLeague: League = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: nowIso,
      players: [],
      matches: [],
      events: [],
      joinCode,
      // Associate creator based on auth state
      creator_user_id: isAuthenticated && user ? user.id : null,
      creator_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
      anti_cheat_enabled: input.antiCheatEnabled,
      scoreValidator: input.scoreValidator ?? 'opponent',
      // Mig 028 — saison initiale
      currentSeasonNumber: 1,
      currentSeasonStartedAt: seasonStartIso,
      // Mig 029 — config à la création
      plannedStartAt: input.plannedStartAt,
      plannedEndAt: input.plannedEndAt,
      seasonDurationDays: input.seasonDurationDays,
      maxPlayers: input.maxPlayers,
      isPrivate: input.isPrivate,
      defaultFormat: input.defaultFormat,
    };
    setLeagues((prev) => [...prev, newLeague]);
    setCurrentLeagueId(newLeague.id);

    // Persist to Supabase. Échec d'écriture = fatal : on annule l'ajout
    // optimiste et on remonte l'erreur. Sinon loadDataFromSupabase écraserait
    // la ligue optimiste au reload et l'UI afficherait "Ligue introuvable".
    // L'appelant (CreateLeague) gère le toast et n'enchaîne pas la navigation.
    try {
      await databaseService.saveLeague(newLeague);
    } catch (error) {
      console.error('Error saving league to Supabase:', error);
      setLeagues((prev) => prev.filter((l) => l.id !== newLeague.id));
      setCurrentLeagueId((prev) => (prev === newLeague.id ? null : prev));
      throw error;
    }

    // La ligue est persistée. L'auto-ajout du créateur comme premier membre
    // est best-effort : un échec ne doit pas invalider la création.
    // Mirrors the event creation flow (CreateEvent.handleSubmit).
    const creatorPseudo =
      userProfile?.pseudo?.trim() ||
      localUser?.pseudo?.trim() ||
      (user?.user_metadata?.name as string | undefined) ||
      user?.email?.split('@')[0] ||
      'Joueur';
    const creatorPlayer: Player = {
      id: crypto.randomUUID(),
      name: creatorPseudo,
      elo: 1000,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    };
    try {
      await databaseService.addPlayerToLeague(
        newLeague.id,
        creatorPlayer,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null,
      );
      // Reload from Supabase so the league shows the membership with the
      // canonical players.pseudo (mig 022) rather than our fallback string,
      // and so player.id matches league_memberships.id (required by
      // downstream consumers like edit/delete).
      await loadDataFromSupabase();
    } catch (err) {
      console.error('Auto-add creator to league failed:', err);
    }

    toast.success(`Ligue "${name}" créée avec succès`);

    return newLeague.id;
  };

  const createEvent = async (
    name: string,
    date: string,
    format: '1v1' | '2v2' | '3v3' | 'libre',
    location: string | undefined,
    leagueId: string | null,
    playerIds: string[],
    antiCheatEnabled: boolean = false,
    scoreValidator: 'opponent' | 'admin' = 'opponent'
  ) => {
    const newEvent: Event = {
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
      scoreValidator,
    };
    setEvents((prev) => [...prev, newEvent]);

    // If linked to a League, add event to League's events list
    if (leagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== leagueId) return league;
          return {
            ...league,
            events: [...(league.events || []), newEvent.id],
          };
        })
      );
    }

    setCurrentEventId(newEvent.id);
    
    // Save to Supabase
    try {
      await databaseService.saveEvent(newEvent);
      toast.success(`Événement "${name}" créé avec succès`);
    } catch (error) {
      console.error('Error saving event to Supabase:', error);
      toast.error("Erreur lors de la sauvegarde de l'événement");
    }
    
    return newEvent.id;
  };

  const selectEvent = (id: string) => {
    setCurrentEventId(id);
  };

  const associateEventToLeague = async (
    eventId: string,
    leagueId: string
  ) => {
    const event = events.find((t) => t.id === eventId);
    const oldLeagueId = event?.leagueId;
    const newLeagueId = leagueId || null;

    // Persist + sync players (mig 023 — auto-add event players to league).
    try {
      await databaseService.associateEventToLeague(eventId, newLeagueId);
    } catch (err) {
      // Most common cause: the chosen league no longer exists in DB (stale
      // localStorage cache from a previous session). Surface it to the
      // caller so the UX flow can react (e.g. inform the user and continue
      // with a standalone event) instead of silently swallowing the error.
      console.error('associateEventToLeague failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      const isFkViolation = /foreign key|not present in table/i.test(message);
      if (isFkViolation) {
        toast.error("Cette ligue n'existe plus — rattachement ignoré.");
      } else {
        toast.error("Erreur lors du rattachement à la ligue");
      }
      throw err;
    }

    // Update event local state
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        return { ...event, leagueId: leagueId || null };
      })
    );

    // Remove from old league cache if exists
    if (oldLeagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== oldLeagueId) return league;
          return {
            ...league,
            events: (league.events || []).filter((id) => id !== eventId),
          };
        })
      );
    }

    // Add to new league cache if provided
    if (leagueId) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== leagueId) return league;
          if (!league.events?.includes(eventId)) {
            return {
              ...league,
              events: [...(league.events || []), eventId],
            };
          }
          return league;
        })
      );
    }

    // Refresh data so the league dashboard shows the newly synced players.
    if (leagueId) {
      void loadDataFromSupabase();
    }
  };

  const deleteEvent = async (id: string) => {
    // Delete from Supabase
    try {
      await databaseService.deleteEvent(id);
    } catch (error) {
      console.error('Error deleting event from Supabase:', error);
      toast.error("Erreur lors de la suppression de l'événement");
      return;
    }

    setEvents((prev) => {
      const event = prev.find((t) => t.id === id);
      if (event?.leagueId) {
        setLeagues((prevLeagues) =>
          prevLeagues.map((league) => {
            if (league.id === event.leagueId) {
              return {
                ...league,
                events:
                  league.events?.filter((tId) => tId !== id) || [],
              };
            }
            return league;
          })
        );
      }
      return prev.filter((t) => t.id !== id);
    });
    if (currentEventId === id) {
      setCurrentEventId(null);
    }
    toast.success("Événement supprimé avec succès");
  };

  const toggleEventStatus = async (eventId: string) => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return;

    const newStatus = !event.isFinished;

    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        return { ...event, isFinished: newStatus };
      })
    );

    // Update in Supabase
    try {
      await databaseService.toggleEventStatus(eventId, newStatus);
      toast.success(newStatus ? "Événement clôturé" : "Événement rouvert");
    } catch (error) {
      console.error('Error toggling event status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  // ── Lifecycle (mig 027) — admin start / pause / resume ───────────────────
  const startEvent = async (eventId: string) => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return;
    const now = new Date().toISOString();
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, startedAt: now, pausedAt: null } : e,
      ),
    );
    try {
      await databaseService.startEvent(eventId);
      toast.success("Événement démarré");
    } catch (error) {
      console.error('Error starting event:', error);
      toast.error("Impossible de démarrer l'événement");
    }
  };

  const pauseEvent = async (eventId: string) => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return;
    const now = new Date().toISOString();
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, pausedAt: now } : e)),
    );
    try {
      await databaseService.pauseEvent(eventId);
      toast.success("Événement mis en pause");
    } catch (error) {
      console.error('Error pausing event:', error);
      toast.error("Impossible de mettre en pause");
    }
  };

  const resumeEvent = async (eventId: string) => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return;
    const now = new Date().toISOString();
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, pausedAt: null, startedAt: e.startedAt ?? now }
          : e,
      ),
    );
    try {
      await databaseService.resumeEvent(eventId);
      toast.success("Événement repris");
    } catch (error) {
      console.error('Error resuming event:', error);
      toast.error("Impossible de reprendre l'événement");
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

  // ── Lifecycle league (mig 028) ──────────────────────────────────────────
  const pauseLeague = async (leagueId: string) => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    const now = new Date().toISOString();
    setLeagues((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, pausedAt: now } : l)),
    );
    try {
      await databaseService.pauseLeague(leagueId);
      toast.success("Ligue mise en pause");
    } catch (error) {
      console.error('Error pausing league:', error);
      toast.error("Impossible de mettre en pause");
    }
  };

  const resumeLeague = async (leagueId: string) => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    setLeagues((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, pausedAt: null } : l)),
    );
    try {
      await databaseService.resumeLeague(leagueId);
      toast.success("Ligue reprise");
    } catch (error) {
      console.error('Error resuming league:', error);
      toast.error("Impossible de reprendre la ligue");
    }
  };

  const finishLeague = async (leagueId: string) => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    const now = new Date().toISOString();
    setLeagues((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, endedAt: now } : l)),
    );
    try {
      await databaseService.finishLeague(leagueId);
      toast.success("Ligue clôturée");
    } catch (error) {
      console.error('Error finishing league:', error);
      toast.error("Impossible de clôturer la ligue");
    }
  };

  const reopenLeague = async (leagueId: string) => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    setLeagues((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, endedAt: null } : l)),
    );
    try {
      await databaseService.reopenLeague(leagueId);
      toast.success("Ligue rouverte");
    } catch (error) {
      console.error('Error reopening league:', error);
      toast.error("Impossible de rouvrir la ligue");
    }
  };

  const finishCurrentLeagueSeason = async (leagueId: string): Promise<void> => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    const now = new Date().toISOString();
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === leagueId ? { ...l, currentSeasonEndedAt: now } : l,
      ),
    );
    try {
      await databaseService.finishCurrentLeagueSeason(leagueId);
      toast.success(
        `Saison ${league.currentSeasonNumber ?? 1} close. Démarre la suivante depuis Paramètres.`,
      );
    } catch (error) {
      console.error('Error finishing current league season:', error);
      // Rollback optimistic update
      setLeagues((prev) =>
        prev.map((l) =>
          l.id === leagueId ? { ...l, currentSeasonEndedAt: null } : l,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Impossible de clore la saison",
      );
      throw error;
    }
  };

  const startNewLeagueSeason = async (leagueId: string): Promise<number> => {
    try {
      const newSeasonNumber = await databaseService.startNewLeagueSeason(leagueId);
      // La RPC reset les memberships + clear `current_season_ended_at` →
      // on recharge pour refléter l'état serveur.
      await loadDataFromSupabase();
      toast.success(`Saison ${newSeasonNumber} démarrée 🏆`);
      return newSeasonNumber;
    } catch (error) {
      console.error('Error starting new league season:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de démarrer une nouvelle saison",
      );
      throw error;
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

  const addPlayerToEvent = (eventId: string, playerId: string) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        if (event.playerIds.includes(playerId)) return event;
        return {
          ...event,
          playerIds: [...event.playerIds, playerId],
        };
      })
    );

    // If event is linked to a League, ensure player exists in League
    const event = events.find((t) => t.id === eventId);
    if (event?.leagueId) {
      const league = leagues.find((l) => l.id === event.leagueId);
      if (league && !league.players.find((p) => p.id === playerId)) {
        // Player doesn't exist in League, we need to add them
        // But we don't have the player object here, so we'll need to handle this differently
        // For now, we'll assume the player already exists in the League
      }
    }
  };

  const addAnonymousPlayerToEvent = async (
    eventId: string,
    playerName: string
  ): Promise<string> => {
    // Mig 022 unified users — use the auth user id when authenticated, otherwise
    // fall back to (or bootstrap) the anonymous local identity. Always passing
    // localUser.anonymousUserId broke FK on `players.user_id` for OTP users
    // whose anon id was never (or no longer) materialised in `public.users`.
    // (Preserved from origin PR #8.) The localUserService calls are awaited
    // because the shared service was made async during the wave 2.3 extraction
    // (mobile uses AsyncStorage, web uses localStorage — both behind the same
    // KVStorage interface).
    let resolvedUserId: string;
    if (isAuthenticated && user) {
      resolvedUserId = user.id;
    } else {
      let localUser = await localUserService.getLocalUser();
      if (!localUser) {
        const deviceFingerprint = getDeviceFingerprint();
        localUser = await localUserService.createLocalUser(playerName, deviceFingerprint);
      }
      resolvedUserId = localUser.anonymousUserId;
    }

    const playerId = await databaseService.addAnonymousPlayerToEvent(
      eventId,
      playerName,
      resolvedUserId
    );

    addPlayerToEvent(eventId, playerId);

    return playerId;
  };

  const addGuestPlayerToEvent = async (
    eventId: string,
    playerName: string
  ): Promise<string> => {
    // Crée un guest distinct (nouvel anonymous_user à chaque appel) — pour
    // l'ajout manuel de joueurs invités par l'admin du tournoi.
    const playerId = await databaseService.addGuestPlayerToEvent(
      eventId,
      playerName
    );

    addPlayerToEvent(eventId, playerId);

    return playerId;
  };

  const recordMatch = async (
    leagueId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    enrichment?: { cupsRemaining?: number }
  ): Promise<RecordMatchOutcome | null> => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return null;
    // Mig 030 — anti-cheat awareness for the optimistic client update. Admin
    // auto-confirm: the league creator's own match skips the pending queue, so
    // the optimistic state mirrors the repo and applies the ELO immediately.
    const antiCheatOn = league.anti_cheat_enabled === true;
    const callerUserId =
      isAuthenticated && user ? user.id : localUser?.anonymousUserId ?? null;
    const callerIsAdmin = Boolean(
      callerUserId && league.creator_user_id === callerUserId,
    );
    const effectiveAntiCheat = antiCheatOn && !callerIsAdmin;

    const teamA = league.players.filter((p) => teamAIds.includes(p.id));
    const teamB = league.players.filter((p) => teamBIds.includes(p.id));

    const newRatings = calculateEloChange(teamA, teamB, winner, 'league');

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

    const cupsRem = enrichment?.cupsRemaining;
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      teamA: teamAIds,
      teamB: teamBIds,
      // Score = gobelets restants : le vainqueur marque ses gobelets restants
      // (1..10), le perdant 0. Fallback 10 (victoire « parfaite ») si la
      // saisie ne fournit pas le détail. cups_remaining reste null : le score
      // encode déjà l'info, on ne la duplique pas.
      scoreA: winner === "A" ? (cupsRem ?? 10) : 0,
      scoreB: winner === "B" ? (cupsRem ?? 10) : 0,
      // Pending matches don't expose preview deltas — they only land after
      // confirmation.
      eloChanges: effectiveAntiCheat ? undefined : eloChanges,
      cups_remaining: null,
      created_by_user_id: isAuthenticated && user ? user.id : null,
      created_by_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
      status: effectiveAntiCheat ? 'pending' : 'confirmed',
    };

    // Optimistic local mutation: when anti-cheat is OFF (or the caller is the
    // admin) we apply the stats immediately. When ON for a non-admin, the
    // match is pending — keep player stats unchanged until confirmation lands.
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        return {
          ...league,
          players: effectiveAntiCheat ? league.players : updatedPlayers,
          matches: [newMatch, ...league.matches],
        };
      })
    );

    // Save to Supabase
    try {
      const result = await databaseService.recordMatch(
        leagueId,
        newMatch,
        eloChangesForDB,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null
      );
      // Toast is owned by the caller (RecordMatch) so the message can adapt
      // to the pending vs confirmed status.
      return {
        matchId: newMatch.id,
        status: result.status,
        eloChanges: result.status === 'confirmed' ? eloChanges : {},
      };
    } catch (error) {
      console.error('Error recording match:', error);
      toast.error('Erreur lors de l\'enregistrement du match');
      return null;
    }
  };

  const recordEventMatch = async (
    eventId: string,
    teamAIds: string[],
    teamBIds: string[],
    winner: "A" | "B",
    scores?: { scoreA: number; scoreB: number; cupsRemaining?: number },
    participantsOverride?: Player[]
  ): Promise<RecordMatchOutcome | null> => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return null;

    // Mig 030 — pending vs confirmed decision. The repo will do a fresh
    // server check, but we mirror it here so the optimistic state stays
    // consistent and the UI doesn't flash an ELO delta for a pending match.
    const parentLeague = event.leagueId
      ? leagues.find((l) => l.id === event.leagueId)
      : null;
    const antiCheatOn =
      event.anti_cheat_enabled === true ||
      parentLeague?.anti_cheat_enabled === true;
    // Admin auto-confirm: the event creator (or linked-league creator) skips
    // the pending queue for their own matches. Mirror of the repo + confirm_match.
    const callerUserId =
      isAuthenticated && user ? user.id : localUser?.anonymousUserId ?? null;
    const callerIsAdmin = Boolean(
      callerUserId &&
        (event.creator_user_id === callerUserId ||
          parentLeague?.creator_user_id === callerUserId),
    );
    const effectiveAntiCheat = antiCheatOn && !callerIsAdmin;

    // Use participantsOverride (event_players) when provided, else fallback to league.players
    let eventPlayers: Player[] = [];
    if (participantsOverride && participantsOverride.length > 0) {
      eventPlayers = participantsOverride;
    } else if (event.leagueId) {
      const league = leagues.find((l) => l.id === event.leagueId);
      if (league) {
        eventPlayers = league.players.filter((p) =>
          event.playerIds.includes(p.id)
        );
      }
    }

    const teamA = eventPlayers.filter((p) => teamAIds.includes(p.id));
    const teamB = eventPlayers.filter((p) => teamBIds.includes(p.id));

    // ── Event ELO delta — uses event_memberships.elo (provided via
    //    participantsOverride from loadEventParticipants since mig 023).
    const newEventRatings = calculateEloChange(teamA, teamB, winner, 'event');
    const eloChanges: Record<string, number> = {};
    const eventEloChangesDB: Record<string, { before: number; after: number; change: number }> = {};

    [...teamA, ...teamB].forEach((player) => {
      const oldElo = player.elo;
      const newElo = newEventRatings[player.id];
      eloChanges[player.id] = newElo - oldElo;
      eventEloChangesDB[player.id] = {
        before: oldElo,
        after: newElo,
        change: newElo - oldElo,
      };
    });

    // ── League ELO delta — only when event is league-linked AND propagation
    //    is enabled (default true). Computed independently from the league's
    //    own baseline (league_memberships.elo).
    const propagates = event.propagatesToLeagueElo !== false;
    let leagueEloChangesDB: Record<string, { before: number; after: number; change: number }> | undefined;

    const participantsWithLeague = participantsOverride as (Player & { leaguePlayerId?: string })[] | undefined;
    const tpIdToLpId = new Map<string, string>();
    const lpIdToTpId = new Map<string, string>();
    participantsWithLeague?.forEach((p) => {
      if (p.leaguePlayerId) {
        tpIdToLpId.set(p.id, p.leaguePlayerId);
        lpIdToTpId.set(p.leaguePlayerId, p.id);
      }
    });

    if (event.leagueId && propagates) {
      const league = leagues.find((l) => l.id === event.leagueId);
      if (league) {
        const buildLeagueTeam = (tpIds: string[]): Player[] =>
          tpIds.flatMap((tpId) => {
            const lpId = tpIdToLpId.get(tpId);
            if (!lpId) return [];
            const lp = league.players.find((p) => p.id === lpId);
            return lp ? [lp] : [];
          });

        const leagueTeamA = buildLeagueTeam(teamAIds);
        const leagueTeamB = buildLeagueTeam(teamBIds);

        if (leagueTeamA.length > 0 && leagueTeamB.length > 0) {
          const newLeagueRatings = calculateEloChange(leagueTeamA, leagueTeamB, winner, 'league');
          leagueEloChangesDB = {};
          [...leagueTeamA, ...leagueTeamB].forEach((player) => {
            const oldElo = player.elo;
            const newElo = newLeagueRatings[player.id];
            leagueEloChangesDB![player.id] = {
              before: oldElo,
              after: newElo,
              change: newElo - oldElo,
            };
          });
        }
      }
    }

    // Use provided scores or calculate from winner
    const scoreA = scores?.scoreA ?? (winner === "A" ? 10 : 0);
    const scoreB = scores?.scoreB ?? (winner === "B" ? 10 : 0);

    // Add match to Event
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      teamA: teamAIds,
      teamB: teamBIds,
      scoreA: scoreA,
      scoreB: scoreB,
      eloChanges: effectiveAntiCheat ? undefined : eloChanges,
      cups_remaining: scores?.cupsRemaining ?? null,
      created_by_user_id: isAuthenticated && user ? user.id : null,
      created_by_anonymous_user_id: !isAuthenticated && localUser ? localUser.anonymousUserId : null,
      status: effectiveAntiCheat ? 'pending' : 'confirmed',
    };

    setEvents((prev) =>
      prev.map((t) => {
        if (t.id !== eventId) return t;
        return {
          ...t,
          matches: [newMatch, ...t.matches],
        };
      })
    );

    // Update league cache with the LEAGUE delta (independent from event delta)
    // when propagation is active. Skipped under anti-cheat for non-admins —
    // stats only shift after confirmation.
    if (!effectiveAntiCheat && event.leagueId && propagates && leagueEloChangesDB) {
      setLeagues((prev) =>
        prev.map((league) => {
          if (league.id !== event.leagueId) return league;

          const updatedPlayers = league.players.map((player) => {
            const change = leagueEloChangesDB?.[player.id];
            if (!change) return player;

            const tpId = lpIdToTpId.get(player.id);
            const isTeamA = tpId ? teamAIds.includes(tpId) : false;
            const isTeamB = tpId ? teamBIds.includes(tpId) : false;
            if (!isTeamA && !isTeamB) return player;
            const isWinner = (winner === "A" && isTeamA) || (winner === "B" && isTeamB);

            return {
              ...player,
              elo: change.after,
              matchesPlayed: player.matchesPlayed + 1,
              wins: player.wins + (isWinner ? 1 : 0),
              losses: player.losses + (isWinner ? 0 : 1),
              streak: isWinner
                ? player.streak > 0 ? player.streak + 1 : 1
                : player.streak < 0 ? player.streak - 1 : -1,
            };
          });

          return {
            ...league,
            players: updatedPlayers,
            matches: [newMatch, ...league.matches],
          };
        }),
      );
    }

    try {
      const result = await databaseService.recordEventMatch(
        eventId,
        newMatch,
        eventEloChangesDB,
        isAuthenticated && user ? user.id : null,
        !isAuthenticated && localUser ? localUser.anonymousUserId : null,
        leagueEloChangesDB
      );
      return {
        matchId: newMatch.id,
        status: result.status,
        eloChanges: result.status === 'confirmed' ? eloChanges : {},
      };
    } catch (error) {
      console.error('Error recording event match:', error);
      toast.error('Erreur lors de l\'enregistrement du match');
      return null;
    }
  };

  // Calculate local ranking for a Event (based only on Event matches, starting from base ELO)
  // participantsOverride: when provided (from loadEventParticipants), use these - their ids match match.teamA/teamB (event_players.id)
  const getEventLocalRanking = (eventId: string, participantsOverride?: Player[]): Player[] => {
    const event = events.find((t) => t.id === eventId);
    if (!event) return [];

    // Get base players: use override (event_players) when provided, else fallback to league.players filtered by event.playerIds
    let basePlayers: Player[] = [];
    if (participantsOverride && participantsOverride.length > 0) {
      basePlayers = participantsOverride;
    } else if (event.leagueId) {
      const league = leagues.find((l) => l.id === event.leagueId);
      if (league) {
        basePlayers = league.players.filter((p) =>
          event.playerIds.includes(p.id)
        );
      }
    }

    // Start from base ELO (1000 for local ranking, reset at each Event)
    // We use the League ELO as starting point, but calculate changes only from Event matches
    let localPlayers: Player[] = basePlayers.map((p) => ({
      ...p,
      elo: 1000, // Reset to 1000 for local ranking
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    }));

    // Replay all Event matches in chronological order to calculate local ranking
    const sortedMatches = [...event.matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match) => {
      const teamA = localPlayers.filter((p) => match.teamA.includes(p.id));
      const teamB = localPlayers.filter((p) => match.teamB.includes(p.id));
      const winner = match.scoreA > match.scoreB ? "A" : "B";
      const newRatings = calculateEloChange(teamA, teamB, winner, 'event');

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

  // Calculate global ranking for a League (includes all matches, including Event matches)
  const getLeagueGlobalRanking = (leagueId: string): Player[] => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return [];

    // League ranking is just the current ELO of players (already updated by all matches)
    return [...league.players].sort((a, b) => b.elo - a.elo);
  };

  const updateLeague = async (
    leagueId: string,
    updates: LeagueUpdates
  ) => {
    // Optimistic local update — keep field mapping explicit to dodge the
    // snake_case/camelCase quirks on `anti_cheat_enabled` / `score_validator`
    // (mirror of the updateEvent pattern below).
    setLeagues((prev) =>
      prev.map((league) => {
        if (league.id !== leagueId) return league;
        const next: Partial<League> = {};
        if (updates.name !== undefined) next.name = updates.name;
        if (updates.type !== undefined) next.type = updates.type;
        if (updates.antiCheatEnabled !== undefined)
          next.anti_cheat_enabled = updates.antiCheatEnabled;
        if (updates.scoreValidator !== undefined)
          next.scoreValidator = updates.scoreValidator;
        return { ...league, ...next };
      })
    );

    // Update in Supabase
    try {
      await databaseService.updateLeague(leagueId, updates);
      toast.success('Ligue mise à jour');
    } catch (error) {
      console.error('Error updating league:', error);
      toast.error('Erreur lors de la mise à jour de la ligue');
    }
  };

  const updateEvent = async (
    eventId: string,
    updates: EventUpdates
  ) => {
    // Optimistic local update — apply the same diff we'll send to Supabase so
    // the UI doesn't wait on a round-trip. The field-name mapping is 1:1 with
    // the Event type; we keep the branching explicit to avoid the
    // snake_case/camelCase quirk on `anti_cheat_enabled`.
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        const next: Partial<Event> = {};
        if (updates.name !== undefined) next.name = updates.name;
        if (updates.date !== undefined) next.date = updates.date;
        if (updates.antiCheatEnabled !== undefined)
          next.anti_cheat_enabled = updates.antiCheatEnabled;
        if (updates.scoreValidator !== undefined)
          next.scoreValidator = updates.scoreValidator;
        if (updates.format !== undefined) next.format = updates.format;
        if (updates.maxPlayers !== undefined)
          next.maxPlayers = updates.maxPlayers;
        if (updates.isPrivate !== undefined)
          next.isPrivate = updates.isPrivate;
        if (updates.propagatesToLeagueElo !== undefined)
          next.propagatesToLeagueElo = updates.propagatesToLeagueElo;
        return { ...event, ...next };
      })
    );

    // Update in Supabase
    try {
      await databaseService.updateEvent(eventId, updates);
      toast.success("Événement mis à jour");
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error("Erreur lors de la mise à jour de l'événement");
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

    // Also remove from events
    setEvents((prev) =>
      prev.map((event) => ({
        ...event,
        playerIds: event.playerIds.filter((id) => id !== playerId),
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
        events,
        currentLeague,
        currentEvent,
        isLoadingInitialData,
        loadError,
        reloadData: loadDataFromSupabase,
        createLeague,
        createEvent,
        selectLeague,
        selectEvent,
        associateEventToLeague,
        addPlayer,
        addPlayerToEvent,
        addAnonymousPlayerToEvent,
        addGuestPlayerToEvent,
        recordMatch,
        recordEventMatch,
        deleteLeague,
        pauseLeague,
        resumeLeague,
        finishLeague,
        reopenLeague,
        finishCurrentLeagueSeason,
        startNewLeagueSeason,
        deleteEvent,
        toggleEventStatus,
        startEvent,
        pauseEvent,
        resumeEvent,
        updateLeague,
        updateEvent,
        updatePlayer,
        deletePlayer,
        getEventLocalRanking,
        getLeagueGlobalRanking,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};
