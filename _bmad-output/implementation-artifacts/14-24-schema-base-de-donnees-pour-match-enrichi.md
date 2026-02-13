# Story 14.24: Schéma base de données pour match enrichi

Status: ready-for-dev

## Story

As a developer,
I want le schéma DB pour cups_remaining et photo_url,
So que les matchs puissent stocker ces données optionnelles.

## Acceptance Criteria

1. **Given** le besoin de données enrichies
   **When** je crée la migration
   **Then** `matches` a `cups_remaining` (integer, nullable)

2. `matches` a `photo_url` (text, nullable)

3. Migration dans `supabase/migrations/`

4. Schémas Zod et types TypeScript mis à jour

## Tasks / Subtasks

- [ ] Task 1: Migration Supabase (AC: 1, 2, 3)
  - [ ] Créer migration SQL
  - [ ] cups_remaining INTEGER NULL
  - [ ] photo_url TEXT NULL
  - [ ] Rollback safe
- [ ] Task 2: Zod et TypeScript (AC: 4)
  - [ ] src/utils/validation.ts
  - [ ] src/types.ts
  - [ ] Match type étendu

## Dev Notes

- **Source:** design-system-convergence section 7
- cups_remaining: 1–10, équipe gagnante uniquement
- photo_url: URL Supabase Storage

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
