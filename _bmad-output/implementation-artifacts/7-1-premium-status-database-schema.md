# Story 7.1: Premium Status Database Schema

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want premium status stored in the database,
so that user premium access can be tracked and verified.

## Acceptance Criteria

1. **Given** the need to track premium status
   **When** I create the database migration
   **Then** `users` table has `is_premium` boolean column (default false)
   **And** `anonymous_users` table has `is_premium` boolean column (default false)
   **And** indexes are created for efficient premium status queries
   **And** migration is created in `supabase/migrations/005_add_premium_status.sql`
   **And** migration can be rolled back safely

## Tasks / Subtasks

- [ ] Task 1: Create migration file (AC: 1)
  - [ ] Create `supabase/migrations/005_add_premium_status.sql`
  - [ ] Add migration header with description
  - [ ] Add `is_premium` column to `users` table with `IF NOT EXISTS` clause
  - [ ] Add `is_premium` column to `anonymous_users` table with `IF NOT EXISTS` clause
  - [ ] Set default value to `false` for both columns
  - [ ] Add migration footer comment
- [ ] Task 2: Create indexes for performance (AC: 1)
  - [ ] Create partial index on `users.is_premium` WHERE `is_premium = true`
  - [ ] Create partial index on `anonymous_users.is_premium` WHERE `is_premium = true`
  - [ ] Use `IF NOT EXISTS` clause for indexes
- [ ] Task 3: Test migration (AC: 1)
  - [ ] Test migration applies successfully
  - [ ] Verify columns exist with correct defaults
  - [ ] Verify indexes are created
  - [ ] Test backward compatibility (existing data remains unchanged)
  - [ ] Document rollback procedure if needed

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Database Migration Pattern:**
- Follow existing migration pattern from `001_initial_schema.sql`, `002_add_anti_cheat.sql`, `003_merge_identity_function.sql`, `004_add_tournament_format_location.sql`
- Use standardized migration header format:
  ```sql
  -- ============================================
  -- Migration: [Name]
  -- Description: [Description]
  -- ============================================
  ```
- Always use `IF NOT EXISTS` clauses to prevent errors on re-run
- Use `IF NOT EXISTS` for indexes to prevent duplicate index errors
- Add migration footer: `-- ============================================ -- END OF MIGRATION -- ============================================`

**Column Addition Pattern:**
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` syntax
- Set appropriate default values (`false` for boolean premium status)
- Ensure backward compatibility - existing rows get default value

**Index Strategy:**
- Create partial indexes (WHERE clause) for boolean columns to optimize queries
- Pattern: `CREATE INDEX IF NOT EXISTS idx_[table]_[column] ON [table]([column]) WHERE [column] = true`
- This creates smaller, more efficient indexes that only include premium users
- Reference: Similar pattern used in `002_add_anti_cheat.sql` for `idx_matches_status`

**Table Structure:**
- `users` table: Extends `auth.users`, stores authenticated user profiles
- `anonymous_users` table: Stores device-bound anonymous user profiles
- Both tables need premium status to support freemium model
- Premium is only available for authenticated users, but we add column to `anonymous_users` for consistency and future-proofing

### Source Tree Components to Touch

**Files to Create:**
- `supabase/migrations/005_add_premium_status.sql` - New migration file

**Files to Reference (for pattern consistency):**
- `supabase/migrations/001_initial_schema.sql` - Initial table definitions
- `supabase/migrations/002_add_anti_cheat.sql` - Example of adding columns and indexes
- `supabase/migrations/004_add_tournament_format_location.sql` - Example of simple column additions

**Documentation to Update:**
- `docs/data-models.md` - Add `is_premium` column to table documentation (if exists)

### Testing Standards Summary

**Migration Testing:**
- Test migration applies without errors
- Verify columns exist: `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_premium';`
- Verify indexes exist: `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%premium%';`
- Test backward compatibility: Existing rows should have `is_premium = false`
- Test new rows: Insert test row and verify default value is `false`

**Rollback Testing (if needed):**
- Document rollback SQL (DROP COLUMN, DROP INDEX)
- Test rollback procedure
- Verify no data loss on rollback

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Migration file follows naming convention: `###_description.sql` (005_add_premium_status.sql)
- ✅ Migration location: `supabase/migrations/` (consistent with existing migrations)
- ✅ SQL follows PostgreSQL/Supabase conventions
- ✅ Uses snake_case for column names (`is_premium`)
- ✅ Follows existing migration patterns and structure

**Detected Conflicts or Variances:**
- None - this is a straightforward schema addition following established patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7] Epic 7: Freemium Payment Model & Premium Features
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.1] Story 7.1: Premium Status Database Schema

**Database Schema:**
- [Source: supabase/migrations/001_initial_schema.sql] Initial schema with `users` and `anonymous_users` table definitions
- [Source: supabase/migrations/002_add_anti_cheat.sql] Example of adding columns and creating partial indexes
- [Source: supabase/migrations/004_add_tournament_format_location.sql] Example of simple column additions with defaults
- [Source: docs/data-models.md] Data model documentation (if exists)

**Architecture Patterns:**
- [Source: _bmad-output/planning-artifacts/architecture.md] Database schema boundaries and migration patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Boundaries] Data access patterns and schema structure

**Technical Requirements:**
- Premium status must be boolean (`BOOLEAN DEFAULT false`)
- Indexes should be partial indexes for performance (WHERE `is_premium = true`)
- Migration must be backward compatible (existing data gets default value)
- Migration file must follow naming convention: `005_add_premium_status.sql`

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
