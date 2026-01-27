# Story 5.2: Automatic ELO Calculation

Status: ready-for-dev

## Story

As a player,
I want my ELO to update automatically after each match,
So that I can see my progression without manual calculations.

## Acceptance Criteria

**Given** a match is recorded
**When** match result is saved
**Then** ELO is calculated automatically for all players
**And** ELO changes are stored in elo_history table
**And** player ELO is updated in league_players table
**And** ELO calculation uses standard ELO algorithm
**And** ELO changes are displayed to user
**And** calculation happens server-side or client-side consistently

## Tasks / Subtasks

- [ ] Review ELO calculation utility (AC: Uses standard algorithm)
  - [ ] Check src/utils/elo.ts exists
  - [ ] Verify ELO formula is correct
  - [ ] Test calculation accuracy
  - [ ] Document K-factor (32 for beer pong)

- [ ] Implement automatic ELO calculation (AC: Calculates automatically)
  - [ ] Trigger on match record
  - [ ] Calculate for all players in match
  - [ ] Determine winners and losers
  - [ ] Apply ELO formula
  - [ ] Test calculation works

- [ ] Store ELO history (AC: Stored in elo_history)
  - [ ] Insert into elo_history table
  - [ ] Record old_elo, new_elo, change
  - [ ] Link to match_id
  - [ ] Store timestamp
  - [ ] Test history is saved

- [ ] Update league_players ELO (AC: Player ELO updated)
  - [ ] Update elo field in league_players
  - [ ] Update matches_played count
  - [ ] Update wins/losses count
  - [ ] Ensure atomic update
  - [ ] Test update works

- [ ] Display ELO changes to user (AC: Changes displayed)
  - [ ] Show ELO diff after match (+25, -18, etc.)
  - [ ] Use EloChangeDisplay component
  - [ ] Color-code positive/negative
  - [ ] Animate change
  - [ ] Test display works

- [ ] Choose calculation location (AC: Consistent calculation)
  - [ ] Decide: client-side or server-side
  - [ ] If client: calculate in DatabaseService
  - [ ] If server: create Supabase function
  - [ ] Ensure consistency
  - [ ] Test calculation is identical

## Dev Notes

### Existing ELO Utility

**src/utils/elo.ts:**
- Already exists with ELO calculation functions
- Review and verify implementation
- Ensure it matches standard ELO formula

**Standard ELO Formula:**
```
Expected Score (E) = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
New ELO = Old ELO + K * (Actual Score - Expected Score)

Where:
- K = K-factor (32 for beer pong, typical for amateur)
- Actual Score = 1 for win, 0 for loss, 0.5 for draw
```

### ELO Calculation Service

**Implement in DatabaseService:**
```typescript
async function calculateAndUpdateELO(matchId: string) {
  // 1. Load match data
  const match = await loadMatch(matchId);
  const { team_a_players, team_b_players, team_a_score, team_b_score } = match;
  
  // 2. Determine winner
  const teamAWon = team_a_score > team_b_score;
  const winners = teamAWon ? team_a_players : team_b_players;
  const losers = teamAWon ? team_b_players : team_a_players;
  
  // 3. Calculate average ELO for each team
  const winnersElo = await getAverageELO(winners);
  const losersElo = await getAverageELO(losers);
  
  // 4. Calculate ELO changes
  const K = 32;  // K-factor
  const expectedWinnerScore = 1 / (1 + Math.pow(10, (losersElo - winnersElo) / 400));
  const eloChange = Math.round(K * (1 - expectedWinnerScore));
  
  // 5. Update each player's ELO
  for (const playerId of winners) {
    await updatePlayerELO(playerId, eloChange, matchId);
  }
  
  for (const playerId of losers) {
    await updatePlayerELO(playerId, -eloChange, matchId);
  }
  
  return { winnersGain: eloChange, losersLoss: -eloChange };
}

async function updatePlayerELO(
  playerId: string, 
  eloChange: number, 
  matchId: string
) {
  // Get current ELO
  const { data: player } = await supabase
    .from('league_players')
    .select('elo, matches_played, wins, losses')
    .eq('id', playerId)
    .single();
  
  const oldElo = player.elo;
  const newElo = oldElo + eloChange;
  
  // Update league_players
  await supabase
    .from('league_players')
    .update({
      elo: newElo,
      matches_played: player.matches_played + 1,
      wins: eloChange > 0 ? player.wins + 1 : player.wins,
      losses: eloChange < 0 ? player.losses + 1 : player.losses,
      updated_at: new Date().toISOString()
    })
    .eq('id', playerId);
  
  // Insert into elo_history
  await supabase
    .from('elo_history')
    .insert({
      player_id: playerId,
      match_id: matchId,
      old_elo: oldElo,
      new_elo: newElo,
      change: eloChange,
      recorded_at: new Date().toISOString()
    });
}
```

### EloChangeDisplay Component

**Usage:**
```typescript
import { EloChangeDisplay } from '@/components/EloChangeDisplay';

// Display after match recording
<EloChangeDisplay 
  change={+25}  // Positive for gain
  size="large"
/>

// Shows: +25 in green with up arrow
// or: -18 in red with down arrow
```

### Database Schema

**elo_history table:**
```sql
CREATE TABLE elo_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES league_players(id),
  match_id UUID REFERENCES matches(id),
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  change INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Testing Checklist

**ELO Calculation Tests:**
- [ ] Equal ELO players: ~±16 change
- [ ] Higher ELO wins: small gain (~+8)
- [ ] Lower ELO wins: large gain (~+24)
- [ ] Higher ELO loses: large loss (~-24)
- [ ] Lower ELO loses: small loss (~-8)

**Integration Tests:**
- [ ] Record match → ELO updates
- [ ] Multiple players → All updated
- [ ] History recorded correctly
- [ ] Leaderboard reflects changes
- [ ] Display shows correct changes

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Business Logic - ELO Calculation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - ELO System]
- [Source: _bmad-output/planning-artifacts/prd.md#FR2.2: Calcul ELO Automatique]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5: Match Recording & ELO System]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/utils/elo.ts (verify ELO calculation)
- src/services/DatabaseService.ts (add calculateAndUpdateELO)
- src/components/EloChangeDisplay.tsx (verify component exists)

**Database Tables:**
- elo_history (verify schema and RLS policies)
- league_players (verify elo field updates)
