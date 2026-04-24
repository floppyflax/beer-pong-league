-- Migration 017 : bucket avatars + RLS
-- Crée un bucket public "avatars" pour les photos de profil.
-- Chaque utilisateur authentifié peut upload dans son propre dossier (user_id/).

-- Bucket public (les URLs sont lisibles sans auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────
-- Policies
-- ──────────────────────────────────────────────────────────────

-- SELECT : tout le monde peut lire (bucket public)
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- INSERT : utilisateur authentifié uniquement dans son propre dossier
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE : idem
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE : idem
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
