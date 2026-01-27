# Story 3.3: Participant Management

Status: ready-for-dev

## Story

As an organizer,
I want to see who's participating in my tournament,
So that I can track engagement and manage the event.

## Acceptance Criteria

**Given** a tournament exists with participants
**When** organizer views tournament dashboard
**Then** list of participants is displayed
**And** each participant shows name and basic stats (ELO, matches played)
**And** participant list is readable and clear
**And** participant count is displayed
**And** list updates when new participants join

## Tasks / Subtasks

- [ ] Review TournamentDashboard component (AC: List displayed)
  - [ ] Check src/pages/TournamentDashboard.tsx
  - [ ] Verify participants section exists
  - [ ] Ensure list renders all participants
  - [ ] Test empty state (no participants yet)

- [ ] Fetch tournament participants (AC: Data loaded)
  - [ ] Query tournament_players table
  - [ ] Join with users and anonymous_users
  - [ ] Load league_players stats (ELO, matches)
  - [ ] Handle both authenticated and anonymous users

- [ ] Display participant information (AC: Shows name and stats)
  - [ ] Show participant name (display_name or email)
  - [ ] Display current ELO
  - [ ] Show matches played count
  - [ ] Display win/loss record (optional)
  - [ ] Style with readable typography

- [ ] Display participant count (AC: Count displayed)
  - [ ] Show total participant count
  - [ ] Update count when participants join
  - [ ] Display prominently in header
  - [ ] Format: "X participants"

- [ ] Implement real-time updates (AC: List updates)
  - [ ] Use optimistic updates for instant feedback
  - [ ] Sync with Supabase on interval or websocket
  - [ ] Test new participant appears immediately
  - [ ] Ensure smooth UI transitions

- [ ] Design participant list UI (AC: Readable and clear)
  - [ ] Use card or list layout
  - [ ] Ensure large, readable text
  - [ ] High contrast for visibility
  - [ ] Responsive design (mobile-friendly)
  - [ ] Test in dim lighting conditions

## Dev Notes

### Existing Components

**TournamentDashboard.tsx:**
- Already exists in `src/pages/TournamentDashboard.tsx`
- Should display participant list
- Review and enhance with stats display

### Data Loading

**Fetch Participants:**
```typescript
const loadTournamentParticipants = async (tournamentId: string) => {
  const { data, error } = await supabase
    .from('tournament_players')
    .select(`
      id,
      joined_at,
      user:users (
        id,
        email,
        display_name
      ),
      anonymous_user:anonymous_users (
        id,
        display_name
      ),
      league_player:league_players!inner (
        elo,
        matches_played,
        wins,
        losses
      )
    `)
    .eq('tournament_id', tournamentId)
    .order('joined_at', { ascending: true });
  
  if (error) throw error;
  
  return data.map(tp => ({
    id: tp.id,
    name: tp.user?.display_name || tp.user?.email || tp.anonymous_user?.display_name || 'Anonymous',
    elo: tp.league_player?.elo || 1500,
    matchesPlayed: tp.league_player?.matches_played || 0,
    wins: tp.league_player?.wins || 0,
    losses: tp.league_player?.losses || 0,
    joinedAt: tp.joined_at
  }));
};
```

### Participant List Component

```typescript
interface ParticipantListProps {
  participants: Participant[];
}

function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-400">
          Aucun participant pour le moment. Partagez le QR code pour inviter des joueurs !
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-white mb-4">
        Participants ({participants.length})
      </h3>
      
      {participants.map(participant => (
        <div 
          key={participant.id}
          className="bg-slate-800 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h4 className="text-lg font-semibold text-white">
              {participant.name}
            </h4>
            <p className="text-sm text-slate-400">
              {participant.matchesPlayed} matchs · {participant.wins}V - {participant.losses}D
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-500">
              {participant.elo}
            </div>
            <div className="text-xs text-slate-400">
              ELO
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Real-Time Updates

**Optimistic Updates:**
```typescript
// When a participant joins
const onParticipantJoin = (newParticipant: Participant) => {
  // Add to list immediately (optimistic)
  setParticipants(prev => [...prev, newParticipant]);
  
  // Sync with Supabase
  syncParticipants();
};

// Periodic refresh (every 30s) or use Supabase Realtime
useEffect(() => {
  const interval = setInterval(() => {
    syncParticipants();
  }, 30000);
  
  return () => clearInterval(interval);
}, [tournamentId]);
```

### Testing Checklist

**Manual Testing:**
1. View tournament → Participants list displayed
2. No participants → Empty state shown
3. Add participant → Count updates
4. Stats displayed correctly
5. Real-time update works
6. Mobile responsive design

**Edge Cases:**
- Tournament with 0 participants
- Tournament with 100+ participants
- Participants with missing stats
- Anonymous vs authenticated participants
- Network offline (cached data)

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture - Data Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Real-Time Updates]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1.3: Gestion des Participants]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Tournament Creation & Management]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/pages/TournamentDashboard.tsx (add participant list)
- src/services/DatabaseService.ts (add loadTournamentParticipants method)
- src/components/ParticipantList.tsx (create new component, optional)
