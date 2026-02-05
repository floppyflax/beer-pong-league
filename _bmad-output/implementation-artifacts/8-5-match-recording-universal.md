# Story 8.5: Match Recording - Universal Component with Flexible ELO

Status: ready-for-dev

## Story

As a tournament or league participant,
I want to record match results by selecting players for each team and declaring a winner,
so that rankings are automatically updated with ELO calculations that handle both symmetric (2v2, 1v1) and asymmetric (2v3, 1v3) matches fairly.

## Context

This story implements a **universal match recording component** that works for both tournaments AND leagues. Key features:

**Simplified Input:**
- Select players for Team 1 and Team 2
- Declare winner (no score tracking, just victory)
- Format validation based on tournament/league config

**Flexible Team Sizes:**
- Strict formats (1v1, 2v2): Enforce exact team sizes
- Free format: Allow any combination (1v2, 2v3, 3v3, etc.)

**ELO Calculation with Proportional Distribution:**
- Calculate total ELO change for the match (based on team averages)
- Distribute proportionally: divide by number of players in each team
- Ensures zero-sum system (total gained = total lost)
- Example: 3v2 match → winners each get +5, losers each get -8 (totals balance to ~0)

**Why this matters:**
- Simple UX (one tap to record winner)
- Flexible (supports any team composition)
- Fair ELO (proportional distribution avoids favoring large teams)
- Reusable (same component for tournaments and leagues)

## Acceptance Criteria

### AC1: Access Match Recording Interface
1. **Given** user in tournament or league dashboard
   **When** user clicks "ENREGISTRER UN MATCH" button
   **Then** display match recording interface
   **And** load available players from tournament/league roster
   **And** load format configuration (strict vs free, team sizes)

### AC2: Player Selection - Flexible Teams
2. **Given** user on match recording interface
   **When** user selects players for Team 1 and Team 2
   **Then** display selected players in respective teams
   **And** remove selected players from available list
   **And** show team size counter (e.g., "Équipe 1: 2 joueurs")
   **And** allow deselecting players (return to available list)

### AC3: Format Validation - Strict Formats
3. **Given** tournament/league has strict format (e.g., 2v2)
   **When** user selects players
   **Then** enforce exact team sizes (team1_size = 2, team2_size = 2)
   **And** prevent adding more players once limit reached
   **And** disable "Declare Winner" buttons until both teams complete
   **When** teams valid
   **Then** enable "ÉQUIPE 1 GAGNE" and "ÉQUIPE 2 GAGNE" buttons

### AC4: Format Validation - Free Format
4. **Given** tournament/league has free format
   **When** user selects players
   **Then** allow any number of players per team (minimum 1 each)
   **And** no maximum limit enforced
   **And** enable "Declare Winner" buttons once both teams have ≥1 player

### AC5: Record Match Victory
5. **Given** valid teams selected
   **When** user clicks "ÉQUIPE 1 GAGNE" or "ÉQUIPE 2 GAGNE"
   **Then** insert match record into `matches` table
   **And** insert player associations into `match_players` table
   **And** store winning_team (1 or 2)
   **And** store played_at timestamp
   **And** trigger ELO calculation
   **And** navigate back to dashboard
   **And** display success toast "Match enregistré ! 🏆"

### AC6: ELO Calculation - Proportional Distribution
6. **Given** match recorded with winning team
   **When** ELO calculation triggered
   **Then** calculate team average ELOs:
   - team1AvgElo = sum(team1 player ELOs) / team1.length
   - team2AvgElo = sum(team2 player ELOs) / team2.length
   **And** calculate expected win probability for team1:
   - expectedTeam1 = 1 / (1 + 10^((team2AvgElo - team1AvgElo) / 400))
   **And** calculate total ELO change:
   - totalChange = K × (actualResult - expectedTeam1)
   - Where K = 32, actualResult = 1 if team1 wins, 0 if team1 loses
   **And** distribute proportionally:
   - team1ChangePerPlayer = totalChange / team1.length
   - team2ChangePerPlayer = -totalChange / team2.length
   **And** round to integers (avoid decimals)
   **And** verify zero-sum: total gained ≈ total lost (±1 for rounding)

### AC7: ELO Update in Database
7. **Given** ELO changes calculated
   **When** updating player ELOs
   **Then** update each player's ELO in tournament_players or league_players table
   **And** store individual ELO changes in `match_elo_changes` table (for history)
   **And** ensure atomicity (transaction: all or nothing)

### AC8: Display ELO Changes After Match
8. **Given** match successfully recorded
   **When** returning to dashboard
   **Then** display toast or modal with ELO changes:
   - "✅ Match enregistré !"
   - "Équipe 1 (gagnante): Florian +8, Marie +8"
   - "Équipe 2: Thomas -8, Sophie -8"
   **And** update leaderboard immediately (re-sorted by new ELOs)

### AC9: Support Asymmetric Matches (Free Format Only)
9. **Given** free format enabled
   **When** user records asymmetric match (e.g., 2v3)
   **Then** allow recording without warnings
   **And** calculate ELO with proportional distribution
   **And** display ELO changes showing different per-player values
   **Example:** 3 players each get +5, 2 players each lose -8 (totals ~0)

### AC10: Validation and Error Handling
10. **Given** user attempting to record invalid match
    **When** teams have duplicate players
    **Then** display error "Un joueur ne peut pas être dans les deux équipes"
    **When** teams have 0 players
    **Then** display error "Chaque équipe doit avoir au moins 1 joueur"
    **When** strict format not respected
    **Then** display error "Format 2v2 requis - sélectionne 2 joueurs par équipe"

## Tasks / Subtasks

- [ ] Task 1: Create MatchRecordingForm component (AC: 1, 2)
  - [ ] Create `MatchRecordingForm.tsx` as reusable component
  - [ ] Accept props: availablePlayers, format config, tournament/league ID
  - [ ] Add state for team1Players, team2Players, selectedPlayers
  - [ ] Implement player selection UI (dropdowns or list with toggles)
  - [ ] Display selected players in team sections
  - [ ] Show team size counters

- [ ] Task 2: Implement player selection logic (AC: 2)
  - [ ] Add player to team (remove from available list)
  - [ ] Remove player from team (return to available list)
  - [ ] Prevent duplicate selection across teams
  - [ ] Update UI dynamically as players selected
  - [ ] Show visual feedback (icons, colors)

- [ ] Task 3: Implement format validation (AC: 3, 4)
  - [ ] Check format_type from tournament/league config
  - [ ] If format='fixed', enforce team1_size and team2_size
  - [ ] Disable adding players once limit reached (strict)
  - [ ] If format='free', require minimum 1 player per team (no max)
  - [ ] Enable/disable winner buttons based on validation

- [ ] Task 4: Implement winner declaration (AC: 5)
  - [ ] Add "ÉQUIPE 1 GAGNE 🏆" button
  - [ ] Add "ÉQUIPE 2 GAGNE 🏆" button
  - [ ] On click, collect match data (teams, winner, timestamp)
  - [ ] Call DatabaseService.recordMatch(matchData)
  - [ ] Navigate back to dashboard on success
  - [ ] Display success toast with ELO changes

- [ ] Task 5: Implement ELO calculation service (AC: 6)
  - [ ] Create/update `src/utils/elo.ts` with calculateMatchElo()
  - [ ] Calculate team average ELOs
  - [ ] Calculate expected win probability (ELO formula)
  - [ ] Calculate total ELO change (K × delta)
  - [ ] Distribute proportionally per player
  - [ ] Round to integers
  - [ ] Return updates for all players (old ELO, new ELO, change)

- [ ] Task 6: Add database schema for matches (AC: 5, 7)
  - [ ] Create `matches` table with relational structure:
    - id, tournament_id, league_id, winning_team, played_at
  - [ ] Create `match_players` table:
    - match_id, player_id, team_number (1 or 2)
  - [ ] Create `match_elo_changes` table (history):
    - match_id, player_id, old_elo, new_elo, elo_change
  - [ ] Add foreign key constraints and indexes

- [ ] Task 7: Implement match recording database method (AC: 5, 7)
  - [ ] DatabaseService.recordMatch(matchData)
  - [ ] Start transaction
  - [ ] Insert into matches table
  - [ ] Insert into match_players for all players
  - [ ] Calculate ELO changes (call elo.ts utility)
  - [ ] Update player ELOs in tournament_players or league_players
  - [ ] Insert ELO changes into match_elo_changes (history)
  - [ ] Commit transaction (rollback on error)
  - [ ] Return match ID and ELO changes

- [ ] Task 8: Display ELO changes after match (AC: 8)
  - [ ] After successful recording, get ELO changes from response
  - [ ] Display toast or modal with changes:
    - Team 1 (winner): Player1 +X, Player2 +X
    - Team 2: Player3 -Y, Player4 -Y
  - [ ] Update leaderboard in dashboard (trigger refresh)
  - [ ] Add animation/transition for ELO changes (optional)

- [ ] Task 9: Add validation and error handling (AC: 10)
  - [ ] Validate no duplicate players across teams
  - [ ] Validate minimum 1 player per team
  - [ ] Validate strict format constraints (if applicable)
  - [ ] Display clear error messages
  - [ ] Prevent submission if validation fails

- [ ] Task 10: Write comprehensive tests (AC: 6)
  - [ ] Unit test: ELO calculation with symmetric teams (2v2)
  - [ ] Unit test: ELO calculation with asymmetric teams (3v2)
  - [ ] Unit test: Zero-sum verification (total gained = total lost)
  - [ ] Unit test: Proportional distribution (different per-player values)
  - [ ] Integration test: Full match recording flow
  - [ ] E2E test: Record match → verify leaderboard update

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Universal Component Design:**
- Single component works for tournaments AND leagues
- Props determine behavior (tournament_id OR league_id, format config)
- Database queries adapt based on context (tournament_players vs league_players)

**ELO Calculation - Proportional Distribution:**
```typescript
// Key formula
const totalEloChange = K * (actualResult - expectedTeam1);
const team1ChangePerPlayer = totalEloChange / team1.length;
const team2ChangePerPlayer = -totalEloChange / team2.length;

// Example: 3v2 match, equal ELOs (1500)
// totalEloChange = 32 * (1 - 0.5) = +16
// team1 (3 players): each gets +16/3 = +5.33 ≈ +5
// team2 (2 players): each gets -16/2 = -8
// Verification: (3 × +5) + (2 × -8) = +15 - 16 = -1 ≈ 0 ✅
```

**Database Schema - Relational Match Structure:**
```sql
-- Flexible: supports any number of players per team
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  league_id UUID REFERENCES leagues(id),
  winning_team INTEGER NOT NULL CHECK (winning_team IN (1, 2)),
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_players (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE match_elo_changes (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  PRIMARY KEY (match_id, player_id)
);
```

**Transaction Safety:**
- Use database transactions for atomicity
- If ELO update fails, rollback entire match recording
- Prevents partial state (match recorded but ELO not updated)

### Source Tree Components to Touch

**Files to Create:**
- `src/components/MatchRecordingForm.tsx` - Universal match recording
- `src/utils/elo.ts` - ELO calculation with proportional distribution

**Files to Modify:**
- `src/services/DatabaseService.ts` - Add recordMatch method
- `src/pages/TournamentDashboard.tsx` - Integrate match recording
- `src/pages/LeagueDashboard.tsx` - Integrate match recording

**Files to Reference:**
- `src/utils/elo.ts` (existing?) - May need refactoring for new formula
- `src/types.ts` - Add Match, MatchPlayer types

**Database Migration:**
```sql
-- Migration: Add match recording tables
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  league_id UUID REFERENCES leagues(id),
  winning_team INTEGER NOT NULL CHECK (winning_team IN (1, 2)),
  played_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (tournament_id IS NOT NULL AND league_id IS NULL) OR
    (tournament_id IS NULL AND league_id IS NOT NULL)
  )
);

CREATE TABLE match_players (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE match_elo_changes (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);
```

### Testing Standards Summary

**Unit Testing - ELO Calculation:**
```typescript
// Test symmetric match (2v2, equal ELOs)
test('2v2 match with equal ELOs distributes evenly', () => {
  const team1 = [{ elo: 1500 }, { elo: 1500 }];
  const team2 = [{ elo: 1500 }, { elo: 1500 }];
  const result = calculateMatchElo(team1, team2, 1, 32);
  
  expect(result.team1Updates[0].change).toBe(16);
  expect(result.team1Updates[1].change).toBe(16);
  expect(result.team2Updates[0].change).toBe(-16);
  expect(result.team2Updates[1].change).toBe(-16);
});

// Test asymmetric match (3v2, equal ELOs)
test('3v2 match distributes proportionally', () => {
  const team1 = [{ elo: 1500 }, { elo: 1500 }, { elo: 1500 }];
  const team2 = [{ elo: 1500 }, { elo: 1500 }];
  const result = calculateMatchElo(team1, team2, 1, 32);
  
  // Team1 (3 players): +16/3 ≈ +5 each
  expect(result.team1Updates[0].change).toBe(5);
  expect(result.team1Updates[1].change).toBe(5);
  expect(result.team1Updates[2].change).toBe(5);
  
  // Team2 (2 players): -16/2 = -8 each
  expect(result.team2Updates[0].change).toBe(-8);
  expect(result.team2Updates[1].change).toBe(-8);
  
  // Verify zero-sum (allow ±1 for rounding)
  const totalChange = result.team1Updates.reduce((sum, u) => sum + u.change, 0)
                    + result.team2Updates.reduce((sum, u) => sum + u.change, 0);
  expect(Math.abs(totalChange)).toBeLessThanOrEqual(1);
});

// Test upset (underdog wins)
test('Underdog victory yields higher ELO gain', () => {
  const team1 = [{ elo: 1400 }, { elo: 1400 }]; // Underdog
  const team2 = [{ elo: 1600 }, { elo: 1600 }]; // Favorite
  const result = calculateMatchElo(team1, team2, 1, 32); // Team1 wins
  
  // Team1 should gain more than 16 (standard)
  expect(result.team1Updates[0].change).toBeGreaterThan(16);
  // Team2 should lose less than -16
  expect(result.team2Updates[0].change).toBeLessThan(-16);
});
```

**Integration Testing:**
- Test full match recording flow (select players → declare winner → DB update)
- Test ELO update in database (tournament_players or league_players)
- Test match history retrieval (verify match appears in dashboard)
- Test leaderboard re-sort after match (verify rankings updated)

**E2E Testing:**
- Verify match recording in tournament (2v2 strict)
- Verify match recording in league (free format, 2v3)
- Verify leaderboard updates immediately after match
- Verify ELO changes displayed in toast/modal
- Verify match history shows new match with correct winner

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Component location: `src/components/MatchRecordingForm.tsx`
- ✅ Utility location: `src/utils/elo.ts`
- ✅ Service usage: DatabaseService
- ✅ Styling: Tailwind CSS

**Responsive Design:**
- Mobile-first (primary use case is mobile during parties)
- Large touch-friendly buttons for winner declaration
- Clear visual separation between teams
- Easy player selection (dropdowns or large tap targets)

**Performance Optimization:**
- Debounce ELO calculations (avoid excessive recalculations)
- Use database transactions for atomicity
- Cache player list (avoid re-fetching on every selection)

### UI/UX Design

**MatchRecordingForm Layout:**
```
ENREGISTRER UN MATCH

[Si format strict:]
Format: 2v2 obligatoire

Joueurs disponibles
━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Florian (1520)
[ ] Marie (1480)
[ ] Thomas (1510)
[ ] Sophie (1490)
[ ] Alex (1470)

ÉQUIPE 1 (2/2)
━━━━━━━━━━━━━━━━━━━━━━━━
✓ Florian (1520) [X]
✓ Marie (1480) [X]

VS

ÉQUIPE 2 (2/2)
━━━━━━━━━━━━━━━━━━━━━━━━
✓ Thomas (1510) [X]
✓ Sophie (1490) [X]

QUI A GAGNÉ ?
[ÉQUIPE 1 GAGNE 🏆]
[ÉQUIPE 2 GAGNE 🏆]
```

**Alternative: Dropdown Selection (Mobile-Optimized):**
```
ENREGISTRER UN MATCH

ÉQUIPE 1
[Dropdown: Sélectionne joueur 1] ▼
  Florian (1520)
  
[Dropdown: Sélectionne joueur 2] ▼
  Marie (1480)

[+ Ajouter joueur] (si format libre)

VS

ÉQUIPE 2
[Dropdown: Sélectionne joueur 1] ▼
  Thomas (1510)
  
[Dropdown: Sélectionne joueur 2] ▼
  Sophie (1490)

[+ Ajouter joueur] (si format libre)

━━━━━━━━━━━━━━━━━━━━━━━━
QUI A GAGNÉ ?
[ÉQUIPE 1 GAGNE 🏆]
[ÉQUIPE 2 GAGNE 🏆]
```

**Success State - ELO Changes Display:**
```
✅ Match enregistré !

ÉQUIPE 1 (GAGNANTE) 🏆
━━━━━━━━━━━━━━━━━━━━━━━━
Florian: 1520 → 1528 (+8)
Marie: 1480 → 1488 (+8)

ÉQUIPE 2
━━━━━━━━━━━━━━━━━━━━━━━━
Thomas: 1510 → 1502 (-8)
Sophie: 1490 → 1482 (-8)

[Bouton: RETOUR AU TOURNOI]
```

**Asymmetric Match Example (3v2):**
```
✅ Match enregistré !

ÉQUIPE 1 (GAGNANTE) 🏆
━━━━━━━━━━━━━━━━━━━━━━━━
Florian: 1500 → 1505 (+5)
Marie: 1500 → 1505 (+5)
Alex: 1500 → 1505 (+5)
Total équipe: +15

ÉQUIPE 2
━━━━━━━━━━━━━━━━━━━━━━━━
Thomas: 1500 → 1492 (-8)
Sophie: 1500 → 1492 (-8)
Total équipe: -16

ℹ️ Match 3v2 - ELO distribué
   proportionnellement
```

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-8] Epic 8: Tournament & League Management
- [Source: Party Mode Discussion 2026-02-03] ELO proportional distribution requirements

**Related Stories:**
- Story 8.1: Tournament Join Flow (provides player roster)
- Story 8.2: Tournament Creation Flow (defines format constraints)
- Story 8.3: Tournament Dashboard (displays match history, leaderboard)
- Story 8.4: League Creation Flow (defines format for leagues)

**Architecture Decisions:**
- [Decision: Proportional ELO distribution] Ensures fairness for asymmetric matches (zero-sum)
- [Decision: Victory-only recording] Simplifies UX, no score details needed
- [Decision: Relational match structure] Flexible, supports any team size combination
- [Decision: Universal component] Single component for tournaments and leagues (DRY)

**External References:**
- [ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system) - Standard formula
- [Zero-sum game theory](https://en.wikipedia.org/wiki/Zero-sum_game) - Mathematical basis

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
