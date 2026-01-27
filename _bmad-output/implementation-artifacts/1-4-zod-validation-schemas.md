# Story 1.4: Zod Validation Schemas

Status: ready-for-dev

## Story

As a developer,
I want Zod validation schemas for all data types,
So that data is validated at runtime and type-safe throughout the application.

## Acceptance Criteria

**Given** the need for client-side validation
**When** I create Zod validation schemas
**Then** `src/utils/validation.ts` is created
**And** Zod 4.3.6 is installed (`npm install zod@^4.0.0`)
**And** schemas are created for Player, League, Tournament, Match types
**And** schemas match TypeScript types in `src/types.ts`
**And** schemas include validation rules (required fields, types, constraints)
**And** schemas support transformation between snake_case (DB) and camelCase (app)
**And** validation functions are exported for use in forms and services

## Tasks / Subtasks

- [ ] Install Zod 4.3.6 (AC: Installation)
  - [ ] Run: `npm install zod@^4.0.0`
  - [ ] Verify Zod 4.x is installed in package.json

- [ ] Create src/utils/validation.ts (AC: Schema file)
  - [ ] Create validation.ts file
  - [ ] Import Zod
  - [ ] Set up file structure

- [ ] Create Player schema (AC: Schemas)
  - [ ] Define playerSchema with all fields
  - [ ] Add validation rules (string lengths, types)
  - [ ] Support snake_case ↔ camelCase transformation
  - [ ] Export schema and type

- [ ] Create League schema (AC: Schemas)
  - [ ] Define leagueSchema with all fields
  - [ ] Add validation rules (name length, type enum)
  - [ ] Support transformation
  - [ ] Export schema and type

- [ ] Create Tournament schema (AC: Schemas)
  - [ ] Define tournamentSchema with all fields
  - [ ] Add validation rules (formats, dates)
  - [ ] Support transformation
  - [ ] Export schema and type

- [ ] Create Match schema (AC: Schemas)
  - [ ] Define matchSchema with all fields
  - [ ] Add validation rules (scores, team sizes)
  - [ ] Support transformation
  - [ ] Export schema and type

- [ ] Create validation helper functions (AC: Validation functions)
  - [ ] Create validatePlayer function
  - [ ] Create validateLeague function
  - [ ] Create validateTournament function
  - [ ] Create validateMatch function
  - [ ] Export all validation functions

- [ ] Add tests for schemas (AC: Testing)
  - [ ] Create tests/unit/validation/validation.test.ts
  - [ ] Test valid data passes
  - [ ] Test invalid data fails
  - [ ] Test transformation works
  - [ ] Run tests to verify

## Dev Notes

### Installation Command

```bash
npm install zod@^4.0.0
```

### Schema Structure

**src/utils/validation.ts:**
```typescript
import { z } from 'zod';

// Player Schema
export const playerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  elo: z.number().int().min(0).max(3000).default(1500),
  matches_played: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).transform((data) => ({
  id: data.id,
  name: data.name,
  email: data.email,
  elo: data.elo,
  matchesPlayed: data.matches_played,
  wins: data.wins,
  losses: data.losses,
  createdAt: data.created_at,
  updatedAt: data.updated_at
}));

export type Player = z.infer<typeof playerSchema>;

// League Schema
export const leagueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['event', 'season']),
  is_finished: z.boolean().default(false),
  creator_user_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).transform((data) => ({
  id: data.id,
  name: data.name,
  type: data.type,
  isFinished: data.is_finished,
  creatorUserId: data.creator_user_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at
}));

export type League = z.infer<typeof leagueSchema>;

// Tournament Schema
export const tournamentSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  date: z.string().datetime(),
  location: z.string().max(200).optional(),
  format: z.enum(['1v1', '2v2', '3v3']).default('2v2'),
  anti_cheat_enabled: z.boolean().default(false),
  is_finished: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).transform((data) => ({
  id: data.id,
  leagueId: data.league_id,
  name: data.name,
  date: data.date,
  location: data.location,
  format: data.format,
  antiCheatEnabled: data.anti_cheat_enabled,
  isFinished: data.is_finished,
  createdAt: data.created_at,
  updatedAt: data.updated_at
}));

export type Tournament = z.infer<typeof tournamentSchema>;

// Match Schema
export const matchSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  tournament_id: z.string().uuid().nullable(),
  team_a_score: z.number().int().min(0).max(10),
  team_b_score: z.number().int().min(0).max(10),
  status: z.enum(['pending', 'confirmed', 'rejected']).default('confirmed'),
  played_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).transform((data) => ({
  id: data.id,
  leagueId: data.league_id,
  tournamentId: data.tournament_id,
  teamAScore: data.team_a_score,
  teamBScore: data.team_b_score,
  status: data.status,
  playedAt: data.played_at,
  createdAt: data.created_at,
  updatedAt: data.updated_at
}));

export type Match = z.infer<typeof matchSchema>;

// Validation Functions
export function validatePlayer(data: unknown): Player {
  return playerSchema.parse(data);
}

export function validateLeague(data: unknown): League {
  return leagueSchema.parse(data);
}

export function validateTournament(data: unknown): Tournament {
  return tournamentSchema.parse(data);
}

export function validateMatch(data: unknown): Match {
  return matchSchema.parse(data);
}

// Safe validation (returns result with success/error)
export function safeValidatePlayer(data: unknown) {
  return playerSchema.safeParse(data);
}

export function safeValidateLeague(data: unknown) {
  return leagueSchema.safeParse(data);
}

export function safeValidateTournament(data: unknown) {
  return tournamentSchema.safeParse(data);
}

export function safeValidateMatch(data: unknown) {
  return matchSchema.safeParse(data);
}
```

### Project Structure Notes

**Transformation Pattern:**
- Database uses snake_case: `created_at`, `user_id`, `matches_played`
- App uses camelCase: `createdAt`, `userId`, `matchesPlayed`
- Zod schemas handle transformation automatically

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 1.1: Data Validation Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns - Data Exchange Formats]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns - Database vs Code]

**Type Definitions:**
- [Source: src/types.ts - existing type definitions]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Foundation & Code Quality]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/utils/validation.ts
- tests/unit/validation/validation.test.ts

**Files to Modify:**
- package.json (add Zod dependency)

**Files to Reference:**
- src/types.ts (match schemas to existing types)
