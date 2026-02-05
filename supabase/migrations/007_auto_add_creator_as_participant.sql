-- ============================================
-- Migration: Auto-add Tournament Creator as Participant
-- Story: 8.6
-- Description: Automatically add tournament creator as first participant when tournament is created
-- ============================================

-- Function to add creator as participant
CREATE OR REPLACE FUNCTION add_creator_as_tournament_participant()
RETURNS TRIGGER AS $$
DECLARE
  creator_pseudo TEXT;
BEGIN
  -- Handle authenticated user
  IF NEW.creator_user_id IS NOT NULL THEN
    -- Get user's pseudo
    SELECT pseudo INTO creator_pseudo 
    FROM users 
    WHERE id = NEW.creator_user_id;
    
    -- Default if not found
    IF creator_pseudo IS NULL THEN
      creator_pseudo := 'Créateur';
    END IF;
    
    -- Insert creator as first participant
    INSERT INTO tournament_players (
      tournament_id, 
      user_id, 
      pseudo_in_tournament,
      joined_at
    )
    VALUES (
      NEW.id, 
      NEW.creator_user_id, 
      creator_pseudo,
      NOW()
    );
    
  -- Handle anonymous user
  ELSIF NEW.creator_anonymous_user_id IS NOT NULL THEN
    -- Get anonymous user's pseudo
    SELECT pseudo INTO creator_pseudo 
    FROM anonymous_users 
    WHERE id = NEW.creator_anonymous_user_id;
    
    -- Default if not found
    IF creator_pseudo IS NULL THEN
      creator_pseudo := 'Créateur';
    END IF;
    
    -- Insert creator as first participant
    INSERT INTO tournament_players (
      tournament_id, 
      anonymous_user_id, 
      pseudo_in_tournament,
      joined_at
    )
    VALUES (
      NEW.id, 
      NEW.creator_anonymous_user_id, 
      creator_pseudo,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires AFTER tournament insert
CREATE TRIGGER tournament_add_creator_trigger
  AFTER INSERT ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_tournament_participant();

-- ============================================
-- Comments for future developers
-- ============================================
COMMENT ON FUNCTION add_creator_as_tournament_participant() IS 
  'Automatically adds tournament creator as first participant. Handles both authenticated and anonymous users.';

COMMENT ON TRIGGER tournament_add_creator_trigger ON tournaments IS 
  'Ensures tournament creator is automatically added to tournament_players table.';
