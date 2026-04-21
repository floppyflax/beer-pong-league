-- ============================================================
-- Script pour créer les comptes test dans Supabase
-- ============================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Vérifier si les comptes existent déjà
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email IN ('admin@admin.com', 'test@test.com');

-- Si la requête ci-dessus ne retourne rien, exécutez les INSERTs ci-dessous :

-- ============================================================
-- Créer le compte admin@admin.com
-- ============================================================
-- Mot de passe : admin123
-- ============================================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@admin.com'
);

-- ============================================================
-- Créer le compte test@test.com
-- ============================================================
-- Mot de passe : test123
-- ============================================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'test@test.com'
);

-- ============================================================
-- Vérifier que les comptes ont été créés
-- ============================================================

SELECT 
  email, 
  email_confirmed_at, 
  created_at,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmé' ELSE '❌ Non confirmé' END as status
FROM auth.users 
WHERE email IN ('admin@admin.com', 'test@test.com')
ORDER BY email;

-- ============================================================
-- (Optionnel) Créer les profils dans public.users
-- ============================================================
-- Si votre application utilise une table public.users pour les profils
-- ============================================================

-- Récupérer les IDs des comptes créés et créer les profils
DO $$
DECLARE
  admin_user_id UUID;
  test_user_id UUID;
BEGIN
  -- Récupérer les IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com';
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@test.com';
  
  -- Créer le profil admin si nécessaire
  -- Note: La table public.users n'a PAS de colonne email
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, pseudo, created_at)
    VALUES (admin_user_id, '👨‍💻 Admin Dev', now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Créer le profil test user si nécessaire
  IF test_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, pseudo, created_at)
    VALUES (test_user_id, '🧪 Test User', now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Vérification finale
-- ============================================================

SELECT 
  u.email,
  u.email_confirmed_at,
  p.pseudo as profil_pseudo,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL AND p.id IS NOT NULL THEN '✅ Compte complet (Auth + Profil)'
    WHEN u.email_confirmed_at IS NOT NULL THEN '⚠️ Auth OK, profil manquant'
    ELSE '❌ Email non confirmé'
  END as status
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email IN ('admin@admin.com', 'test@test.com')
ORDER BY u.email;
