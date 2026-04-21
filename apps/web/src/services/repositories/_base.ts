/**
 * BaseRepository - Partagé par tous les repositories
 *
 * Fournit :
 * - isSupabaseAvailable() : vérifie si Supabase est disponible
 * - supabase : référence au client Supabase (via ../lib/supabase)
 *
 * Chaque repository étend cette classe pour éviter la duplication.
 */

import { supabase } from '../../lib/supabase';

export { supabase };

export interface LeagueRow {
  id: string;
  name: string;
  type: 'event' | 'season';
  created_at: string;
  creator_user_id: string | null;
  creator_anonymous_user_id: string | null;
  anti_cheat_enabled?: boolean;
}

export interface TournamentRow {
  id: string;
  name: string;
  date: string;
  league_id: string | null;
  is_finished: boolean;
  created_at: string;
  updated_at?: string;
  location?: string | null;
  creator_user_id: string | null;
  creator_anonymous_user_id: string | null;
  anti_cheat_enabled?: boolean;
  // Story 8.2 fields
  join_code?: string;
  format_type?: 'fixed' | 'free';
  team1_size?: number | null;
  team2_size?: number | null;
  max_players?: number;
  is_private?: boolean;
  status?: string;
  format?: string;
}

export interface LeaguePlayerRow {
  id: string;
  league_id: string;
  user_id?: string | null;
  anonymous_user_id?: string | null;
  pseudo_in_league: string;
  elo?: number;
  wins?: number;
  losses?: number;
  matches_played?: number;
  streak?: number;
}

export interface MatchRow {
  id: string;
  league_id: string | null;
  tournament_id: string | null;
  team_a_player_ids: string[];
  team_b_player_ids: string[];
  score_a: number;
  score_b: number;
  created_at?: string;
  created_by_user_id?: string | null;
  created_by_anonymous_user_id?: string | null;
  status?: string;
  confirmed_by_user_id?: string | null;
  confirmed_by_anonymous_user_id?: string | null;
  confirmed_at?: string | null;
  cups_remaining?: number | null;
  photo_url?: string | null;
}

export interface TournamentPlayerRow {
  id: string;
  tournament_id: string;
  user_id?: string | null;
  anonymous_user_id?: string | null;
  pseudo_in_tournament?: string | null;
  joined_at?: string;
}

/**
 * Classe de base que chaque repository étend.
 */
export abstract class BaseRepository {
  protected isSupabaseAvailable(): boolean {
    return supabase !== null;
  }
}
