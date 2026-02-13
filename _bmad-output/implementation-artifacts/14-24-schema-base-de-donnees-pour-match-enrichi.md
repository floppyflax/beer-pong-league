# Story 14.24: Database schema for enriched match

Status: ready-for-dev

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

- [ ] Task 1: Supabase migration (AC: 1, 2, 3)
  - [ ] Create SQL migration
  - [ ] cups_remaining INTEGER NULL
  - [ ] photo_url TEXT NULL
  - [ ] Rollback safe
- [ ] Task 2: Zod and TypeScript (AC: 4)
  - [ ] src/utils/validation.ts
  - [ ] src/types.ts
  - [ ] Extended Match type

## Dev Notes

- **Source:** design-system-convergence section 7
- cups_remaining: 1–10, winning team only
- photo_url: Supabase Storage URL

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
