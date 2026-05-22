/**
 * Re-export of the canonical ELO logic, now in `@elofight/shared/utils/elo`.
 * Existing call sites keep importing from `'../utils/elo'`. Migrate them
 * directly to the shared package opportunistically.
 */
export { calculateEloChange } from '@elofight/shared';
export type { EloPlayer, EloContext } from '@elofight/shared';
