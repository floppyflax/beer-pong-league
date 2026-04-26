/**
 * Shared constants/types used by the RecordMatch sub-components
 * (TableSide, TeamCompositionCard, PlayerPool, ContextPickerModal).
 *
 * These are page-specific by design — they describe a beer-pong rack and the
 * 2-team composition contract — but live in the DS so the showcase can mount
 * the components in isolation.
 */

import type { Player } from "@/types";

export type Team = "A" | "B";

export const TOTAL_CUPS = 10;

/** Standard beer pong rack viewed from above: back row first (4 cups), then 3, 2, 1. */
export const CUP_ROWS = [4, 3, 2, 1];

/** Canonical cup id for a (rack row, column). Row 0 = back (4 cups), row 3 = tip. */
export const cupId = (rackRow: number, col: number) => `r${rackRow}c${col}`;

/**
 * Order in which cups fall when the score is adjusted via +/- (front-most
 * first, back row last — matches the back-to-front "rack drains" visual).
 */
export const ELIMINATION_ORDER: string[] = (() => {
  const ids: string[] = [];
  for (let r = CUP_ROWS.length - 1; r >= 0; r--) {
    for (let c = 0; c < CUP_ROWS[r]; c++) ids.push(cupId(r, c));
  }
  return ids;
})();

export const EMPTY_DROPPED: Set<string> = new Set();

export type EnrichedPlayer = Player & { avatarUrl?: string | null };
