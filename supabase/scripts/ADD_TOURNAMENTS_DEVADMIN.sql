-- ============================================================
-- Script pour ajouter des tournois au compte devadmin@test.com
-- ============================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
  devadmin_user_id UUID;
  
  -- IDs pour les données générées
  tournament1_id UUID;
  tournament2_id UUID;
  tournament3_id UUID;
  
  -- IDs des anonymous users existants (ou à créer)
  anon1_id UUID;
  anon2_id UUID;
  anon3_id UUID;
  
BEGIN
  -- ============================================================
  -- 1. Récupérer l'ID de devadmin@test.com
  -- ============================================================
  
  SELECT id INTO devadmin_user_id 
  FROM auth.users 
  WHERE email = 'devadmin@test.com';
  
  IF devadmin_user_id IS NULL THEN
    RAISE EXCEPTION 'Le compte devadmin@test.com n''existe pas. Veuillez le créer d''abord dans Supabase Auth.';
  END IF;
  
  RAISE NOTICE '✅ User devadmin@test.com trouvé: %', devadmin_user_id;
  
  -- ============================================================
  -- 2. Créer ou récupérer des utilisateurs anonymes
  -- ============================================================
  
  -- Essayer de récupérer des anonymous users existants
  SELECT id INTO anon1_id FROM public.anonymous_users LIMIT 1 OFFSET 0;
  SELECT id INTO anon2_id FROM public.anonymous_users LIMIT 1 OFFSET 1;
  SELECT id INTO anon3_id FROM public.anonymous_users LIMIT 1 OFFSET 2;
  
  -- Si pas assez d'anonymous users, en créer
  IF anon1_id IS NULL THEN
    anon1_id := gen_random_uuid();
    INSERT INTO public.anonymous_users (id, pseudo, device_fingerprint, is_premium, created_at)
    VALUES (anon1_id, '🎮 Player One', 'device-devadmin-001', false, NOW() - INTERVAL '10 days');
    RAISE NOTICE '   ✓ Anonymous user créé: 🎮 Player One';
  END IF;
  
  IF anon2_id IS NULL THEN
    anon2_id := gen_random_uuid();
    INSERT INTO public.anonymous_users (id, pseudo, device_fingerprint, is_premium, created_at)
    VALUES (anon2_id, '🎯 Player Two', 'device-devadmin-002', false, NOW() - INTERVAL '8 days');
    RAISE NOTICE '   ✓ Anonymous user créé: 🎯 Player Two';
  END IF;
  
  IF anon3_id IS NULL THEN
    anon3_id := gen_random_uuid();
    INSERT INTO public.anonymous_users (id, pseudo, device_fingerprint, is_premium, created_at)
    VALUES (anon3_id, '⚡ Player Three', 'device-devadmin-003', false, NOW() - INTERVAL '6 days');
    RAISE NOTICE '   ✓ Anonymous user créé: ⚡ Player Three';
  END IF;
  
  -- ============================================================
  -- 3. Créer des tournois pour devadmin@test.com
  -- ============================================================
  
  tournament1_id := gen_random_uuid();
  tournament2_id := gen_random_uuid();
  tournament3_id := gen_random_uuid();
  
  INSERT INTO public.tournaments (id, name, date, creator_user_id, league_id, is_finished, join_code, format, created_at, updated_at)
  VALUES
    -- Tournoi actif récent
    (tournament1_id, '🏆 Tournoi DevAdmin Actif', NOW()::date, devadmin_user_id, NULL, false, 'DEVA01', '2v2', NOW() - INTERVAL '3 days', NOW()),
    
    -- Tournoi terminé récent
    (tournament2_id, '🎯 Tournoi DevAdmin Terminé', (NOW() - INTERVAL '10 days')::date, devadmin_user_id, NULL, true, 'DEVA02', '1v1', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
    
    -- Tournoi actif ancien
    (tournament3_id, '⚡ Tournoi DevAdmin Ancien', (NOW() + INTERVAL '5 days')::date, devadmin_user_id, NULL, false, 'DEVA03', '1v1', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day');
  
  RAISE NOTICE '   ✓ 3 tournois créés pour devadmin@test.com';
  
  -- ============================================================
  -- 4. Ajouter des participants aux tournois
  -- NOTE: devadmin est automatiquement ajouté par le trigger
  -- ============================================================
  
  INSERT INTO public.tournament_players (id, tournament_id, user_id, anonymous_user_id, pseudo_in_tournament, joined_at)
  VALUES
    -- Tournoi 1: Ajouter 3 anonymes (devadmin déjà ajouté par trigger)
    (gen_random_uuid(), tournament1_id, NULL, anon1_id, '🎮 Player One', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), tournament1_id, NULL, anon2_id, '🎯 Player Two', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), tournament1_id, NULL, anon3_id, '⚡ Player Three', NOW() - INTERVAL '1 day'),
    
    -- Tournoi 2: Ajouter 2 anonymes (devadmin déjà ajouté)
    (gen_random_uuid(), tournament2_id, NULL, anon1_id, '🎮 Player One', NOW() - INTERVAL '14 days'),
    (gen_random_uuid(), tournament2_id, NULL, anon2_id, '🎯 Player Two', NOW() - INTERVAL '14 days'),
    
    -- Tournoi 3: Ajouter 2 anonymes (devadmin déjà ajouté)
    (gen_random_uuid(), tournament3_id, NULL, anon2_id, '🎯 Player Two', NOW() - INTERVAL '19 days'),
    (gen_random_uuid(), tournament3_id, NULL, anon3_id, '⚡ Player Three', NOW() - INTERVAL '18 days');
  
  RAISE NOTICE '   ✓ 7 participants additionnels ajoutés (devadmin auto-ajouté par trigger)';
  
  -- ============================================================
  -- 5. Afficher un résumé
  -- ============================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ====================================';
  RAISE NOTICE '✅ Tournois créés pour devadmin@test.com';
  RAISE NOTICE '✅ ====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé :';
  RAISE NOTICE '   - 3 tournois créés (1 terminé, 2 actifs)';
  RAISE NOTICE '   - 10 participants au total (devadmin + 3 anonymes par tournoi)';
  RAISE NOTICE '';
  RAISE NOTICE '🎮 Prêt pour tester avec devadmin@test.com !';
  
END $$;

-- ============================================================
-- REQUÊTES DE VÉRIFICATION
-- ============================================================

-- Vérifier les tournois de devadmin@test.com
SELECT 
  t.name,
  t.date,
  t.is_finished,
  t.join_code,
  COUNT(DISTINCT tp.id) as participants_count
FROM tournaments t
LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
WHERE t.creator_user_id = (SELECT id FROM auth.users WHERE email = 'devadmin@test.com')
GROUP BY t.id, t.name, t.date, t.is_finished, t.join_code
ORDER BY t.created_at DESC;

-- Vérifier TOUS les tournois où devadmin participe (créateur ou participant)
SELECT 
  t.name,
  t.is_finished,
  CASE 
    WHEN t.creator_user_id = (SELECT id FROM auth.users WHERE email = 'devadmin@test.com') THEN '👨‍💻 Créateur'
    ELSE '👥 Participant'
  END as role,
  COUNT(DISTINCT tp.id) as total_participants
FROM tournaments t
LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
WHERE 
  t.creator_user_id = (SELECT id FROM auth.users WHERE email = 'devadmin@test.com')
  OR EXISTS (
    SELECT 1 FROM tournament_players tp2 
    WHERE tp2.tournament_id = t.id 
    AND tp2.user_id = (SELECT id FROM auth.users WHERE email = 'devadmin@test.com')
  )
GROUP BY t.id, t.name, t.is_finished, t.creator_user_id
ORDER BY t.created_at DESC;
