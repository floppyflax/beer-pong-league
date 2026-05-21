export interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  streak: number; // Positive for win streak, negative for loss streak
}

export interface Team {
  players: Player[];
}

export interface Match {
  id: string;
  date: string;
  teamA: string[]; // Player IDs
  teamB: string[]; // Player IDs
  scoreA: number;
  scoreB: number;
  eloChanges?: Record<string, number>; // Player ID -> ELO change (positive = gain, negative = loss)
  created_by_user_id?: string | null; // FK → users.id (auth or anonymous, since mig 022)
  /** @deprecated since mig 022. Always null. Use created_by_user_id. */
  created_by_anonymous_user_id?: string | null;
  status?: "pending" | "confirmed" | "rejected"; // Match confirmation status
  confirmed_by_user_id?: string | null; // FK → users.id
  /** @deprecated since mig 022. Always null. Use confirmed_by_user_id. */
  confirmed_by_anonymous_user_id?: string | null;
  confirmed_at?: string | null; // When the match was confirmed
  // Story 14-24: Enriched match data
  cups_remaining?: number | null; // 1-10, winning team only
  photo_url?: string | null; // Supabase Storage URL for winning team photo
  // Phase D.4: Live match tracking
  is_live?: boolean; // True while the match is actively in progress
  balloon_possession?: "team_a" | "team_b" | null; // Which team holds the service
  is_match_point?: boolean; // True when the leading team is one cup from winning
}

export interface League {
  id: string;
  name: string;
  type: "one-shot" | "season";
  createdAt: string;
  players: Player[];
  matches: Match[];
  events?: string[]; // Event IDs associated with this League
  joinCode?: string; // Unique 6-character alphanumeric code (parity with Event)
  creator_user_id?: string | null; // FK → users.id (auth or anonymous, since mig 022)
  /** @deprecated since mig 022. Always null. Kept for legacy callers; use creator_user_id. */
  creator_anonymous_user_id?: string | null;
  anti_cheat_enabled?: boolean; // Anti-cheat mode: requires opponent confirmation
  // Mig 028 — lifecycle + saisons
  // Derived state: see apps/web/src/utils/leagueLifecycle.ts
  pausedAt?: string | null;            // ISO timestamp — admin "Mettre en pause"
  endedAt?: string | null;             // ISO timestamp — admin "Clôturer la league"
  currentSeasonNumber?: number;        // 1-indexed, bumped via startNewSeason()
  currentSeasonStartedAt?: string;     // ISO timestamp — début saison courante
  // Mig 029 — config à la création
  plannedStartAt?: string | null;      // ISO datetime — gate `not_started` si futur
  plannedEndAt?: string | null;        // ISO datetime — rappel admin si dépassé
  seasonDurationDays?: number | null;  // durée prévue d'une saison (type=season only)
  maxPlayers?: number | null;          // limite de membres (NULL = pas de limite)
  isPrivate?: boolean;                 // visibilité publique (défaut true)
  defaultFormat?: '1v1' | '2v2' | '3v3' | 'libre' | null; // format pré-rempli RecordMatch
  // Mig 030 — cycle de saison à 2 étapes
  currentSeasonEndedAt?: string | null; // ISO timestamp — saison close, en attente du démarrage de la suivante (état between_seasons)
}

/** League season archive (mig 028 — league_season_archives row). */
export interface LeagueSeasonArchive {
  id: string;
  leagueId: string;
  seasonNumber: number;
  startedAt: string;
  endedAt: string;
  matchCount: number;
  /** Snapshot des rankings au moment de la clôture, triés par rank. */
  rankings: Array<{
    player_id: string;
    pseudo: string;
    elo: number;
    wins: number;
    losses: number;
    matches_played: number;
    streak: number;
    rank: number;
  }>;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  format: '1v1' | '2v2' | '3v3' | 'libre'; // Default format for matches in this event (libre = flexible team sizes)
  location?: string; // Optional location context
  leagueId: string | null; // null if autonomous, otherwise linked to a League
  createdAt: string;
  updatedAt?: string; // Last activity timestamp (match recorded, player joined, etc.) - Story 10.2
  playerIds: string[]; // Subset of League players (or all if autonomous)
  matches: Match[];
  isFinished: boolean; // true if event is finished
  creator_user_id?: string | null; // FK → users.id (auth or anonymous, since mig 022)
  /** @deprecated since mig 022. Always null. Kept for legacy callers; use creator_user_id. */
  creator_anonymous_user_id?: string | null;
  anti_cheat_enabled?: boolean; // Anti-cheat mode: requires opponent confirmation
  /**
   * Mig 030 — Who validates scores when anti_cheat_enabled = TRUE.
   *   - 'opponent' (default) : a player from the opposing team confirms.
   *     Admin (event or league creator) can always bypass.
   *   - 'admin' : only the admin can confirm.
   * Ignored when anti_cheat_enabled = FALSE.
   */
  scoreValidator?: 'opponent' | 'admin';
  // Story 8.2 fields
  joinCode?: string; // Unique 6-character alphanumeric code for joining
  formatType?: 'fixed' | 'free'; // fixed = fixed team sizes (1v1, 2v2), free = flexible
  team1Size?: number | null; // Team 1 size (null for free format)
  team2Size?: number | null; // Team 2 size (null for free format)
  maxPlayers?: number; // 999 = unlimited. Free users cappés à 8 (cf. usePremiumLimits.ts)
  isPrivate?: boolean; // Private event (not listed publicly)
  status?: 'active' | 'finished' | 'cancelled'; // Event status
  // Mig 027 — Lifecycle timestamps. NULL until admin acts.
  // Derived state: see apps/web/src/utils/eventLifecycle.ts
  startedAt?: string | null; // ISO timestamp — admin "Démarrer" (early start) or implicit on resume
  pausedAt?: string | null;  // ISO timestamp — admin "Mettre en pause" (cleared on resume)
  // Phase A.5: competition mode (ELO = classement ponctuel, Bracket = élimination directe)
  // Set at creation time and immutable afterwards (see CreateEvent).
  mode?: 'elo' | 'bracket';
  /**
   * Mig 023 — When TRUE (default) and the event is linked to a league, matches
   * recorded in this event also update the league's ELO. Toggle off to keep
   * the event's ELO bubble isolated from the league. Only meaningful when
   * `leagueId` is set.
   */
  propagatesToLeagueElo?: boolean;
  // Local ranking is calculated on-the-fly from matches, starting from base ELO
}
