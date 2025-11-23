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
  created_by_user_id?: string | null; // User ID if created by authenticated user
  created_by_anonymous_user_id?: string | null; // Anonymous user ID if created by local user
  status?: "pending" | "confirmed" | "rejected"; // Match confirmation status
  confirmed_by_user_id?: string | null; // User ID who confirmed the match
  confirmed_by_anonymous_user_id?: string | null; // Anonymous user ID who confirmed the match
  confirmed_at?: string | null; // When the match was confirmed
}

export interface League {
  id: string;
  name: string;
  type: "event" | "season";
  createdAt: string;
  players: Player[];
  matches: Match[];
  tournaments?: string[]; // Tournament IDs associated with this League
  creator_user_id?: string | null; // User ID if created by authenticated user
  creator_anonymous_user_id?: string | null; // Anonymous user ID if created by local user
  anti_cheat_enabled?: boolean; // Anti-cheat mode: requires opponent confirmation
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  leagueId: string | null; // null if autonomous, otherwise linked to a League
  createdAt: string;
  playerIds: string[]; // Subset of League players (or all if autonomous)
  matches: Match[];
  isFinished: boolean; // true if tournament is finished
  creator_user_id?: string | null; // User ID if created by authenticated user
  creator_anonymous_user_id?: string | null; // Anonymous user ID if created by local user
  anti_cheat_enabled?: boolean; // Anti-cheat mode: requires opponent confirmation
  // Local ranking is calculated on-the-fly from matches, starting from base ELO
}
