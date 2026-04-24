-- Migration 015 — Ghost invite tokens (admin → claim-by-link)
--
-- Context: an admin who manually adds a guest "Florian" wants to send Florian
-- a one-tap link that proves "this row is yours" without making Florian dig
-- through the join page. The URL `/<context>/:id/join?ghost=TOKEN` should
-- auto-claim the row server-side using a single-use, time-limited token.
--
-- Threat model:
--   - Token bound to a specific (kind, player_id) row.
--   - Single use → status flips from 'active' to 'consumed' on first claim.
--   - Optional expiry → defaults 30 days.
--   - Generated only by the row's CONTEXT admin (creator).
--   - Consumable by anyone holding the token (whether anon or authenticated).
--   - Once the underlying row is claimed by other means, the token becomes
--     a no-op on consume (the RPC short-circuits if the row is already
--     user/anon-owned by the caller).

CREATE TABLE IF NOT EXISTS ghost_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('tournament', 'league')),
  player_id UUID NOT NULL,
  context_id UUID NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  consumed_at TIMESTAMPTZ,
  consumed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consumed_by_anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (created_by_user_id IS NOT NULL AND created_by_anonymous_user_id IS NULL)
    OR (created_by_user_id IS NULL AND created_by_anonymous_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_ghost_invite_tokens_token ON ghost_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_ghost_invite_tokens_player ON ghost_invite_tokens(kind, player_id);
CREATE INDEX IF NOT EXISTS idx_ghost_invite_tokens_context ON ghost_invite_tokens(context_id);

-- RLS: rows are managed only via the RPCs below. We enable RLS and add a
-- single read policy for context admins who want to list active tokens for
-- a player they manage. Writes go through SECURITY DEFINER RPCs only.
ALTER TABLE ghost_invite_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ghost_invite_tokens_read_admin ON ghost_invite_tokens;
CREATE POLICY ghost_invite_tokens_read_admin ON ghost_invite_tokens
  FOR SELECT
  USING (
    -- Tournament admins: creator_user_id = auth.uid()
    (kind = 'tournament' AND EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = context_id AND t.creator_user_id = auth.uid()
    ))
    -- League admins: creator_user_id = auth.uid()
    OR (kind = 'league' AND EXISTS (
      SELECT 1 FROM leagues l
      WHERE l.id = context_id AND l.creator_user_id = auth.uid()
    ))
  );

-- ──────────────────────────────────────────────────────────────────────
-- generate_ghost_invite_token
--   Caller must be the context admin (auth.uid() = tournament.creator_user_id
--   or league.creator_user_id). Returns a fresh token.
--   For POC, ANY existing active token for the same player is left in place;
--   callers can revoke by calling revoke_ghost_invite_token first.
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_ghost_invite_token(
  p_kind TEXT,
  p_player_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_context_id UUID;
  v_creator UUID;
  v_anonymous_user_id UUID;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required to generate invite tokens';
  END IF;

  IF p_kind NOT IN ('tournament', 'league') THEN
    RAISE EXCEPTION 'Invalid kind: %, expected tournament|league', p_kind;
  END IF;

  -- Resolve context + verify the target row is still anonymous (otherwise
  -- generating a claim token for an owned row makes no sense).
  IF p_kind = 'tournament' THEN
    SELECT tp.tournament_id, tp.anonymous_user_id, t.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM tournament_players tp
    JOIN tournaments t ON t.id = tp.tournament_id
    WHERE tp.id = p_player_id;
  ELSE
    SELECT lp.league_id, lp.anonymous_user_id, l.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM league_players lp
    JOIN leagues l ON l.id = lp.league_id
    WHERE lp.id = p_player_id;
  END IF;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'Player row not found';
  END IF;

  IF v_creator IS NULL OR v_creator <> v_caller THEN
    RAISE EXCEPTION 'Only the context admin can generate invite tokens';
  END IF;

  IF v_anonymous_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot generate invite token for an already-claimed player';
  END IF;

  -- 32-char URL-safe token (pgcrypto random bytes → hex).
  v_token := encode(gen_random_bytes(16), 'hex');
  v_expires_at := NOW() + INTERVAL '30 days';

  INSERT INTO ghost_invite_tokens (
    token, kind, player_id, context_id,
    created_by_user_id, expires_at
  ) VALUES (
    v_token, p_kind, p_player_id, v_context_id,
    v_caller, v_expires_at
  );

  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_ghost_invite_token TO authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- revoke_ghost_invite_token
--   Context admin marks a token as revoked. No-op if already consumed.
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION revoke_ghost_invite_token(
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_kind TEXT;
  v_context_id UUID;
  v_status TEXT;
  v_creator UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required';
  END IF;

  SELECT kind, context_id, status
    INTO v_kind, v_context_id, v_status
  FROM ghost_invite_tokens
  WHERE token = p_token
  FOR UPDATE;

  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Token not found';
  END IF;

  IF v_kind = 'tournament' THEN
    SELECT creator_user_id INTO v_creator FROM tournaments WHERE id = v_context_id;
  ELSE
    SELECT creator_user_id INTO v_creator FROM leagues WHERE id = v_context_id;
  END IF;

  IF v_creator IS NULL OR v_creator <> v_caller THEN
    RAISE EXCEPTION 'Only the context admin can revoke invite tokens';
  END IF;

  IF v_status = 'active' THEN
    UPDATE ghost_invite_tokens
       SET status = 'revoked'
     WHERE token = p_token;
  END IF;

  RETURN json_build_object('success', true, 'previous_status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_ghost_invite_token TO authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- claim_ghost_by_token
--   Consumes a token and reassigns the underlying ghost row to the caller.
--   Routes to the proper claim function based on caller identity:
--     - p_user_id provided → claim_anonymous_player (auth required)
--     - p_anonymous_user_id provided → claim_anonymous_player_anon
--   The caller passes ONE of the two (XOR enforced).
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_ghost_by_token(
  p_token TEXT,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kind TEXT;
  v_player_id UUID;
  v_context_id UUID;
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
  v_claim_result JSON;
BEGIN
  IF (p_user_id IS NULL AND p_anonymous_user_id IS NULL)
     OR (p_user_id IS NOT NULL AND p_anonymous_user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Exactly one of p_user_id or p_anonymous_user_id must be provided';
  END IF;

  -- Lock the token row to prevent double-consume races.
  SELECT kind, player_id, context_id, status, expires_at
    INTO v_kind, v_player_id, v_context_id, v_status, v_expires_at
  FROM ghost_invite_tokens
  WHERE token = p_token
  FOR UPDATE;

  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Token not found';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Token is %', v_status;
  END IF;

  IF v_expires_at < NOW() THEN
    UPDATE ghost_invite_tokens
       SET status = 'revoked'
     WHERE token = p_token;
    RAISE EXCEPTION 'Token expired';
  END IF;

  -- Delegate to the appropriate claim RPC.
  IF p_user_id IS NOT NULL THEN
    -- Auth claim: requires auth.uid() = p_user_id (enforced inside callee).
    v_claim_result := claim_anonymous_player(v_kind, v_player_id, p_user_id);
  ELSE
    v_claim_result := claim_anonymous_player_anon(v_kind, v_player_id, p_anonymous_user_id);
  END IF;

  -- Mark token consumed.
  UPDATE ghost_invite_tokens
     SET status = 'consumed',
         consumed_at = NOW(),
         consumed_by_user_id = p_user_id,
         consumed_by_anonymous_user_id = p_anonymous_user_id
   WHERE token = p_token;

  RETURN json_build_object(
    'success', true,
    'kind', v_kind,
    'context_id', v_context_id,
    'player_id', v_player_id,
    'claim', v_claim_result
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Token claim failed: %', SQLERRM;
END;
$$;

-- Anonymous callers must be able to consume; admin-only paths are the
-- generate/revoke flows above.
GRANT EXECUTE ON FUNCTION claim_ghost_by_token TO anon, authenticated;

COMMENT ON TABLE ghost_invite_tokens IS
'Single-use, time-limited tokens that let an admin send a "claim this ghost player" link to a teammate. Consumed by the join flow when URL has ?ghost=TOKEN.';
COMMENT ON FUNCTION generate_ghost_invite_token IS
'Context admin generates a fresh invite token bound to a specific ghost player row.';
COMMENT ON FUNCTION revoke_ghost_invite_token IS
'Context admin revokes an active invite token.';
COMMENT ON FUNCTION claim_ghost_by_token IS
'Consumes a ghost invite token and reassigns the underlying player row to the caller (authenticated or anonymous).';
