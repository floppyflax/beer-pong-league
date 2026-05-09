---
name: postgres-rpc
description: Write or review a Supabase Postgres RPC (PL/pgSQL function) for this project. Use when adding a SECURITY DEFINER function (anti-cheat, admin actions, server-side calc), or when a migration fails in the Supabase Dashboard SQL Editor with "unterminated dollar-quoted string". Trigger on supabase/migrations/* changes that introduce CREATE FUNCTION.
---

# Postgres RPC — Beer Pong League

Companion skill to [`supabase-migrations`](../supabase-migrations/SKILL.md).
Use this when writing PL/pgSQL functions (especially `SECURITY DEFINER`
ones) — there are non-obvious traps that have already bitten this codebase.

## Pattern — SECURITY DEFINER RPC

```sql
CREATE OR REPLACE FUNCTION public.my_rpc(p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  prev_value INTEGER;
  next_value INTEGER;
  already_applied BOOLEAN;
BEGIN
  -- 1. Lock the target row WITHOUT capturing its data into a record.
  --    Use PERFORM, NOT `SELECT ... INTO record FOR UPDATE`. See §Dashboard bug.
  PERFORM 1 FROM public.target_table WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'my_rpc: target % not found', p_target_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Read field-by-field with scalar subqueries (lock is already held).
  prev_value := (SELECT some_col FROM public.target_table WHERE id = p_target_id);

  -- 3. Anti-replay (idempotency) — refuse if a side-effect already happened.
  already_applied := EXISTS(
    SELECT 1 FROM public.audit_log WHERE source_id = p_target_id
  );
  IF already_applied THEN
    RAISE EXCEPTION 'my_rpc: % already applied', p_target_id
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 4. Compute and write.
  next_value := prev_value + 1;
  UPDATE public.target_table SET some_col = next_value WHERE id = p_target_id;
  INSERT INTO public.audit_log (source_id, before, after) VALUES (p_target_id, prev_value, next_value);
END;
$fn$;

COMMENT ON FUNCTION public.my_rpc(UUID) IS 'One-line description for `\df+`.';

-- 5. Grant: only authenticated and anon clients should invoke. service_role inherits.
GRANT EXECUTE ON FUNCTION public.my_rpc(UUID) TO authenticated, anon;
```

Internal helpers (functions called only from another `SECURITY DEFINER`
function, never exposed to clients) get **no GRANT** — that's the safety
net.

## ⚠️ Supabase Dashboard SQL Editor bug — use `:=`, NEVER `SELECT ... INTO`

**Symptom**: when pasting a migration that contains a `SELECT col INTO var
FROM table` inside a PL/pgSQL function body into the Dashboard SQL Editor,
you get:

```
ERROR:  42601: unterminated dollar-quoted string at or near "$$"
…
-- Added by Supabase: enable Row Level Security on newly created tables
ALTER TABLE v_match ENABLE ROW LEVEL SECURITY;
```

**Cause**: the Dashboard SQL Editor naively parses `SELECT … INTO foo`
even inside a function body as if it were the `SELECT INTO new_table`
shorthand for `CREATE TABLE`. It auto-injects `ALTER TABLE foo ENABLE ROW
LEVEL SECURITY` mid-function, which terminates the dollar-quoted block
prematurely.

**Fix**: replace **every** `SELECT col INTO var FROM table WHERE …` with an
explicit assignment via scalar subquery:

```sql
-- ❌ Triggers the bug:
SELECT col INTO var FROM table WHERE id = p_id;

-- ✅ Equivalent, parser-safe:
var := (SELECT col FROM table WHERE id = p_id);
```

For `SELECT EXISTS(...) INTO var`:

```sql
-- ❌ var := (SELECT EXISTS(SELECT 1 FROM tbl WHERE …)) -- works but verbose
-- ✅
var := EXISTS(SELECT 1 FROM public.tbl WHERE …);
```

For `SELECT … INTO record FOR UPDATE` (locking + reading at once):

```sql
-- ❌ Triggers the bug AND the parser loses the lock semantics:
SELECT * INTO v_row FROM public.tbl WHERE id = p_id FOR UPDATE;

-- ✅ Split into a PERFORM (lock) + scalar subqueries (read):
PERFORM 1 FROM public.tbl WHERE id = p_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION '...'; END IF;
v_some_col := (SELECT some_col FROM public.tbl WHERE id = p_id);
```

**Note**: this only affects the Dashboard SQL Editor. The CLI (`supabase
db push`, `supabase migration up`) accepts both forms. We standardize on
the parser-safe form so any contributor can paste a migration into the
Dashboard if needed.

## Variable naming — avoid colliding with column names

PL/pgSQL throws on ambiguity when a local var has the same name as a
column referenced in the same statement. Don't:

```sql
DECLARE wins INTEGER; -- ❌ collides with public.event_memberships.wins
BEGIN
  UPDATE public.event_memberships SET wins = wins + 1 WHERE …;
  --                                       ^^^^ which one?
END;
```

Do:

```sql
DECLARE prev_wins INTEGER; next_wins INTEGER; -- ✅ clear
BEGIN
  prev_wins := (SELECT wins FROM public.event_memberships WHERE …);
  next_wins := prev_wins + 1;
  UPDATE public.event_memberships SET wins = next_wins WHERE …;
END;
```

## RAISE EXCEPTION — pick the right ERRCODE

So clients can branch on `error.code`:

| Situation | ERRCODE |
|---|---|
| Row not found | `no_data_found` |
| Idempotency / replay | `unique_violation` |
| Domain rule violated (ranked=false, ties, …) | `check_violation` |
| Caller not authorized | `insufficient_privilege` |

## Canonical example

`supabase/migrations/025_elo_server_side.sql` implements the full pattern
(`apply_match_elo`, `_apply_elo_for_player`, `recalculate_league_elo`).
Look at it for the lock-then-read split, the variable naming convention,
and the helper-function pattern.

## When NOT to use a SECURITY DEFINER function

If the operation can be done via a normal `INSERT` / `UPDATE` with RLS
policies that already permit it — do that. `SECURITY DEFINER` bypasses
RLS entirely, so every line of it is critical-path. Reserve it for:

- Server-side calculation that must be authoritative (anti-cheat).
- Cross-table writes that no single RLS policy can express cleanly.
- Admin recovery paths called only by trusted callers.
