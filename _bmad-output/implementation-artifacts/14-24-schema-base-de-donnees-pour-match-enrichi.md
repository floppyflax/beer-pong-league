# Story 14.24: Database schema for enriched match

Status: review

## Story

As a developer,
I want the DB schema for cups_remaining and photo_url,
So that matches can store this optional data.

## Acceptance Criteria

1. **Given** the need for enriched data
   **When** I create the migration
   **Then** `matches` has `cups_remaining` (integer, nullable)

2. `matches` has `photo_url` (text, nullable)

3. Migration in `supabase/migrations/`

4. Zod schemas and TypeScript types updated

## Tasks / Subtasks

- [x] Task 1: Supabase migration (AC: 1, 2, 3)
  - [x] Create SQL migration
  - [x] cups_remaining INTEGER NULL
  - [x] photo_url TEXT NULL
  - [x] Rollback safe
- [x] Task 2: Zod and TypeScript (AC: 4)
  - [x] src/utils/validation.ts
  - [x] src/types.ts
  - [x] Extended Match type

## Dev Notes

- **Source:** design-system-convergence section 7
- cups_remaining: 1–10, winning team only
- photo_url: Supabase Storage URL

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

Cursor / Composer

### Debug Log References

### Completion Notes List

- Migration 008_add_match_enriched_fields.sql: added cups_remaining (INTEGER NULL, CHECK 1-10) and photo_url (TEXT NULL) to matches
- Updated Match interface in src/types.ts with cups_remaining and photo_url
- Updated matchSchema in src/utils/validation.ts with validation (cups_remaining 1-10, photo_url URL)
- DatabaseService: map new fields on load (leagues/tournaments) and save (league/tournament/recordMatch/recordTournamentMatch)
- Added 3 unit tests for enriched match validation

### File List

- supabase/migrations/008_add_match_enriched_fields.sql
- src/types.ts
- src/utils/validation.ts
- src/services/DatabaseService.ts
- tests/unit/validation/validation.test.ts

## Change Log

- 2026-02-13: Story 14-24 implemented — migration, types, validation, DatabaseService mapping, unit tests
