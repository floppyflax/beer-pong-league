# Story 5.5: Optional Anti-Cheat Confirmation

Status: ready-for-dev

## Story

As an organizer,
I want to enable anti-cheat confirmation for my tournament,
So that match results are verified and reliable.

## Acceptance Criteria

**Given** a tournament with anti-cheat enabled
**When** a match is recorded
**Then** match status is set to "pending"
**And** losing team receives confirmation request
**And** match is not included in rankings until confirmed
**And** organizer can see pending matches
**And** match can be confirmed or rejected
**And** confirmed matches update rankings
**And** rejected matches are removed or flagged

## Tasks / Subtasks

- [ ] Verify anti-cheat schema (AC: Status set to pending)
  - [ ] Check matches.status field exists
  - [ ] Verify enum values (pending, confirmed, rejected)
  - [ ] Test status field works
  - [ ] Review anti_cheat_enabled in tournaments

- [ ] Implement pending match logic (AC: Set to pending)
  - [ ] When anti-cheat enabled, set status = 'pending'
  - [ ] When anti-cheat disabled, set status = 'confirmed'
  - [ ] Test status is set correctly
  - [ ] Verify match creation works

- [ ] Send confirmation request (AC: Losing team receives request)
  - [ ] Identify losing team players
  - [ ] Display confirmation UI
  - [ ] Show match details
  - [ ] Test confirmation request appears

- [ ] Exclude pending from rankings (AC: Not in rankings until confirmed)
  - [ ] Filter pending matches from ELO calculation
  - [ ] Filter pending from leaderboard
  - [ ] Test rankings exclude pending
  - [ ] Verify only confirmed matches count

- [ ] Display pending matches (AC: Organizer sees pending)
  - [ ] List pending matches in tournament dashboard
  - [ ] Show match details
  - [ ] Display pending status badge
  - [ ] Test list displays correctly

- [ ] Implement confirmation/rejection (AC: Can confirm or reject)
  - [ ] Add confirm button for losing team
  - [ ] Add reject button (optional)
  - [ ] Update match status on action
  - [ ] Test confirmation works

- [ ] Update rankings on confirmation (AC: Confirmed matches update)
  - [ ] Trigger ELO calculation on confirm
  - [ ] Update leaderboard
  - [ ] Show success message
  - [ ] Test rankings update correctly

- [ ] Handle rejected matches (AC: Rejected matches flagged)
  - [ ] Set status to 'rejected'
  - [ ] Optionally delete match
  - [ ] Notify match recorder
  - [ ] Test rejection works

## Dev Notes

### Database Schema

**matches.status field:**
```sql
-- Already exists from migration 002_add_anti_cheat.sql
ALTER TABLE matches
ADD COLUMN status TEXT DEFAULT 'confirmed'
CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- tournaments.anti_cheat_enabled field
ALTER TABLE tournaments
ADD COLUMN anti_cheat_enabled BOOLEAN DEFAULT FALSE;
```

### Match Recording with Anti-Cheat

**Modified recordMatch logic:**
```typescript
async function recordMatch(matchData: MatchInput) {
  // Check if tournament has anti-cheat enabled
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('anti_cheat_enabled')
    .eq('id', matchData.tournament_id)
    .single();
  
  // Set initial status based on anti-cheat setting
  const status = tournament.anti_cheat_enabled ? 'pending' : 'confirmed';
  
  // Create match
  const { data: match } = await supabase
    .from('matches')
    .insert({
      ...matchData,
      status,
      played_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // If confirmed immediately, calculate ELO
  if (status === 'confirmed') {
    await calculateAndUpdateELO(match.id);
  }
  
  return match;
}
```

### Confirmation UI

**Confirmation Request Component:**
```typescript
interface ConfirmationRequestProps {
  match: Match;
  onConfirm: () => void;
  onReject: () => void;
}

function MatchConfirmationRequest({ match, onConfirm, onReject }: ConfirmationRequestProps) {
  return (
    <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Confirmation Requise
      </h3>
      
      <div className="text-white mb-4">
        <p>Équipe A: {match.teamAScore}</p>
        <p>Équipe B: {match.teamBScore}</p>
        <p className="text-slate-400 mt-2">
          En tant que perdant, veuillez confirmer le résultat.
        </p>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
        >
          Confirmer
        </button>
        
        <button
          onClick={onReject}
          className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
        >
          Contester
        </button>
      </div>
    </div>
  );
}
```

### Confirmation Logic

**Confirm match:**
```typescript
async function confirmMatch(matchId: string) {
  // Update match status
  await supabase
    .from('matches')
    .update({ 
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId);
  
  // Calculate and update ELO
  await calculateAndUpdateELO(matchId);
  
  // Notify success
  toast.success('Match confirmé ! Le classement a été mis à jour.');
}

async function rejectMatch(matchId: string) {
  // Update match status
  await supabase
    .from('matches')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId);
  
  // Notify organizer
  toast.warning('Match contesté. L\'organisateur sera notifié.');
}
```

### Filter Pending Matches

**Exclude from leaderboard:**
```typescript
// Only count confirmed matches
const { data } = await supabase
  .from('league_players')
  .select(`
    *,
    matches:match_players!inner (
      match:matches!inner (
        status
      )
    )
  `)
  .eq('matches.match.status', 'confirmed')  // Only confirmed
  .eq('league_id', leagueId);
```

### Testing Checklist

**Anti-Cheat Flow:**
- [ ] Anti-cheat enabled → Match pending
- [ ] Anti-cheat disabled → Match confirmed
- [ ] Losing team sees confirmation
- [ ] Organizer sees pending matches
- [ ] Confirm → ELO updates
- [ ] Reject → Match flagged

**Rankings:**
- [ ] Pending matches not in leaderboard
- [ ] Confirmed matches in leaderboard
- [ ] Rejected matches excluded
- [ ] Stats accurate

**Edge Cases:**
- [ ] Both teams can confirm
- [ ] Organizer can override
- [ ] Multiple pending matches
- [ ] Network offline during confirmation

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Business Logic - Anti-Cheat System]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - Match Status]
- [Source: _bmad-output/planning-artifacts/prd.md#FR2.3: Anti-Triche Optionnel]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5: Match Recording & ELO System]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/services/DatabaseService.ts (modify recordMatch method)
- src/components/MatchConfirmationRequest.tsx (create new component)
- src/pages/TournamentDashboard.tsx (display pending matches)
- supabase/migrations/002_add_anti_cheat.sql (verify schema)
