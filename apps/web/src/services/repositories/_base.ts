/**
 * Re-export of the canonical BaseRepository module, now in
 * `@elofight/shared/services/repositories/_base`.
 *
 * Existing call sites (`import { sb, supabase, BaseRepository, … } from
 * './repositories/_base'`) keep working unchanged.
 */
export {
  supabase,
  sb,
  BaseRepository,
} from '@elofight/shared/services/repositories/_base';
export type {
  UserRow,
  PlayerRow,
  LeagueRow,
  LeagueSeasonArchiveRow,
  EventRow,
  LeagueMembershipRow,
  EventMembershipRow,
  MatchRow,
} from '@elofight/shared/services/repositories/_base';
