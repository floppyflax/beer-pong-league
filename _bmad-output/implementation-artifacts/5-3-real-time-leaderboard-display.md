# Story 5.3: Real-Time Leaderboard Display

Status: ready-for-dev

## Story

As a player,
I want to see the leaderboard update in real-time,
So that I can track my position and see how I'm doing.

## Acceptance Criteria

**Given** a tournament with matches
**When** player views the leaderboard
**Then** leaderboard shows all players ranked by ELO
**And** top 3 players are visually highlighted
**And** position changes are animated when ELO updates
**And** leaderboard updates automatically after each match (< 500ms)
**And** leaderboard is clear and readable
**And** player can see their own position clearly
**And** ELO changes are displayed (positive/negative indicators)

## Tasks / Subtasks

- [ ] Create leaderboard component (AC: Shows ranked players)
  - [ ] Create Leaderboard component
  - [ ] Load league_players sorted by ELO
  - [ ] Display rank, name, ELO, stats
  - [ ] Style with Tailwind
  - [ ] Test rendering

- [ ] Highlight top 3 players (AC: Top 3 highlighted)
  - [ ] Special styling for rank 1 (gold)
  - [ ] Special styling for rank 2 (silver)
  - [ ] Special styling for rank 3 (bronze)
  - [ ] Visual distinction (colors, icons)
  - [ ] Test highlighting works

- [ ] Implement position animations (AC: Animated changes)
  - [ ] Detect position changes
  - [ ] Animate rank transitions
  - [ ] Use smooth transitions
  - [ ] Test animations work
  - [ ] Ensure performance (< 500ms)

- [ ] Add optimistic updates (AC: Updates < 500ms)
  - [ ] Update leaderboard immediately after match
  - [ ] Calculate new positions client-side
  - [ ] Sync with Supabase in background
  - [ ] Handle sync errors
  - [ ] Test update speed

- [ ] Design for readability (AC: Clear and readable)
  - [ ] Large text sizes
  - [ ] High contrast colors
  - [ ] Clear visual hierarchy
  - [ ] Responsive design
  - [ ] Test in dim lighting

- [ ] Highlight current player (AC: See own position)
  - [ ] Detect current user/anonymous user
  - [ ] Highlight their row
  - [ ] Scroll to their position
  - [ ] Visual distinction
  - [ ] Test highlighting works

- [ ] Display ELO changes (AC: Change indicators)
  - [ ] Show recent ELO change (+/-X)
  - [ ] Color-code positive/negative
  - [ ] Use arrows or icons
  - [ ] Show only for recent matches
  - [ ] Test display works

## Dev Notes

### Leaderboard Component

**src/components/Leaderboard.tsx:**
```typescript
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { EloChangeDisplay } from './EloChangeDisplay';

interface LeaderboardProps {
  leagueId: string;
  currentUserId?: string;
}

export function Leaderboard({ leagueId, currentUserId }: LeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  
  useEffect(() => {
    loadLeaderboard();
  }, [leagueId]);
  
  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('league_players')
      .select(`
        id,
        elo,
        matches_played,
        wins,
        losses,
        user:users (display_name, email),
        anonymous_user:anonymous_users (display_name)
      `)
      .eq('league_id', leagueId)
      .order('elo', { ascending: false });
    
    setPlayers(data || []);
  };
  
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/20 border-amber-500';
    if (rank === 2) return 'bg-slate-400/20 border-slate-400';
    if (rank === 3) return 'bg-orange-600/20 border-orange-600';
    return 'bg-slate-800 border-slate-700';
  };
  
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="text-amber-500" />
        Classement
      </h2>
      
      {players.map((player, index) => {
        const rank = index + 1;
        const isCurrentUser = player.id === currentUserId;
        
        return (
          <div
            key={player.id}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${getRankStyle(rank)}
              ${isCurrentUser ? 'ring-2 ring-amber-500' : ''}
            `}
          >
            {/* Rank */}
            <div className="text-3xl font-bold text-white w-12 text-center">
              {rank <= 3 ? (
                <Trophy className={`
                  ${rank === 1 ? 'text-amber-500' : ''}
                  ${rank === 2 ? 'text-slate-400' : ''}
                  ${rank === 3 ? 'text-orange-600' : ''}
                `} size={32} />
              ) : (
                rank
              )}
            </div>
            
            {/* Player Info */}
            <div className="flex-1">
              <div className="text-xl font-semibold text-white">
                {player.user?.display_name || player.user?.email || player.anonymous_user?.display_name || 'Anonymous'}
                {isCurrentUser && (
                  <span className="ml-2 text-sm text-amber-500">(Vous)</span>
                )}
              </div>
              <div className="text-sm text-slate-400">
                {player.matches_played} matchs · {player.wins}V - {player.losses}D
              </div>
            </div>
            
            {/* ELO */}
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {player.elo}
              </div>
              <div className="text-xs text-slate-400">ELO</div>
              
              {/* Recent change */}
              {player.recentChange && (
                <EloChangeDisplay 
                  change={player.recentChange} 
                  size="small"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Optimistic Updates

**Update leaderboard immediately after match:**
```typescript
const onMatchRecorded = (match: Match, eloChanges: EloChange[]) => {
  // Update leaderboard optimistically
  setPlayers(prevPlayers => {
    const updated = prevPlayers.map(player => {
      const change = eloChanges.find(c => c.playerId === player.id);
      if (change) {
        return {
          ...player,
          elo: player.elo + change.change,
          recentChange: change.change,
          matches_played: player.matches_played + 1,
          wins: change.change > 0 ? player.wins + 1 : player.wins,
          losses: change.change < 0 ? player.losses + 1 : player.losses
        };
      }
      return player;
    });
    
    // Re-sort by ELO
    return updated.sort((a, b) => b.elo - a.elo);
  });
  
  // Sync with Supabase in background
  setTimeout(loadLeaderboard, 1000);
};
```

### Position Animation

**CSS Transition:**
```css
.leaderboard-item {
  transition: all 0.3s ease-in-out;
}

/* Animate position change */
@keyframes position-change {
  0% { transform: translateX(-20px); opacity: 0.5; }
  100% { transform: translateX(0); opacity: 1; }
}

.position-changed {
  animation: position-change 0.5s ease-in-out;
}
```

### Testing Checklist

**Leaderboard Display:**
- [ ] Shows all players ranked by ELO
- [ ] Top 3 visually highlighted
- [ ] Current user highlighted
- [ ] Stats displayed correctly
- [ ] Responsive on all devices

**Real-Time Updates:**
- [ ] Updates after match (< 500ms)
- [ ] Position changes animated
- [ ] ELO changes displayed
- [ ] Sync with Supabase works
- [ ] Handles concurrent updates

**Performance:**
- [ ] Loads quickly (< 1s)
- [ ] Animations smooth (60fps)
- [ ] No lag with many players (100+)
- [ ] Optimistic updates instant

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture - Real-Time Updates]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AnimatedLeaderboard Component]
- [Source: _bmad-output/planning-artifacts/prd.md#FR3.1: Classement en Temps Réel]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5: Match Recording & ELO System]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/components/Leaderboard.tsx

**Files to Modify:**
- src/pages/LeagueDashboard.tsx (integrate Leaderboard)
- src/pages/TournamentDashboard.tsx (integrate Leaderboard)
- src/components/EloChangeDisplay.tsx (verify component)
