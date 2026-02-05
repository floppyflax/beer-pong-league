-- Migration: Create atomic identity merge function
-- This ensures all migrations happen in a transaction or none at all

CREATE OR REPLACE FUNCTION merge_anonymous_identity(
  p_anonymous_user_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_league_count INT := 0;
  v_tournament_count INT := 0;
  v_match_count INT := 0;
BEGIN
  -- Start implicit transaction
  
  -- 1. Mark anonymous user as merged first
  UPDATE anonymous_users 
  SET 
    merged_to_user_id = p_user_id,
    merged_at = NOW()
  WHERE id = p_anonymous_user_id
  AND merged_to_user_id IS NULL; -- Prevent double merge
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anonymous user not found or already merged';
  END IF;
  
  -- 2. Migrate league_players (with conflict handling)
  WITH league_migration AS (
    SELECT 
      lp.id,
      lp.league_id,
      EXISTS (
        SELECT 1 FROM league_players 
        WHERE league_id = lp.league_id 
        AND user_id = p_user_id
      ) as user_exists
    FROM league_players lp
    WHERE lp.anonymous_user_id = p_anonymous_user_id
  )
  UPDATE league_players lp
  SET 
    user_id = p_user_id,
    anonymous_user_id = NULL,
    updated_at = NOW()
  FROM league_migration lm
  WHERE lp.id = lm.id
  AND NOT lm.user_exists;
  
  GET DIAGNOSTICS v_league_count = ROW_COUNT;
  
  -- Delete duplicate entries where user already exists
  DELETE FROM league_players
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- 3. Migrate tournament_players (with conflict handling)
  WITH tournament_migration AS (
    SELECT 
      tp.id,
      tp.tournament_id,
      EXISTS (
        SELECT 1 FROM tournament_players 
        WHERE tournament_id = tp.tournament_id 
        AND user_id = p_user_id
      ) as user_exists
    FROM tournament_players tp
    WHERE tp.anonymous_user_id = p_anonymous_user_id
  )
  UPDATE tournament_players tp
  SET 
    user_id = p_user_id,
    anonymous_user_id = NULL,
    updated_at = NOW()
  FROM tournament_migration tm
  WHERE tp.id = tm.id
  AND NOT tm.user_exists;
  
  GET DIAGNOSTICS v_tournament_count = ROW_COUNT;
  
  -- Delete duplicate entries
  DELETE FROM tournament_players
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- 4. Migrate matches (update player IDs in arrays) - SERVER SIDE!
  UPDATE matches
  SET 
    team_a_player_ids = array_replace(team_a_player_ids, p_anonymous_user_id::text, p_user_id::text),
    team_b_player_ids = array_replace(team_b_player_ids, p_anonymous_user_id::text, p_user_id::text),
    updated_at = NOW()
  WHERE 
    p_anonymous_user_id::text = ANY(team_a_player_ids)
    OR p_anonymous_user_id::text = ANY(team_b_player_ids);
  
  GET DIAGNOSTICS v_match_count = ROW_COUNT;
  
  -- 5. Migrate elo_history
  UPDATE elo_history
  SET 
    user_id = p_user_id,
    anonymous_user_id = NULL
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- 6. Migrate league creators
  UPDATE leagues
  SET 
    creator_user_id = p_user_id,
    creator_anonymous_user_id = NULL,
    updated_at = NOW()
  WHERE creator_anonymous_user_id = p_anonymous_user_id;
  
  -- 7. Migrate tournament creators
  UPDATE tournaments
  SET 
    creator_user_id = p_user_id,
    creator_anonymous_user_id = NULL,
    updated_at = NOW()
  WHERE creator_anonymous_user_id = p_anonymous_user_id;
  
  -- 8. Migrate match creators
  UPDATE matches
  SET 
    created_by_user_id = p_user_id,
    created_by_anonymous_user_id = NULL,
    updated_at = NOW()
  WHERE created_by_anonymous_user_id = p_anonymous_user_id;
  
  -- 9. Create merge audit record
  INSERT INTO user_identity_merges (
    anonymous_user_id,
    user_id,
    stats_migrated,
    merged_at
  ) VALUES (
    p_anonymous_user_id,
    p_user_id,
    true,
    NOW()
  );
  
  -- Build success result
  v_result := json_build_object(
    'success', true,
    'leagues_migrated', v_league_count,
    'tournaments_migrated', v_tournament_count,
    'matches_migrated', v_match_count
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RAISE EXCEPTION 'Identity merge failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION merge_anonymous_identity TO authenticated;
GRANT EXECUTE ON FUNCTION merge_anonymous_identity TO anon;

COMMENT ON FUNCTION merge_anonymous_identity IS 
'Atomically merges anonymous user identity to authenticated user. All operations in transaction.';
