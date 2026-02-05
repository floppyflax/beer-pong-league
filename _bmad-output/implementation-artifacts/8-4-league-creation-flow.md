# Story 8.4: League Creation Flow with Premium Requirement

Status: ready-for-dev

## Story

As a premium user,
I want to create a long-term league with advanced configuration options,
so that I can manage ongoing beer pong competitions across multiple seasons with persistent player rankings.

## Context

Leagues are long-term competitions (vs tournaments which are short-term). Key differences:
- **Tournament:** Single-session, temporary, 2-16 players, ends when completed
- **League:** Multi-session, persistent, unlimited players, ongoing rankings

**Premium requirement:** Creating a league requires premium status (Story 7.9). Free users see PaymentModal when attempting to create.

**Configuration options:**
- League name, description (optional)
- Season/duration (optional: start date, end date)
- Format (1v1, 2v2, or free)
- Public/private visibility
- Advanced: divisions, playoffs (future enhancements)

## Acceptance Criteria

### AC1: Access League Creation Page
1. **Given** user is authenticated
   **When** user clicks "CRÉER UNE LIGUE" on home page
   **And** user is premium
   **Then** navigate to `/league/create`
   **When** user is free tier
   **Then** open PaymentModal (upgrade prompt)
   **And** do NOT navigate to create page

### AC2: League Creation Form - Extended Fields
2. **Given** premium user on `/league/create`
   **Then** display form with fields:
   - **Nom de la ligue** (required, text, max 50 chars)
   - **Description** (optional, textarea, max 200 chars)
   - **Format** (radio buttons):
     - "2v2 Strict"
     - "1v1 Strict"
     - "Libre"
   - **Ligue publique** (toggle, default: false)
     - If public: anyone can join
     - If private: requires invite/code
   - **Date de début** (optional, date picker, default: today)
   - **Date de fin** (optional, date picker)
   **And** display "CRÉER LA LIGUE" button

### AC3: Form Validation
3. **Given** user filling league creation form
   **When** required field (name) is empty
   **Then** disable "CRÉER LA LIGUE" button
   **When** all required fields valid
   **Then** enable button
   **When** end date before start date
   **Then** display error "La date de fin doit être après la date de début"

### AC4: League Code Generation (Private Leagues)
4. **Given** user creates private league
   **When** league created in database
   **Then** generate unique 6-character alphanumeric join code
   **And** ensure code unique across all leagues
   **And** store in `leagues.join_code` column
   **Given** user creates public league
   **Then** no join code needed (anyone can search and join)

### AC5: League Ownership and Metadata
5. **Given** league created by premium user
   **Then** store `created_by = user.id`
   **And** store `created_at = NOW()`
   **And** store format_type and team sizes based on format
   **And** league status = "active" by default
   **And** season_start_date and season_end_date if provided

### AC6: Navigate to League Dashboard
6. **Given** league successfully created
   **Then** navigate to `/league/[id]/dashboard`
   **And** display success toast "Ligue créée ! ⚽"
   **And** show join code if private (for sharing)

### AC7: Premium Status Verification
7. **Given** user navigates to `/league/create`
   **When** user is NOT premium
   **Then** redirect to home page
   **And** display error toast "Créer une ligue nécessite un abonnement Premium"
   **And** open PaymentModal

### AC8: Public League Discovery (Future Enhancement)
8. **Given** public league created
   **Then** league appears in public league directory (future story)
   **And** anyone can search and join without code

## Tasks / Subtasks

- [ ] Task 1: Create CreateLeague page component (AC: 1, 2, 3)
  - [ ] Setup route `/league/create` in router
  - [ ] Create `CreateLeague.tsx` component
  - [ ] Add protected route (requires authentication + premium)
  - [ ] Check premium status on mount (redirect if not premium)
  - [ ] Display PaymentModal if not premium

- [ ] Task 2: Implement league creation form (AC: 2, 3)
  - [ ] Add "Nom de la ligue" input (required, max 50 chars)
  - [ ] Add "Description" textarea (optional, max 200 chars)
  - [ ] Add "Format" radio buttons (2v2, 1v1, Libre)
  - [ ] Add "Ligue publique" toggle switch
  - [ ] Add "Date de début" date picker (optional)
  - [ ] Add "Date de fin" date picker (optional)
  - [ ] Implement form validation (required fields, date logic)
  - [ ] Enable/disable submit button based on validation
  - [ ] Display field-level error messages

- [ ] Task 3: Implement format selection (AC: 2)
  - [ ] Radio buttons for 2v2, 1v1, Libre
  - [ ] Map to format_type and team sizes (same as tournaments)
  - [ ] Display format explanation (helper text)

- [ ] Task 4: Generate league join code (AC: 4)
  - [ ] Reuse `generateTournamentCode()` utility (or rename to generic)
  - [ ] Generate code only if league is private
  - [ ] Check uniqueness against existing leagues
  - [ ] Store in `leagues.join_code` column

- [ ] Task 5: Add database schema for leagues (AC: 4, 5)
  - [ ] Create `leagues` table (similar to tournaments but with season dates)
  - [ ] Columns: id, name, description, created_by, created_at, join_code
  - [ ] format_type, team1_size, team2_size
  - [ ] is_public, season_start_date, season_end_date, status
  - [ ] Add unique constraint on join_code

- [ ] Task 6: Implement league creation service method (AC: 5, 6)
  - [ ] DatabaseService.createLeague(leagueData)
  - [ ] Insert league into database with metadata
  - [ ] Return league ID for navigation
  - [ ] Handle errors (DB errors, validation errors)

- [ ] Task 7: Integrate premium status check (AC: 1, 7)
  - [ ] Use PremiumService.isPremium() on mount
  - [ ] If false, redirect to home
  - [ ] Display error toast + open PaymentModal
  - [ ] If true, allow form display

- [ ] Task 8: Navigate to league dashboard after creation (AC: 6)
  - [ ] On success, get league ID
  - [ ] Navigate to `/league/[id]/dashboard`
  - [ ] Display success toast "Ligue créée ! ⚽"
  - [ ] Pass league data if needed

- [ ] Task 9: Add join code display (AC: 6)
  - [ ] If private league, display join code on dashboard
  - [ ] Add "Partager le code" button
  - [ ] Show code text (e.g., "Code: XYZ789")
  - [ ] Optionally generate QR code (like tournaments)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Premium Gating Pattern:**
- Check premium status BEFORE navigation (home page button)
- Double-check on `/league/create` mount as safeguard
- Open PaymentModal if not premium (Story 7.11)
- Redirect to home if unauthorized

**League vs Tournament Differences:**
```typescript
// Tournament: short-term, single session
{
  name: "Summer Cup",
  status: "active", // completed when done
  max_players: 16
}

// League: long-term, ongoing
{
  name: "2026 League Season 1",
  description: "Annual beer pong league",
  season_start_date: "2026-01-01",
  season_end_date: "2026-12-31",
  is_public: true // discoverable
}
```

**Public vs Private:**
- Private: Requires join code (like tournaments)
- Public: Listed in directory, anyone can join (future story)

**Code Generation:**
- Reuse tournament code generation logic
- 6 alphanumeric chars, check uniqueness
- Only for private leagues

### Source Tree Components to Touch

**Files to Create:**
- `src/pages/CreateLeague.tsx` - League creation form page
- `src/pages/LeagueDashboard.tsx` - League dashboard (similar to tournament)

**Files to Modify:**
- `src/services/DatabaseService.ts` - Add createLeague method
- `src/App.tsx` - Add `/league/create` route
- `src/utils/tournamentCode.ts` - Rename to `generateJoinCode()` (generic)

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Premium check
- `src/components/PaymentModal.tsx` (Story 7.11) - Upgrade prompt
- `src/pages/CreateTournament.tsx` (Story 8.2) - Similar form structure

**Database Schema (Migration):**
```sql
-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) <= 50),
  description TEXT CHECK (length(description) <= 200),
  join_code TEXT UNIQUE CHECK (length(join_code) = 6), -- NULL if public
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  format_type TEXT CHECK (format_type IN ('fixed', 'free')),
  team1_size INTEGER,
  team2_size INTEGER,
  is_public BOOLEAN DEFAULT false,
  season_start_date DATE,
  season_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'))
);

CREATE UNIQUE INDEX idx_league_join_code ON leagues(join_code) WHERE join_code IS NOT NULL;

-- League players table (similar to tournament_players)
CREATE TABLE IF NOT EXISTS league_players (
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  display_name TEXT,
  elo INTEGER DEFAULT 1500,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (league_id, player_id)
);
```

**Dependencies:**
- Already have PremiumService (Story 7.2)
- Already have PaymentModal (Story 7.11)
- Reuse join code generation from tournaments

### Testing Standards Summary

**Unit Testing:**
- Test premium status check logic
- Test form validation (required fields, date logic)
- Test join code generation (only for private leagues)
- Test format mapping (2v2 → fixed, Libre → free)
- Mock PremiumService and DatabaseService

**Integration Testing:**
- Test full creation flow (premium user)
- Test premium gate (free user blocked)
- Test navigation to league dashboard after creation
- Test private league code generation
- Test public league (no code generated)

**E2E Testing:**
- Verify premium user can create league
- Verify free user blocked with PaymentModal
- Verify private league generates join code
- Verify public league does not generate code
- Verify league appears in user's league list
- Verify date validation (end date after start date)

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Page location: `src/pages/CreateLeague.tsx`
- ✅ Service usage: DatabaseService, PremiumService
- ✅ Context usage: AuthContext
- ✅ Styling: Tailwind CSS

**Responsive Design:**
- Mobile-first form layout
- Date pickers mobile-friendly
- Touch-friendly toggles and inputs

**Error Handling:**
- Premium check failure → redirect + toast + modal
- Validation errors → field-level messages
- Network errors → retry option

### UI/UX Design

**CreateLeague Page Layout:**
```
[Back Arrow] CRÉER UNE LIGUE

✨ Fonctionnalité Premium

Nom de la ligue *
[Input: 2026 Season 1_________]

Description (optionnelle)
[Textarea: Ligue annuelle de beer pong
entre amis et collègues...]

Format du match *
(•) 2v2 Strict
( ) 1v1 Strict
( ) Libre

🌍 Ligue publique
[Toggle: OFF]
💡 Si publique, visible dans l'annuaire

Dates de saison (optionnelles)
📅 Date de début: [01/01/2026]
📅 Date de fin: [31/12/2026]

[GROS BOUTON DORÉ]
⚡ CRÉER LA LIGUE

[Si pas premium, affichage différent:]
━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Premium requis

Créer une ligue est une fonctionnalité
réservée aux membres Premium.

✨ Avantages Premium :
  • Ligues illimitées
  • Tournois illimités
  • Support prioritaire

[BOUTON: PASSER PREMIUM - 3€]
━━━━━━━━━━━━━━━━━━━━━━━━
```

**Success State - League Dashboard:**
```
⚽ Ligue créée avec succès !

2026 SEASON 1
━━━━━━━━━━━━━━━━━━━━━━━━
Ligue annuelle de beer pong

📊 Active | Format: 2v2
🔒 Privée | Code: XYZ789
📅 01/01/2026 - 31/12/2026

[Bouton: PARTAGER LE CODE]

👥 Joueurs (0)
Aucun joueur pour l'instant

[Bouton: ENREGISTRER UN MATCH]
```

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-8] Epic 8: Tournament & League Management
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7] Epic 7: Freemium Payment Model

**Related Stories:**
- Story 7.2: PremiumService (premium check)
- Story 7.9: League Creation Premium Requirement
- Story 7.11: PaymentModal (upgrade prompt)
- Story 8.2: Tournament Creation (similar form structure)
- Story 8.5: Match Recording (used in leagues)

**Architecture Decisions:**
- [Decision: Premium-only for leagues] Differentiates value proposition
- [Decision: Public/private leagues] Future-proof for discovery feature
- [Decision: Season dates optional] Flexibility for casual vs competitive leagues

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
