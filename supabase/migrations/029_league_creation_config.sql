-- Migration 029 — League creation config (dates + saisons + champs étendus)
--
-- Étend la table `leagues` avec les paramètres configurables à la création :
--   * planned_start_at      — date prévue de démarrage. Si futur, gate le
--                              match logging (state `not_started`).
--   * planned_end_at        — date prévue de fin. Informationnel (rappel admin
--                              quand dépassé, aucune auto-clôture).
--   * season_duration_days  — durée prévue d'une saison en jours. Pertinent
--                              pour type=season uniquement. Informationnel.
--   * max_players           — limite de membres. Garde appliquée côté repo.
--   * is_private            — visibilité publique (défaut TRUE, parité events).
--   * default_format        — format de match pré-rempli dans RecordMatch.
--
-- Tous les ajouts sont additifs et nullables (sauf is_private qui a un DEFAULT).
-- Aucun CHECK temporel (planned_end > planned_start) au niveau DB : la
-- validation vit côté UI pour rester flexible aux édits successifs admin.

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS planned_start_at     TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS planned_end_at       TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS season_duration_days INTEGER     NULL,
  ADD COLUMN IF NOT EXISTS max_players          INTEGER     NULL,
  ADD COLUMN IF NOT EXISTS is_private           BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS default_format       TEXT        NULL;

-- CHECK séparé pour default_format (ADD COLUMN ne permet pas un CHECK ici
-- avec IF NOT EXISTS sur l'inline). On le pose en ALTER conditionnel.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leagues_default_format_check'
  ) THEN
    ALTER TABLE public.leagues
      ADD CONSTRAINT leagues_default_format_check
      CHECK (default_format IS NULL OR default_format IN ('1v1','2v2','3v3','libre'));
  END IF;
END $$;

COMMENT ON COLUMN public.leagues.planned_start_at IS
  'Date prévue de démarrage. NULL = active dès création. Si dans le futur, gate le match logging (state not_started).';
COMMENT ON COLUMN public.leagues.planned_end_at IS
  'Date prévue de fin. NULL = sans fin. Informationnel : rappel admin quand dépassé, aucune auto-clôture.';
COMMENT ON COLUMN public.leagues.season_duration_days IS
  'Durée prévue d''une saison (jours). Pertinent pour type=season uniquement. Informationnel : rappel admin quand la saison courante est échue.';
COMMENT ON COLUMN public.leagues.max_players IS
  'Nombre max de membres. NULL = pas de limite. Garde appliquée côté repo (addPlayerToLeague).';
COMMENT ON COLUMN public.leagues.is_private IS
  'TRUE (défaut) = découverte via join_code uniquement. FALSE = visible dans les listings publics.';
COMMENT ON COLUMN public.leagues.default_format IS
  'Format pré-rempli dans RecordMatch pour cette league. NULL = libre.';
