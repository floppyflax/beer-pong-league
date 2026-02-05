# Story 11.4: League Stats (Premium Feature)

Status: ready-for-dev

## Story

As a league participant in a premium league,
I want to view detailed league statistics across all matches and tournaments,
so that I can track long-term performance and compare players over time.

## Context

League Stats are similar to Tournament Stats but aggregate data across multiple tournaments and direct league matches. They provide a comprehensive view of league-wide performance.

**Key Metrics:**
- Overall ELO evolution (all league activity)
- Win rate across tournaments
- Tournament participation rate
- Head-to-head records
- Performance trends

**Dependencies:**
- Story 11.2 (League Detail)
- Story 11.3 (Tournament Stats for reference)

## Acceptance Criteria

### AC1: Premium Access Gate
1. **Given** user on league detail page
   **When** league.creatorIsPremium === true
   **Then** "Stats" tab is visible
   **When** league.creatorIsPremium === false
   **Then** "Stats" tab is hidden OR disabled

### AC2: League Overview Stats
2. **Given** user on Stats tab
   **Then** display overview cards:
   - Total matches (direct + tournaments)
   - Total tournaments held
   - Total participants
   - League duration (start date to present)

### AC3: Overall ELO Evolution
3. **Given** league tracks ELO across all activity
   **Then** display cumulative ELO chart:
   - X-axis: Time (months/weeks)
   - Y-axis: ELO
   - Top 5 players across all league activity
   - Include both tournament and direct matches

### AC4: Tournament Participation Table
4. **Given** league has tournaments
   **Then** display participation table:
   - Player name
   - Tournaments joined
   - Total matches played
   - Overall win rate
   **And** sort by participation (desc)

### AC5: Head-to-Head Records
5. **Given** league has match history
   **Then** display head-to-head matrix (optional, advanced):
   - Player A vs Player B record
   - W-L count for each matchup
   **Or** simplified: Top rivalries (most frequent matchups)

### AC6: Performance Trends
6. **Given** league has sufficient history
   **Then** display trend cards:
   - Most consistent player (lowest ELO variance)
   - Most improved over time (ELO gain)
   - Most active player (total matches)

### AC7: Responsive & Scoped to League
7. **Given** stats render
   **Then** ensure data is scoped to league only
   **And** apply responsive layout (same as Tournament Stats)

## Tasks / Subtasks

### Task 1: Create LeagueStatsTab component (4h)
- [ ] Create `src/components/league/StatsTab.tsx`
- [ ] Implement overview cards (matches, tournaments, participants)
- [ ] Add responsive layout
- [ ] Handle loading/error states

### Task 2: Overall ELO Chart (4h)
- [ ] Reuse ELOChart component from Tournament Stats
- [ ] Fetch cumulative ELO data (all league matches)
- [ ] Filter for top 5 players
- [ ] Display with league-specific styling

### Task 3: Tournament Participation Table (3h)
- [ ] Create `src/components/league/ParticipationTable.tsx`
- [ ] Fetch player participation data
- [ ] Count tournaments joined per player
- [ ] Calculate overall win rate
- [ ] Sort by participation

### Task 4: Performance Trends Cards (3h)
- [ ] Create `src/components/league/PerformanceTrends.tsx`
- [ ] Calculate "Most Consistent" (ELO variance)
- [ ] Calculate "Most Improved" (ELO gain)
- [ ] Calculate "Most Active" (match count)
- [ ] Display as highlight cards

### Task 5: Head-to-Head (optional, 4h)
- [ ] Create `src/components/league/HeadToHead.tsx`
- [ ] Calculate head-to-head records
- [ ] Display top rivalries
- [ ] Or full matrix if feasible

### Task 6: Data fetching logic (5h)
- [ ] Create `useLeagueStats(id)` hook
- [ ] Fetch all league matches (direct + tournament)
- [ ] Aggregate player stats across all activity
- [ ] Calculate ELO history
- [ ] Calculate trends
- [ ] Cache with React Query

### Task 7: Responsive design (2h)
- [ ] Mobile: Vertical stack
- [ ] Desktop: Grid layout
- [ ] Test on multiple breakpoints

### Task 8: Unit tests (3h)
- [ ] Test LeagueStatsTab renders
- [ ] Test data aggregation
- [ ] Test premium gate
- [ ] Mock league data

### Task 9: Integration tests (2h)
- [ ] Test full stats display
- [ ] Test with multiple tournaments
- [ ] Test performance

**Total Estimate:** 30 hours (4 jours)

## Dev Notes

### useLeagueStats Hook
```typescript
// src/hooks/useLeagueStats.ts
export const useLeagueStats = (leagueId: string) => {
  return useQuery({
    queryKey: ['league', leagueId, 'stats'],
    queryFn: async () => {
      // Fetch all matches (direct league + tournament matches)
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(id, name),
          team1_player1:players!team1_player1_id(*),
          team2_player1:players!team2_player1_id(*)
        `)
        .eq('league_id', leagueId)
        .order('played_at', { ascending: true });
      
      // Aggregate stats
      const playerStats = calculateLeaguePlayerStats(matches);
      const eloHistory = calculateCumulativeELOHistory(matches);
      const participationData = calculateTournamentParticipation(matches);
      const trends = calculatePerformanceTrends(playerStats);
      
      return {
        overview: {
          totalMatches: matches.length,
          totalTournaments: new Set(matches.filter(m => m.tournament_id).map(m => m.tournament_id)).size,
          totalPlayers: new Set(matches.flatMap(m => [m.team1_player1_id, m.team2_player1_id])).size,
          startDate: matches[0]?.played_at,
        },
        playerStats,
        eloHistory,
        participationData,
        trends,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
```

### Tournament Participation Table
```typescript
// src/components/league/ParticipationTable.tsx
export const ParticipationTable = ({ participationData }) => {
  const sortedPlayers = [...participationData].sort((a, b) => 
    b.tournamentsJoined - a.tournamentsJoined
  );
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-x-auto">
      <h3 className="text-lg font-bold text-white mb-4">Participation aux Tournois</h3>
      <table className="w-full">
        <thead className="text-left text-slate-400 text-sm border-b border-slate-700">
          <tr>
            <th className="pb-3">Joueur</th>
            <th className="pb-3 text-center">Tournois</th>
            <th className="pb-3 text-center">Matchs</th>
            <th className="pb-3 text-right">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(player => (
            <tr key={player.id} className="border-b border-slate-700/50">
              <td className="py-3 text-white font-medium">{player.name}</td>
              <td className="py-3 text-center text-slate-400">{player.tournamentsJoined}</td>
              <td className="py-3 text-center text-slate-400">{player.matchesPlayed}</td>
              <td className="py-3 text-right text-primary font-bold">
                {player.overallWinRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#stats-premium-feature`  
**Epic:** Epic 12 - Premium Stats Implementation  
**Depends on:** Story 11.2, Story 11.3

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
