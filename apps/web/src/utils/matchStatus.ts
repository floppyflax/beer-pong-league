import type { Match } from "../types";

/**
 * Mirrors the server gate in `apply_match_elo` (mig 025): a match counts
 * toward ELO / ranking — and may appear on the live projection — iff it is
 * not rejected and, when its context enforces anti-cheat, has been confirmed.
 *
 * `status` defaults to `'confirmed'` (mig 002) so a match recorded without
 * anti-cheat is validated immediately. Under anti-cheat the match stays
 * `'pending'` until an opponent confirms it.
 *
 * The client replay (`getEventLocalRanking`) and the display match feeds must
 * use this exact rule so a front-end preview never counts a match the server
 * excludes — otherwise the projection diverges from the app ranking.
 */
export function isMatchValidated(
  match: Pick<Match, "status">,
  antiCheatEnabled: boolean | undefined,
): boolean {
  if (match.status === "rejected") return false;
  if (antiCheatEnabled && match.status !== "confirmed") return false;
  return true;
}
