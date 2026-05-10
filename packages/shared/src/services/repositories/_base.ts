/**
 * BaseRepository — partagé par tous les repositories.
 *
 * Modèle unifié (mig 022) :
 *   - users : identité (anonyme ou authentifiée)
 *   - players : entité de jeu, optionnellement claimée par un user
 *   - league_memberships / event_memberships : appartenance + stats
 *
 * NB on lazy initialisation : `supabase` et `sb` sont des `let` exportés.
 * Ils sont peuplés par `initShared()` (via `_initBaseRepositoryClient`)
 * avant que les services ne soient invoqués. Le pattern `if (!sb)` reste
 * valable car le binding `let` est lu au moment de l'évaluation, pas au
 * load du module.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import { getSupabase } from '../../lib/supabase';

/**
 * Loose Supabase alias for tables introduced by mig 022 (`players`,
 * `league_memberships`, `event_memberships`) that aren't yet in the
 * generated `Database` types. Once `supabase gen types typescript` is rerun,
 * this can collapse back to the typed `supabase` client.
 */
type AnySupabase = {
  from: (table: string) => {
    select: (cols?: string) => any;
    insert: (rows: unknown) => any;
    update: (data: unknown) => any;
    upsert: (rows: unknown, options?: unknown) => any;
    delete: () => any;
  };
  rpc: (
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export let supabase: SupabaseClient<Database> | null = null;
export let sb: AnySupabase | null = null;

/**
 * Called by `initShared()` at app boot, after `configureSupabaseClient`.
 * Apps don't call this directly.
 */
export function _initBaseRepositoryClient(): void {
  supabase = getSupabase();
  sb = supabase as unknown as AnySupabase | null;
}

export interface UserRow {
  id: string;
  pseudo: string;
  avatar_url?: string | null;
  auth_user_id?: string | null;
  is_anonymous: boolean;
  device_fingerprint?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerRow {
  id: string;
  pseudo: string;
  avatar_url?: string | null;
  user_id: string | null; // null = ghost, not yet claimed
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
}

export interface LeagueRow {
  id: string;
  name: string;
  type: 'one-shot' | 'season';
  created_at: string;
  creator_user_id: string | null;
  anti_cheat_enabled?: boolean;
  join_code?: string | null;
}

export interface EventRow {
  id: string;
  name: string;
  date: string;
  league_id: string | null;
  is_finished: boolean;
  created_at: string;
  updated_at?: string;
  location?: string | null;
  creator_user_id: string | null;
  anti_cheat_enabled?: boolean;
  join_code?: string;
  format_type?: 'fixed' | 'free';
  team1_size?: number | null;
  team2_size?: number | null;
  max_players?: number;
  is_private?: boolean;
  status?: string;
  format?: string;
  mode?: 'elo' | 'bracket';
}

export interface LeagueMembershipRow {
  id: string;
  league_id: string;
  player_id: string;
  pseudo_override?: string | null;
  elo: number;
  wins: number;
  losses: number;
  matches_played: number;
  streak: number;
  joined_at: string;
  archived_at?: string | null;
}

export interface EventMembershipRow {
  id: string;
  event_id: string;
  player_id: string;
  pseudo_override?: string | null;
  joined_at: string;
  archived_at?: string | null;
}

export interface MatchRow {
  id: string;
  league_id: string | null;
  event_id: string | null;
  format: '1v1' | '2v2' | '3v3';
  team_a_player_ids: string[]; // → players.id
  team_b_player_ids: string[]; // → players.id
  score_a: number;
  score_b: number;
  is_ranked?: boolean;
  created_at?: string;
  created_by_user_id?: string | null;
  status?: string;
  confirmed_by_user_id?: string | null;
  confirmed_at?: string | null;
  cups_remaining?: number | null;
  photo_url?: string | null;
  is_live?: boolean;
  balloon_possession?: 'team_a' | 'team_b' | null;
  is_match_point?: boolean;
}

export abstract class BaseRepository {
  protected isSupabaseAvailable(): boolean {
    return supabase !== null;
  }
}
