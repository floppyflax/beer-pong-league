-- Migration 035 — Score convention fix: "gobelets restants"
--
-- Context: historically two score conventions coexisted on public.matches:
--   - Legacy ("convention B"): winner = 10 (fixed), loser = 10 - remaining cups.
--     Produced by the event recording path (and by matches edited before the
--     fix). The score shown in the validation/history screens therefore did
--     NOT match what was entered at recording time.
--   - Target ("convention A", what the entry UI shows): winner = its remaining
--     cups (1..10), loser = 0.
--
-- This backfills legacy rows to the target convention so the persisted score
-- equals the score entered (and displayed) at recording time.
--
-- Safety:
--   - Targets ONLY rows with a winner fixed at 10 AND a loser in [1..9] — the
--     exclusive signature of the legacy convention (in the target convention
--     the loser is always 0). Perfect "10 - 0" wins and rows already in the
--     target convention are left untouched.
--   - Idempotent: after the update the loser is 0, so the WHERE clause no
--     longer matches on a re-run.
--   - ELO-safe: the winning side is preserved (10 - loser >= 1 > 0) and ELO is
--     derived solely from score_a > score_b, so no elo_history rebuild is
--     required. public.matches has no triggers, so the UPDATE has no side
--     effects.
--   - League-only matches were always stored as "10 - 0" (remaining cups never
--     captured) and are intentionally NOT migrated — the information is
--     unrecoverable and "10 - 0" is a valid target-convention score.

UPDATE public.matches
SET score_a = CASE WHEN score_a = 10 THEN 10 - score_b ELSE 0 END,
    score_b = CASE WHEN score_b = 10 THEN 10 - score_a ELSE 0 END
WHERE (score_a = 10 AND score_b BETWEEN 1 AND 9)
   OR (score_b = 10 AND score_a BETWEEN 1 AND 9);
