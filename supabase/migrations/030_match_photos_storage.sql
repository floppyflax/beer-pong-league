-- Migration 030 : bucket `match-photos` + RLS + actualisation du commentaire `matches.photo_url`
--
-- Contexte : la colonne `matches.photo_url` existe depuis la migration 008
-- (« photo équipe gagnante ») mais n'est jamais alimentée par l'UI. La feature
-- Photo Finish (V1) la repurpose pour stocker l'URL d'un *collage* 9:16
-- (gagnant + perdant) généré côté client après l'enregistrement du match.
--
-- Bucket public en lecture (les URLs sont incluses dans les payloads matches,
-- donc accessibles sans auth). Path canonique :
--   match-photos/{match_id}/finish.jpg
--
-- Sécurité INSERT/UPDATE/DELETE : alignée sur la policy `matches` (offline-first,
-- création anonyme tolérée). Le `match_id` étant un UUID v4 non-devinable, le
-- risque d'overwrite ciblé est négligeable. Garde-fous : `file_size_limit` 5 MB
-- + `allowed_mime_types` restreint aux formats image courants.
--
-- Rollback (manuel) :
--   DROP POLICY IF EXISTS "match_photos_delete_open" ON storage.objects;
--   DROP POLICY IF EXISTS "match_photos_update_open" ON storage.objects;
--   DROP POLICY IF EXISTS "match_photos_insert_open" ON storage.objects;
--   DROP POLICY IF EXISTS "match_photos_select_public" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'match-photos';

-- ──────────────────────────────────────────────────────────────
-- Bucket
-- ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'match-photos',
  'match-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────
-- Policies
-- ──────────────────────────────────────────────────────────────

-- SELECT : tout le monde peut lire (bucket public).
create policy "match_photos_select_public"
  on storage.objects for select
  using (bucket_id = 'match-photos');

-- INSERT : ouvert à anon + authenticated. Le path doit pointer dans un dossier
-- `{uuid}/...` (filtre minimal pour décourager les uploads à la racine du bucket).
create policy "match_photos_insert_open"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'match-photos'
    and (storage.foldername(name))[1] is not null
    and length((storage.foldername(name))[1]) = 36
  );

-- UPDATE : idem (offline-first : un utilisateur anonyme doit pouvoir retake).
create policy "match_photos_update_open"
  on storage.objects for update
  to anon, authenticated
  using (
    bucket_id = 'match-photos'
    and (storage.foldername(name))[1] is not null
    and length((storage.foldername(name))[1]) = 36
  );

-- DELETE : idem.
create policy "match_photos_delete_open"
  on storage.objects for delete
  to anon, authenticated
  using (
    bucket_id = 'match-photos'
    and (storage.foldername(name))[1] is not null
    and length((storage.foldername(name))[1]) = 36
  );

-- ──────────────────────────────────────────────────────────────
-- Actualisation du commentaire `matches.photo_url`
-- ──────────────────────────────────────────────────────────────
comment on column public.matches.photo_url is
  'URL Supabase Storage du collage Photo Finish (gagnant + perdant en 9:16). Null si non capturé. Bucket public match-photos, path {match_id}/finish.{ext}.';
