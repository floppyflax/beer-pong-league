# Story 5.4: Personal Statistics Display

Status: ready-for-dev

## Story

As a player,
I want to see my personal statistics,
So that I can track my performance over time.

## Acceptance Criteria

**Given** a player has played matches
**When** they view their profile or stats
**Then** current ELO is displayed prominently
**And** total matches played is shown
**And** wins and losses are displayed
**And** current streak is shown (win streak or loss streak)
**And** stats are accessible from player profile page
**And** stats update in real-time after matches

## Tasks / Subtasks

- [ ] Review PlayerProfile page (AC: Stats accessible)
  - [ ] Check src/pages/PlayerProfile.tsx exists
  - [ ] Verify page structure
  - [ ] Test page loads correctly
  - [ ] Ensure routing works

- [ ] Display current ELO (AC: ELO displayed prominently)
  - [ ] Large, prominent ELO display
  - [ ] Visual emphasis (size, color)
  - [ ] Show ELO label
  - [ ] Test display works

- [ ] Display match statistics (AC: Matches, wins, losses)
  - [ ] Total matches played
  - [ ] Total wins
  - [ ] Total losses
  - [ ] Win rate percentage
  - [ ] Test stats are accurate

- [ ] Calculate and display streak (AC: Streak shown)
  - [ ] Query recent matches
  - [ ] Calculate current streak
  - [ ] Determine win or loss streak
  - [ ] Display with icon/color
  - [ ] Test streak calculation

- [ ] Design stats layout (AC: Clear display)
  - [ ] Prominent ELO at top
  - [ ] Stats grid/cards layout
  - [ ] Large, readable text
  - [ ] High contrast colors
  - [ ] Responsive design

- [ ] Implement real-time updates (AC: Updates after matches)
  - [ ] Listen for match completion
  - [ ] Refresh stats automatically
  - [ ] Use optimistic updates
  - [ ] Test updates work

## Dev Notes

### PlayerProfile Component

**src/pages/PlayerProfile.tsx:**
```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Target, TrendingUp, TrendingDown, Flame } from 'lucide-react';

interface PlayerStats {
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  currentStreak: number;  // Positive for win streak, negative for loss streak
  winRate: number;
}

export function PlayerProfile() {
  const { playerId } = useParams();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  
  useEffect(() => {
    loadPlayerStats();
  }, [playerId]);
  
  const loadPlayerStats = async () => {
    // Load from league_players
    const { data: player } = await supabase
      .from('league_players')
      .select('elo, matches_played, wins, losses')
      .eq('id', playerId)
      .single();
    
    // Calculate streak
    const streak = await calculateStreak(playerId);
    
    // Calculate win rate
    const winRate = player.matches_played > 0
      ? (player.wins / player.matches_played) * 100
      : 0;
    
    setStats({
      elo: player.elo,
      matchesPlayed: player.matches_played,
      wins: player.wins,
      losses: player.losses,
      currentStreak: streak,
      winRate: Math.round(winRate)
    });
  };
  
  if (!stats) return <LoadingSpinner />;
  
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* ELO Display - Prominent */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-8 text-center mb-6">
          <div className="text-slate-900 text-lg font-semibold mb-2">
            Votre ELO
          </div>
          <div className="text-slate-900 text-7xl font-bold">
            {stats.elo}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Matches Played */}
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <Target className="text-amber-500 mx-auto mb-2" size={32} />
            <div className="text-3xl font-bold text-white">
              {stats.matchesPlayed}
            </div>
            <div className="text-slate-400">Matchs Joués</div>
          </div>
          
          {/* Win Rate */}
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <Trophy className="text-amber-500 mx-auto mb-2" size={32} />
            <div className="text-3xl font-bold text-white">
              {stats.winRate}%
            </div>
            <div className="text-slate-400">Taux de Victoire</div>
          </div>
          
          {/* Wins */}
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <TrendingUp className="text-green-500 mx-auto mb-2" size={32} />
            <div className="text-3xl font-bold text-green-500">
              {stats.wins}
            </div>
            <div className="text-slate-400">Victoires</div>
          </div>
          
          {/* Losses */}
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <TrendingDown className="text-red-500 mx-auto mb-2" size={32} />
            <div className="text-3xl font-bold text-red-500">
              {stats.losses}
            </div>
            <div className="text-slate-400">Défaites</div>
          </div>
        </div>
        
        {/* Current Streak */}
        {stats.currentStreak !== 0 && (
          <div className={`
            rounded-lg p-6 text-center
            ${stats.currentStreak > 0 ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'}
          `}>
            <Flame 
              className={`mx-auto mb-2 ${stats.currentStreak > 0 ? 'text-green-500' : 'text-red-500'}`} 
              size={40} 
            />
            <div className={`text-4xl font-bold ${stats.currentStreak > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(stats.currentStreak)}
            </div>
            <div className="text-white text-lg">
              {stats.currentStreak > 0 ? 'Série de Victoires' : 'Série de Défaites'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Streak Calculation

**Calculate current win/loss streak:**
```typescript
async function calculateStreak(playerId: string): Promise<number> {
  // Get recent matches ordered by date
  const { data: matches } = await supabase
    .from('match_players')
    .select(`
      match:matches (
        id,
        team_a_score,
        team_b_score,
        played_at
      ),
      team
    `)
    .eq('player_id', playerId)
    .order('played_at', { ascending: false })
    .limit(50);
  
  if (!matches || matches.length === 0) return 0;
  
  let streak = 0;
  let lastResult: 'win' | 'loss' | null = null;
  
  for (const mp of matches) {
    const { match, team } = mp;
    const won = (team === 'A' && match.team_a_score > match.team_b_score) ||
                (team === 'B' && match.team_b_score > match.team_a_score);
    
    const currentResult = won ? 'win' : 'loss';
    
    if (lastResult === null) {
      lastResult = currentResult;
      streak = won ? 1 : -1;
    } else if (lastResult === currentResult) {
      streak += won ? 1 : -1;
    } else {
      break;  // Streak broken
    }
  }
  
  return streak;
}
```

### Real-Time Updates

**Subscribe to match updates:**
```typescript
useEffect(() => {
  // Refresh stats when new match is recorded
  const channel = supabase
    .channel('player-stats')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches',
      filter: `player_id=eq.${playerId}`
    }, () => {
      loadPlayerStats();
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [playerId]);
```

### Testing Checklist

**Stats Display:**
- [ ] ELO displayed prominently
- [ ] Matches, wins, losses correct
- [ ] Win rate calculated correctly
- [ ] Streak displayed correctly
- [ ] Responsive on all devices

**Streak Calculation:**
- [ ] Win streak: positive number
- [ ] Loss streak: negative number
- [ ] No matches: streak = 0
- [ ] Streak breaks correctly
- [ ] Recent matches only (last 50)

**Real-Time Updates:**
- [ ] Stats update after match
- [ ] Optimistic updates work
- [ ] Sync with Supabase works
- [ ] No memory leaks (unsubscribe)

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture - Data Display]
- [Source: _bmad-output/planning-artifacts/architecture.md#Business Logic - Stats Calculation]
- [Source: _bmad-output/planning-artifacts/prd.md#FR3.2: Statistiques Personnelles]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5: Match Recording & ELO System]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/pages/PlayerProfile.tsx (implement stats display)
- src/services/DatabaseService.ts (add calculateStreak method)
