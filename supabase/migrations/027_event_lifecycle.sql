-- Migration 027 — Event lifecycle: not_started / in_progress / paused / finished
--
-- Adds two nullable timestamps to drive the derived lifecycle on `events`:
--   * started_at  — admin "Démarrer" early start, or implicit on resume.
--   * paused_at   — admin "Mettre en pause"; cleared on resume.
--
-- Lifecycle is computed in app code (see apps/web/src/utils/eventLifecycle.ts):
--   if is_finished              → finished
--   elif paused_at IS NOT NULL  → paused
--   elif started_at IS NOT NULL OR date <= today → in_progress
--   else                        → not_started
--
-- Backfill: every existing non-finished event whose `date` is today or in the
-- past is treated as already started, so the UI keeps behaving as before.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS paused_at  TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.events.started_at IS
  'NULL = not yet started. Set by admin "Démarrer" (early start) or implicit on first resume after a pause.';
COMMENT ON COLUMN public.events.paused_at IS
  'NULL = not paused. NOT NULL = paused, blocks new match logging.';

UPDATE public.events
   SET started_at = COALESCE(updated_at, created_at, NOW())
 WHERE started_at IS NULL
   AND is_finished = FALSE
   AND date <= CURRENT_DATE;
