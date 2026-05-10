/**
 * Re-export of the canonical Supabase Database types, now living in
 * `@elofight/shared/types/supabase`. The web `lib/supabase.ts` shim
 * and any consumer that types Supabase queries pick this up
 * transparently.
 *
 * To regenerate after a schema change:
 *   npx supabase gen types typescript --project-id <ref>
 *     > packages/shared/src/types/supabase.ts
 */
export type { Json, Database } from '@elofight/shared/types/supabase';
