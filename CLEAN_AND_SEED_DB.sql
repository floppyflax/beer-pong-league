-- ============================================================
-- Script de nettoyage et génération de données de test
-- ============================================================
-- Ce script :
-- 1. Nettoie toutes les données SAUF les users de test
-- 2. Crée des données de test réalistes (tournois, ligues, matchs, etc.)
-- ============================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- PARTIE 1 : RÉCUPÉRATION DES IDS DES USERS DE TEST
-- ============================================================

DO $$
DECLARE
  admin_user_id UUID;
  test_user_id UUID;
  
  -- IDs pour les données générées
  league1_id UUID;
  league2_id UUID;
  tournament1_id UUID;
  tournament2_id UUID;
  tournament3_id UUID;
  tournament4_id UUID;
  
  -- IDs des participants
  player1_id UUID;
  player2_id UUID;
  player3_id UUID;
  player4_id UUID;
  player5_id UUID;
  player6_id UUID;
  player7_id UUID;
  player8_id UUID;
  
  -- IDs des anonymous users
  anon1_id UUID;
  anon2_id UUID;
  anon3_id UUID;
  anon4_id UUID;
  
  -- IDs des league players
  league1_player1_id UUID;
  league1_player2_id UUID;
  league1_player3_id UUID;
  league1_player4_id UUID;
  league2_player1_id UUID;
  league2_player2_id UUID;
  
  -- IDs des matchs
  match1_id UUID;
  match2_id UUID;
  match3_id UUID;
  match4_id UUID;
  match5_id UUID;
  match6_id UUID;

BEGIN
  -- Récupérer les IDs des users de test
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com';
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@test.com';
  
  IF admin_user_id IS NULL OR test_user_id IS NULL THEN
    RAISE EXCEPTION 'Les comptes test (admin@admin.com et test@test.com) n''existent pas. Veuillez les créer d''abord.';
  END IF;
  
  RAISE NOTICE '✅ Users de test trouvés:';
  RAISE NOTICE '   - admin@admin.com: %', admin_user_id;
  RAISE NOTICE '   - test@test.com: %', test_user_id;
  
  -- ============================================================
  -- PARTIE 2 : NETTOYAGE DE LA BASE DE DONNÉES
  -- ============================================================
  
  RAISE NOTICE '🧹 Nettoyage de la base de données...';
  
  -- Supprimer dans l'ordre inverse des dépendances
  DELETE FROM public.elo_history;
  RAISE NOTICE '   ✓ elo_history nettoyé';
  
  DELETE FROM public.matches;
  RAISE NOTICE '   ✓ matches nettoyé';
  
  DELETE FROM public.tournament_players;
  RAISE NOTICE '   ✓ tournament_players nettoyé';
  
  DELETE FROM public.league_players;
  RAISE NOTICE '   ✓ league_players nettoyé';
  
  DELETE FROM public.tournaments;
  RAISE NOTICE '   ✓ tournaments nettoyé';
  
  DELETE FROM public.leagues;
  RAISE NOTICE '   ✓ leagues nettoyé';
  
  DELETE FROM public.user_identity_merges;
  RAISE NOTICE '   ✓ user_identity_merges nettoyé';
  
  DELETE FROM public.anonymous_users;
  RAISE NOTICE '   ✓ anonymous_users nettoyé';
  
  -- Ne pas supprimer les users de test dans public.users
  -- Ils sont nécessaires pour l'authentification
  
  RAISE NOTICE '✅ Nettoyage terminé';
  
  -- ============================================================
  -- PARTIE 3 : CRÉATION DES DONNÉES DE TEST
  -- ============================================================
  
  RAISE NOTICE '🌱 Création des données de test...';
  
  -- ============================================================
  -- 3.1 : Créer des utilisateurs anonymes
  -- ============================================================
  
  anon1_id := gen_random_uuid();
  anon2_id := gen_random_uuid();
  anon3_id := gen_random_uuid();
  anon4_id := gen_random_uuid();
  
  INSERT INTO public.anonymous_users (id, pseudo, device_fingerprint, is_premium, created_at)
  VALUES
    (anon1_id, '🎯 Alex Pro', 'device-fingerprint-001', false, NOW() - INTERVAL '30 days'),
    (anon2_id, '⚡ Jordan Fast', 'device-fingerprint-002', false, NOW() - INTERVAL '20 days'),
    (anon3_id, '🔥 Sam Champion', 'device-fingerprint-003', false, NOW() - INTERVAL '15 days'),
    (anon4_id, '💪 Morgan Strong', 'device-fingerprint-004', false, NOW() - INTERVAL '10 days');
  
  RAISE NOTICE '   ✓ 4 utilisateurs anonymes créés';
  
  -- ============================================================
  -- 3.2 : Créer des ligues
  -- ============================================================
  
  league1_id := gen_random_uuid();
  league2_id := gen_random_uuid();
  
  INSERT INTO public.leagues (id, name, type, creator_user_id, created_at, updated_at)
  VALUES
    (league1_id, '🏆 Ligue Elite Paris', 'season', admin_user_id, NOW() - INTERVAL '60 days', NOW()),
    (league2_id, '🎉 Ligue Amicale Lyon', 'event', test_user_id, NOW() - INTERVAL '45 days', NOW());
  
  RAISE NOTICE '   ✓ 2 ligues créées';
  
  -- ============================================================
  -- 3.3 : Ajouter des joueurs aux ligues
  -- ============================================================
  
  league1_player1_id := gen_random_uuid();
  league1_player2_id := gen_random_uuid();
  league1_player3_id := gen_random_uuid();
  league1_player4_id := gen_random_uuid();
  league2_player1_id := gen_random_uuid();
  league2_player2_id := gen_random_uuid();
  
  INSERT INTO public.league_players (id, league_id, user_id, anonymous_user_id, pseudo_in_league, joined_at)
  VALUES
    -- Ligue 1 : Elite Paris
    (league1_player1_id, league1_id, admin_user_id, NULL, '👨‍💻 Admin Dev', NOW() - INTERVAL '60 days'),
    (league1_player2_id, league1_id, test_user_id, NULL, '🧪 Test User', NOW() - INTERVAL '55 days'),
    (league1_player3_id, league1_id, NULL, anon1_id, '🎯 Alex Pro', NOW() - INTERVAL '50 days'),
    (league1_player4_id, league1_id, NULL, anon2_id, '⚡ Jordan Fast', NOW() - INTERVAL '45 days'),
    
    -- Ligue 2 : Amicale Lyon
    (league2_player1_id, league2_id, test_user_id, NULL, '🧪 Test User', NOW() - INTERVAL '45 days'),
    (league2_player2_id, league2_id, NULL, anon3_id, '🔥 Sam Champion', NOW() - INTERVAL '40 days');
  
  RAISE NOTICE '   ✓ 6 joueurs ajoutés aux ligues';
  
  -- ============================================================
  -- 3.4 : Créer des tournois
  -- ============================================================
  
  tournament1_id := gen_random_uuid();
  tournament2_id := gen_random_uuid();
  tournament3_id := gen_random_uuid();
  tournament4_id := gen_random_uuid();
  
  INSERT INTO public.tournaments (id, name, date, creator_user_id, league_id, is_finished, created_at, updated_at)
  VALUES
    -- Tournois de la Ligue Elite Paris (terminés)
    (tournament1_id, '🎯 Tournoi Championnat Hiver', (NOW() - INTERVAL '30 days')::date, admin_user_id, league1_id, true, NOW() - INTERVAL '35 days', NOW() - INTERVAL '25 days'),
    (tournament2_id, '⚡ Tournoi Sprint Printemps', (NOW() - INTERVAL '15 days')::date, admin_user_id, league1_id, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),
    
    -- Tournoi de la Ligue Amicale Lyon (en cours)
    (tournament3_id, '🎉 Tournoi Fun & Friends', NOW()::date, test_user_id, league2_id, false, NOW() - INTERVAL '5 days', NOW()),
    
    -- Tournoi standalone (pas de ligue, terminé)
    (tournament4_id, '🔥 Beer Pong Masters 2026', (NOW() - INTERVAL '7 days')::date, admin_user_id, NULL, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days');
  
  RAISE NOTICE '   ✓ 4 tournois créés';
  
  -- ============================================================
  -- 3.5 : Ajouter des participants aux tournois
  -- NOTE: Les créateurs sont automatiquement ajoutés par le trigger
  -- ============================================================
  
  INSERT INTO public.tournament_players (id, tournament_id, user_id, anonymous_user_id, pseudo_in_tournament, joined_at)
  VALUES
    -- Tournoi 1: Ajouter test_user et 2 anonymes (admin déjà ajouté par trigger)
    (gen_random_uuid(), tournament1_id, test_user_id, NULL, '🧪 Test User', NOW() - INTERVAL '34 days'),
    (gen_random_uuid(), tournament1_id, NULL, anon1_id, '🎯 Alex Pro', NOW() - INTERVAL '33 days'),
    (gen_random_uuid(), tournament1_id, NULL, anon2_id, '⚡ Jordan Fast', NOW() - INTERVAL '32 days'),
    
    -- Tournoi 2: Ajouter test_user et 2 anonymes (admin déjà ajouté)
    (gen_random_uuid(), tournament2_id, test_user_id, NULL, '🧪 Test User', NOW() - INTERVAL '19 days'),
    (gen_random_uuid(), tournament2_id, NULL, anon1_id, '🎯 Alex Pro', NOW() - INTERVAL '18 days'),
    (gen_random_uuid(), tournament2_id, NULL, anon3_id, '🔥 Sam Champion', NOW() - INTERVAL '17 days'),
    
    -- Tournoi 3: Ajouter 2 anonymes (test_user déjà ajouté)
    (gen_random_uuid(), tournament3_id, NULL, anon3_id, '🔥 Sam Champion', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), tournament3_id, NULL, anon4_id, '💪 Morgan Strong', NOW() - INTERVAL '3 days'),
    
    -- Tournoi 4: Ajouter test_user et 4 anonymes (admin déjà ajouté)
    (gen_random_uuid(), tournament4_id, test_user_id, NULL, '🧪 Test User', NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), tournament4_id, NULL, anon1_id, '🎯 Alex Pro', NOW() - INTERVAL '9 days'),
    (gen_random_uuid(), tournament4_id, NULL, anon2_id, '⚡ Jordan Fast', NOW() - INTERVAL '9 days'),
    (gen_random_uuid(), tournament4_id, NULL, anon3_id, '🔥 Sam Champion', NOW() - INTERVAL '8 days'),
    (gen_random_uuid(), tournament4_id, NULL, anon4_id, '💪 Morgan Strong', NOW() - INTERVAL '8 days');
  
  RAISE NOTICE '   ✓ 13 participants additionnels ajoutés aux tournois (créateurs auto-ajoutés par trigger)';
  
  -- ============================================================
  -- 3.6 : Créer des matchs pour les tournois terminés
  -- ============================================================
  
  match1_id := gen_random_uuid();
  match2_id := gen_random_uuid();
  match3_id := gen_random_uuid();
  
  -- Récupérer les IDs des participants du tournoi 1
  SELECT id INTO player1_id FROM tournament_players WHERE tournament_id = tournament1_id AND user_id = admin_user_id;
  SELECT id INTO player2_id FROM tournament_players WHERE tournament_id = tournament1_id AND user_id = test_user_id;
  SELECT id INTO player3_id FROM tournament_players WHERE tournament_id = tournament1_id AND anonymous_user_id = anon1_id;
  SELECT id INTO player4_id FROM tournament_players WHERE tournament_id = tournament1_id AND anonymous_user_id = anon2_id;
  
  -- Matchs du Tournoi 1 : Championnat Hiver
  INSERT INTO public.matches (id, tournament_id, league_id, format, team_a_player_ids, team_b_player_ids, score_a, score_b, is_ranked, created_by_user_id, created_at)
  VALUES
    (match1_id, tournament1_id, league1_id, '1v1', ARRAY[player1_id]::uuid[], ARRAY[player2_id]::uuid[], 10, 6, true, admin_user_id, NOW() - INTERVAL '30 days'),
    (match2_id, tournament1_id, league1_id, '1v1', ARRAY[player3_id]::uuid[], ARRAY[player4_id]::uuid[], 10, 8, true, admin_user_id, NOW() - INTERVAL '30 days'),
    (match3_id, tournament1_id, league1_id, '1v1', ARRAY[player1_id]::uuid[], ARRAY[player3_id]::uuid[], 10, 7, true, admin_user_id, NOW() - INTERVAL '29 days');
  
  RAISE NOTICE '   ✓ 3 matchs créés pour Tournoi 1';
  
  -- Matchs casual dans la ligue (pas de tournoi)
  INSERT INTO public.matches (id, tournament_id, league_id, format, team_a_player_ids, team_b_player_ids, score_a, score_b, is_ranked, created_by_user_id, created_at)
  VALUES
    (gen_random_uuid(), NULL, league2_id, '1v1', ARRAY[league2_player1_id]::uuid[], ARRAY[league2_player2_id]::uuid[], 10, 4, true, test_user_id, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), NULL, league2_id, '1v1', ARRAY[league2_player2_id]::uuid[], ARRAY[league2_player1_id]::uuid[], 10, 7, true, test_user_id, NOW() - INTERVAL '2 days');
  
  RAISE NOTICE '   ✓ 2 matchs casual créés pour Ligue 2';
  
  -- ============================================================
  -- 3.7 : Créer l'historique ELO pour les matchs
  -- ============================================================
  
  -- Pour le match1 (Admin vs Test dans Tournoi 1)
  INSERT INTO public.elo_history (id, match_id, user_id, tournament_id, league_id, elo_before, elo_after, elo_change, created_at)
  VALUES
    (gen_random_uuid(), match1_id, admin_user_id, tournament1_id, league1_id, 1500, 1520, 20, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), match1_id, test_user_id, tournament1_id, league1_id, 1500, 1480, -20, NOW() - INTERVAL '30 days');
  
  -- Pour le match2 (Alex vs Jordan dans Tournoi 1)
  INSERT INTO public.elo_history (id, match_id, anonymous_user_id, tournament_id, league_id, elo_before, elo_after, elo_change, created_at)
  VALUES
    (gen_random_uuid(), match2_id, anon1_id, tournament1_id, league1_id, 1500, 1518, 18, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), match2_id, anon2_id, tournament1_id, league1_id, 1500, 1482, -18, NOW() - INTERVAL '30 days');
  
  -- Pour le match3 (Admin vs Alex dans Tournoi 1 - finale)
  INSERT INTO public.elo_history (id, match_id, user_id, anonymous_user_id, tournament_id, league_id, elo_before, elo_after, elo_change, created_at)
  VALUES
    (gen_random_uuid(), match3_id, admin_user_id, NULL, tournament1_id, league1_id, 1520, 1542, 22, NOW() - INTERVAL '29 days'),
    (gen_random_uuid(), match3_id, NULL, anon1_id, tournament1_id, league1_id, 1518, 1496, -22, NOW() - INTERVAL '29 days');
  
  RAISE NOTICE '   ✓ Historique ELO créé pour les matchs';
  
  -- ============================================================
  -- FIN : Afficher un résumé
  -- ============================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ====================================';
  RAISE NOTICE '✅ Génération des données terminée !';
  RAISE NOTICE '✅ ====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé des données créées :';
  RAISE NOTICE '   - 2 ligues (Elite Paris, Amicale Lyon)';
  RAISE NOTICE '   - 4 tournois (2 terminés avec matchs, 1 en cours, 1 standalone)';
  RAISE NOTICE '   - 4 utilisateurs anonymes';
  RAISE NOTICE '   - 17 participants aux tournois';
  RAISE NOTICE '   - 6 joueurs dans les ligues';
  RAISE NOTICE '   - 5 matchs (3 en tournoi, 2 casual)';
  RAISE NOTICE '   - Historique ELO pour les matchs principaux';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Users de test conservés :';
  RAISE NOTICE '   - admin@admin.com (password: admin123)';
  RAISE NOTICE '   - test@test.com (password: test123)';
  RAISE NOTICE '';
  RAISE NOTICE '🎮 Prêt pour les tests !';
  
END $$;

-- ============================================================
-- REQUÊTES DE VÉRIFICATION (optionnel)
-- ============================================================

-- Vérifier les ligues créées
SELECT 
  l.name,
  u.pseudo as creator,
  COUNT(DISTINCT lp.id) as players_count,
  COUNT(DISTINCT t.id) as tournaments_count
FROM leagues l
LEFT JOIN users u ON l.creator_user_id = u.id
LEFT JOIN league_players lp ON l.id = lp.league_id
LEFT JOIN tournaments t ON l.id = t.league_id
GROUP BY l.id, l.name, u.pseudo
ORDER BY l.created_at;

-- Vérifier les tournois créés
SELECT 
  t.name,
  t.date,
  t.is_finished,
  l.name as league_name,
  COUNT(DISTINCT tp.id) as participants_count,
  COUNT(DISTINCT m.id) as matches_count
FROM tournaments t
LEFT JOIN leagues l ON t.league_id = l.id
LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
LEFT JOIN matches m ON t.id = m.tournament_id
GROUP BY t.id, t.name, t.date, t.is_finished, l.name
ORDER BY t.date DESC;

-- Vérifier les matchs créés
SELECT 
  m.id,
  t.name as tournament_name,
  l.name as league_name,
  m.format,
  m.score_a,
  m.score_b,
  m.created_at
FROM matches m
LEFT JOIN tournaments t ON m.tournament_id = t.id
LEFT JOIN leagues l ON m.league_id = l.id
ORDER BY m.created_at DESC;

-- Afficher un leaderboard simple de la Ligue Elite Paris
SELECT 
  COALESCE(u.pseudo, au.pseudo) as player_name,
  COUNT(DISTINCT m.id) as matches_played,
  SUM(CASE 
    WHEN lp.id = ANY(m.team_a_player_ids) AND m.score_a > m.score_b THEN 1
    WHEN lp.id = ANY(m.team_b_player_ids) AND m.score_b > m.score_a THEN 1
    ELSE 0
  END) as wins,
  COALESCE(
    (SELECT elo_after FROM elo_history eh 
     WHERE (eh.user_id = lp.user_id OR eh.anonymous_user_id = lp.anonymous_user_id)
     AND eh.league_id = lp.league_id
     ORDER BY eh.created_at DESC LIMIT 1),
    1500
  ) as current_elo
FROM league_players lp
LEFT JOIN users u ON lp.user_id = u.id
LEFT JOIN anonymous_users au ON lp.anonymous_user_id = au.id
LEFT JOIN matches m ON (
  lp.league_id = m.league_id AND (
    lp.id = ANY(m.team_a_player_ids) OR 
    lp.id = ANY(m.team_b_player_ids)
  )
)
WHERE lp.league_id IN (SELECT id FROM leagues WHERE name = '🏆 Ligue Elite Paris')
GROUP BY lp.id, u.pseudo, au.pseudo, lp.user_id, lp.anonymous_user_id, lp.league_id
ORDER BY current_elo DESC;
