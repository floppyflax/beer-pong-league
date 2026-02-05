# Story 12.1: Personal Stats (Premium User Feature)

Status: ready-for-dev

## Story

As a premium user,
I want to view my personal statistics across all tournaments and leagues I've participated in,
so that I can track my overall performance and progress over time.

## Context

Personal Stats are premium-only and tied to the **user's premium status** (not tournament/league creator). They aggregate data across all the user's activity (all tournaments, all leagues) to provide a comprehensive performance view.

**Key Features:**
- Cross-tournament and cross-league aggregation
- Personal ELO evolution timeline
- Overall win rate and match history
- Performance breakdown by opponent
- Achievements/badges

**Location:** Profile page → "Mes Stats" tab (Story 10.5)

**Dependencies:**
- Story 10.5 (Profile Page)
- Story 11.3 & 11.4 (Stats components for reuse)

## Acceptance Criteria

### AC1: Premium User Gate
1. **Given** user on Profile → Mes Stats tab
   **When** user.isPremium === true
   **Then** display personal statistics
   **When** user.isPremium === false
   **Then** display premium paywall with teaser

### AC2: Personal Overview Cards
2. **Given** premium user viewing stats
   **Then** display overview cards:
   - Total matches played (all tournaments + leagues)
   - Overall win rate (%)
   - Current average ELO
   - Total tournaments joined
   - Total leagues joined
   **And** cards in responsive grid (2 cols mobile, 3-4 cols desktop)

### AC3: Personal ELO Evolution Chart
3. **Given** user has ELO history
   **Then** display line chart:
   - X-axis: Time (last 90 days or all-time toggle)
   - Y-axis: ELO score
   - Single line (user's ELO progression)
   - Markers for tournaments joined
   - Tooltip with date + ELO value

### AC4: Win Rate by Context
4. **Given** user has matches in multiple contexts
   **Then** display breakdown table:
   - Context (Tournament name or League name)
   - Matches played
   - Wins / Losses
   - Win rate (%)
   **And** sort by recent activity or win rate

### AC5: Performance by Opponent
5. **Given** user has played against multiple opponents
   **Then** display top opponents table:
   - Opponent name
   - Matches played (vs this opponent)
   - W-L record
   - Win rate vs this opponent
   **And** sort by matches played (most frequent opponents first)

### AC6: Achievements (Optional MVP)
6. **Given** user has achievements
   **Then** display achievement badges:
   - "First Win" 🏆
   - "10 Matches Played" 🎯
   - "Win Streak 5" 🔥
   - "ELO 1500" ⭐
   **Or** show placeholder "Coming soon"

### AC7: Time Range Filter
7. **Given** user viewing personal stats
   **Then** provide time range toggle:
   - "Last 30 days"
   - "Last 90 days"
   - "All time" (default)
   **When** user changes filter
   **Then** update charts and stats accordingly

### AC8: Responsive Layout
8. **Given** personal stats render
   **When** viewport < 768px
   **Then** vertical stack, full width
   **When** viewport >= 1024px
   **Then** 2-column layout, charts full width

## Tasks / Subtasks

### Task 1: Update MesStatsTab component (4h)
- [ ] Update `src/components/profile/MesStatsTab.tsx`
- [ ] Check user.isPremium status
- [ ] If premium: display personal stats
- [ ] If not: display paywall (already done in Story 10.5)
- [ ] Add loading/error states

### Task 2: Personal Overview Cards (3h)
- [ ] Create `src/components/stats/PersonalOverview.tsx`
- [ ] Fetch aggregate stats (matches, win rate, ELO, tournaments, leagues)
- [ ] Display in card grid
- [ ] Responsive layout

### Task 3: Personal ELO Chart (4h)
- [ ] Reuse ELOChart component
- [ ] Fetch user's ELO history across all activity
- [ ] Add tournament markers (optional)
- [ ] Time range filter support
- [ ] Responsive sizing

### Task 4: Win Rate by Context Table (3h)
- [ ] Create `src/components/stats/WinRateByContext.tsx`
- [ ] Fetch matches grouped by tournament/league
- [ ] Calculate win rate per context
- [ ] Display in table format
- [ ] Sort by recent activity

### Task 5: Performance by Opponent Table (3h)
- [ ] Create `src/components/stats/PerformanceByOpponent.tsx`
- [ ] Fetch matches grouped by opponent
- [ ] Calculate W-L record per opponent
- [ ] Display top 10 opponents
- [ ] Sort by frequency

### Task 6: Achievements (optional, 3h)
- [ ] Create `src/components/stats/Achievements.tsx`
- [ ] Define achievement logic (matches, win streak, ELO)
- [ ] Check user achievements
- [ ] Display as badges with unlock status
- [ ] Or show "Coming soon" placeholder

### Task 7: Time Range Filter (2h)
- [ ] Add time range selector (Last 30/90 days, All time)
- [ ] Filter data based on selected range
- [ ] Update charts and tables
- [ ] Persist selection in state

### Task 8: Data fetching logic (5h)
- [ ] Create `usePersonalStats()` hook
- [ ] Fetch all user matches across all tournaments/leagues
- [ ] Aggregate stats: matches, wins, ELO history
- [ ] Group by context (tournament/league)
- [ ] Group by opponent
- [ ] Cache with React Query (staleTime: 15min)

### Task 9: Responsive design (2h)
- [ ] Mobile: Vertical stack, full width components
- [ ] Desktop: 2-column grid for tables, full width for charts
- [ ] Test on multiple breakpoints

### Task 10: Unit tests (3h)
- [ ] Test PersonalOverview renders with data
- [ ] Test time range filtering
- [ ] Test win rate calculations
- [ ] Test premium gate
- [ ] Mock user stats data

### Task 11: Integration tests (2h)
- [ ] Test full personal stats display
- [ ] Test time range filter updates
- [ ] Test premium vs non-premium view

**Total Estimate:** 34 hours (4-5 jours)

## Dev Notes

### usePersonalStats Hook
```typescript
// src/hooks/usePersonalStats.ts
export const usePersonalStats = (timeRange: '30d' | '90d' | 'all' = 'all') => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['personal-stats', user?.id, timeRange],
    queryFn: async () => {
      // Calculate date filter
      const startDate = timeRange === 'all' 
        ? null 
        : new Date(Date.now() - (timeRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000);
      
      // Fetch all matches user participated in
      let query = supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(id, name),
          league:leagues(id, name),
          team1_player1:players!team1_player1_id(id, pseudo),
          team2_player1:players!team2_player1_id(id, pseudo)
        `)
        .or(`team1_player1_id.eq.${user.id},team1_player2_id.eq.${user.id},team2_player1_id.eq.${user.id},team2_player2_id.eq.${user.id}`)
        .order('played_at', { ascending: true });
      
      if (startDate) {
        query = query.gte('played_at', startDate.toISOString());
      }
      
      const { data: matches } = await query;
      
      // Aggregate stats
      const overview = calculatePersonalOverview(matches, user.id);
      const eloHistory = calculatePersonalELOHistory(matches, user.id);
      const contextBreakdown = calculateWinRateByContext(matches, user.id);
      const opponentPerformance = calculatePerformanceByOpponent(matches, user.id);
      
      return {
        overview,
        eloHistory,
        contextBreakdown,
        opponentPerformance,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 min
    enabled: !!user?.id && !!user?.isPremium,
  });
};
```

### Win Rate by Context Table
```typescript
// src/components/stats/WinRateByContext.tsx
export const WinRateByContext = ({ contextBreakdown }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-x-auto">
      <h3 className="text-lg font-bold text-white mb-4">Performance par Contexte</h3>
      <table className="w-full">
        <thead className="text-left text-slate-400 text-sm border-b border-slate-700">
          <tr>
            <th className="pb-3">Contexte</th>
            <th className="pb-3 text-center">Matchs</th>
            <th className="pb-3 text-center">V-D</th>
            <th className="pb-3 text-right">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {contextBreakdown.map(ctx => (
            <tr key={ctx.id} className="border-b border-slate-700/50">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {ctx.type === 'tournament' ? <Trophy size={16} className="text-primary" /> : <Award size={16} className="text-primary" />}
                  <span className="text-white font-medium">{ctx.name}</span>
                </div>
              </td>
              <td className="py-3 text-center text-slate-400">{ctx.matchesPlayed}</td>
              <td className="py-3 text-center text-slate-400">
                <span className="text-green-500">{ctx.wins}</span> - <span className="text-red-500">{ctx.losses}</span>
              </td>
              <td className="py-3 text-right text-primary font-bold">
                {ctx.winRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Performance by Opponent Table
```typescript
// src/components/stats/PerformanceByOpponent.tsx
export const PerformanceByOpponent = ({ opponentPerformance }) => {
  const topOpponents = opponentPerformance.slice(0, 10);
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-x-auto">
      <h3 className="text-lg font-bold text-white mb-4">Performance vs Adversaires</h3>
      <table className="w-full">
        <thead className="text-left text-slate-400 text-sm border-b border-slate-700">
          <tr>
            <th className="pb-3">Adversaire</th>
            <th className="pb-3 text-center">Matchs</th>
            <th className="pb-3 text-center">Bilan</th>
            <th className="pb-3 text-right">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {topOpponents.map(opp => (
            <tr key={opp.opponentId} className="border-b border-slate-700/50">
              <td className="py-3 text-white font-medium">{opp.opponentName}</td>
              <td className="py-3 text-center text-slate-400">{opp.matchesPlayed}</td>
              <td className="py-3 text-center text-slate-400">
                {opp.wins}W - {opp.losses}L
              </td>
              <td className="py-3 text-right text-primary font-bold">
                {opp.winRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Time Range Filter
```typescript
// In MesStatsTab
const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('all');
const { data: stats, isLoading } = usePersonalStats(timeRange);

// Filter component
<div className="flex gap-2 mb-6">
  <FilterButton active={timeRange === '30d'} onClick={() => setTimeRange('30d')}>
    30 jours
  </FilterButton>
  <FilterButton active={timeRange === '90d'} onClick={() => setTimeRange('90d')}>
    90 jours
  </FilterButton>
  <FilterButton active={timeRange === 'all'} onClick={() => setTimeRange('all')}>
    Tout
  </FilterButton>
</div>
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#stats-premium-feature`  
**Epic:** Epic 12 - Premium Stats Implementation  
**Depends on:** Story 10.5, Story 11.3

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
