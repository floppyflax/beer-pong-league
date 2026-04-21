-- ============================================================
-- Script pour ajouter des matchs fictifs aux tournois de devadmin@test.com
-- ============================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Prérequis : Exécuter ADD_TOURNAMENTS_DEVADMIN.sql d'abord (ou avoir des tournois existants)
-- ============================================================

DO $$
DECLARE
  devadmin_user_id UUID;
  tournament_rec RECORD;
  players_in_tournament UUID[];
  player_count INT;
  p1_id UUID;
  p2_id UUID;
  p3_id UUID;
  p4_id UUID;
  match_id UUID;
  i INT;
BEGIN
  -- 1. Récupérer l'ID de devadmin@test.com
  SELECT id INTO devadmin_user_id 
  FROM auth.users 
  WHERE email = 'devadmin@test.com';
  
  IF devadmin_user_id IS NULL THEN
    RAISE EXCEPTION 'Le compte devadmin@test.com n''existe pas. Veuillez le créer d''abord dans Supabase Auth.';
  END IF;
  
  RAISE NOTICE '✅ User devadmin@test.com trouvé: %', devadmin_user_id;
  
  -- 2. Parcourir tous les tournois où devadmin participe (créateur ou participant)
  FOR tournament_rec IN (
    SELECT t.id, t.name, t.format, t.league_id
    FROM tournaments t
    WHERE t.creator_user_id = devadmin_user_id
       OR EXISTS (
         SELECT 1 FROM tournament_players tp 
         WHERE tp.tournament_id = t.id AND tp.user_id = devadmin_user_id
       )
  )
  LOOP
    -- 3. Récupérer les IDs des tournament_players pour ce tournoi
    SELECT ARRAY_AGG(id ORDER BY joined_at) 
    INTO players_in_tournament
    FROM tournament_players 
    WHERE tournament_id = tournament_rec.id;
    
    player_count := COALESCE(array_length(players_in_tournament, 1), 0);
    
    IF player_count < 2 THEN
      RAISE NOTICE '   ⏭ Tournoi "%" : pas assez de joueurs (%), skip', tournament_rec.name, player_count;
      CONTINUE;
    END IF;
    
    -- Vérifier si des matchs existent déjà pour ce tournoi
    IF EXISTS (SELECT 1 FROM matches WHERE tournament_id = tournament_rec.id) THEN
      RAISE NOTICE '   ⏭ Tournoi "%" : matchs déjà présents, skip', tournament_rec.name;
      CONTINUE;
    END IF;
    
    p1_id := players_in_tournament[1];
    p2_id := players_in_tournament[2];
    p3_id := players_in_tournament[3];
    p4_id := players_in_tournament[4];
    
    RAISE NOTICE '   📝 Ajout de matchs pour "%" (format: %, % joueurs)', tournament_rec.name, tournament_rec.format, player_count;
    
    -- 4. Créer des matchs selon le format et le nombre de joueurs
    IF tournament_rec.format = '1v1' AND player_count >= 2 THEN
      -- 1v1 : 5 matchs entre p1 et p2 (avec scores variés)
      FOR i IN 1..5 LOOP
        match_id := gen_random_uuid();
        INSERT INTO matches (id, tournament_id, league_id, format, team_a_player_ids, team_b_player_ids, score_a, score_b, created_at, created_by_user_id)
        VALUES (
          match_id,
          tournament_rec.id,
          tournament_rec.league_id,
          '1v1',
          ARRAY[p1_id],
          ARRAY[p2_id],
          CASE WHEN i <= 3 THEN 10 ELSE 8 END,
          CASE WHEN i <= 3 THEN 10 - i ELSE 10 END,
          NOW() - (i || ' days')::INTERVAL,
          devadmin_user_id
        );
      END LOOP;
      RAISE NOTICE '      ✓ 5 matchs 1v1 créés';
      
    ELSIF tournament_rec.format = '2v2' AND player_count >= 4 THEN
      -- 2v2 : 6 matchs (p1+p2 vs p3+p4)
      FOR i IN 1..6 LOOP
        match_id := gen_random_uuid();
        INSERT INTO matches (id, tournament_id, league_id, format, team_a_player_ids, team_b_player_ids, score_a, score_b, created_at, created_by_user_id)
        VALUES (
          match_id,
          tournament_rec.id,
          tournament_rec.league_id,
          '2v2',
          ARRAY[p1_id, p2_id],
          ARRAY[p3_id, p4_id],
          CASE WHEN i % 2 = 1 THEN 10 ELSE 7 END,
          CASE WHEN i % 2 = 1 THEN 10 - (i % 5) ELSE 10 END,
          NOW() - (i || ' days')::INTERVAL,
          devadmin_user_id
        );
      END LOOP;
      RAISE NOTICE '      ✓ 6 matchs 2v2 créés';
      
    ELSIF tournament_rec.format = '2v2' AND player_count >= 2 THEN
      -- 2v2 avec seulement 2 ou 3 joueurs : matchs 1v1 (format adapté)
      FOR i IN 1..4 LOOP
        match_id := gen_random_uuid();
        INSERT INTO matches (id, tournament_id, league_id, format, team_a_player_ids, team_b_player_ids, score_a, score_b, created_at, created_by_user_id)
        VALUES (
          match_id,
          tournament_rec.id,
          tournament_rec.league_id,
          '1v1',
          ARRAY[p1_id],
          ARRAY[p2_id],
          CASE WHEN i <= 2 THEN 10 ELSE 9 END,
          CASE WHEN i <= 2 THEN 10 - i ELSE 10 END,
          NOW() - (i || ' days')::INTERVAL,
          devadmin_user_id
        );
      END LOOP;
      RAISE NOTICE '      ✓ 4 matchs 1v1 créés (tournoi 2v2 avec seulement 2 joueurs)';
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Matchs fictifs ajoutés pour devadmin@test.com';
  RAISE NOTICE '🎮 Rafraîchis la page pour voir l''historique des matchs !';
  
END $$;

-- ============================================================
-- REQUÊTE DE VÉRIFICATION
-- ============================================================

-- Voir les matchs par tournoi
SELECT 
  t.name as tournoi,
  t.format,
  COUNT(m.id) as nb_matchs
FROM tournaments t
LEFT JOIN matches m ON m.tournament_id = t.id
WHERE t.creator_user_id = (SELECT id FROM auth.users WHERE email = 'devadmin@test.com')
GROUP BY t.id, t.name, t.format
ORDER BY t.created_at DESC;
