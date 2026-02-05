# Story 11.3: Tournament Stats (Premium Feature)

Status: ready-for-dev

## Story

As a tournament participant in a premium tournament,
I want to view detailed tournament statistics (ELO evolution, win rates, performance metrics),
so that I can track progress and analyze the competition.

## Context

Tournament Stats are a premium feature accessible only if the tournament creator has a premium account. The stats tab displays rich analytics and visualizations for the tournament.

**Key Metrics:**
- ELO evolution timeline
- Win rate by player
- Match frequency heatmap
- Top performers

**Dependencies:**
- Story 11.1 (Tournament Detail)
- UX Design Doc (Stats section)

## Acceptance Criteria

### AC1: Premium Access Gate
1. **Given** user on tournament detail page
   **When** tournament.creatorIsPremium === true
   **Then** "Stats" tab is visible and clickable
   **When** user clicks "Stats" tab
   **Then** display tournament statistics
   **When** tournament.creatorIsPremium === false
   **Then** "Stats" tab is hidden OR disabled with 🔒 icon

### AC2: Stats Overview Section
2. **Given** user on Stats tab
   **Then** display overview cards:
   - Total matches played
   - Total participants
   - Average match duration (if tracked)
   - Tournament start/end date
   **And** cards in responsive grid (2 cols mobile, 4 cols desktop)

### AC3: ELO Evolution Chart
3. **Given** tournament tracks ELO
   **Then** display line chart:
   - X-axis: Time (days/matches)
   - Y-axis: ELO score
   - Multiple lines (top 5 players)
   - Tooltip on hover with player name + ELO
   **And** use lightweight chart library (uPlot or Recharts)

### AC4: Win Rate Ranking
4. **Given** tournament has matches
   **Then** display win rate table:
   - Player name
   - Matches played
   - Wins
   - Losses
   - Win rate (%)
   **And** sort by win rate (desc)
   **And** highlight top 3 with medals (🥇🥈🥉)

### AC5: Performance Metrics
5. **Given** tournament stats loaded
   **Then** display additional metrics:
   - Most active player (most matches)
   - Biggest winner (highest win streak)
   - Most improved (highest ELO gain)
   **And** show as highlight cards with icons

### AC6: Responsive Chart Display
6. **Given** stats render on mobile
   **Then** charts adapt to small width
   **And** scrollable if needed
   **And** legends below chart (not inline)
   **Given** stats render on desktop
   **Then** charts use full width
   **And** legends inline (right side)

### AC7: Loading & Error States
7. **Given** stats are loading
   **Then** show skeleton loaders for charts and cards
   **When** stats fetch fails
   **Then** show error message with retry button

## Tasks / Subtasks

### Task 1: Create TournamentStatsTab component (4h)
- [ ] Create `src/components/tournament/StatsTab.tsx`
- [ ] Implement overview cards (matches, participants, dates)
- [ ] Add responsive grid layout
- [ ] Handle loading/error states

### Task 2: ELO Evolution Chart (5h)
- [ ] Create `src/components/stats/ELOChart.tsx`
- [ ] Choose chart library (uPlot or Recharts)
- [ ] Fetch ELO history data for top 5 players
- [ ] Render line chart with multiple series
- [ ] Add tooltip with player info
- [ ] Responsive sizing

### Task 3: Win Rate Table (3h)
- [ ] Create `src/components/stats/WinRateTable.tsx`
- [ ] Fetch player stats (matches, wins, losses)
- [ ] Calculate win rate %
- [ ] Sort by win rate
- [ ] Add medal icons for top 3
- [ ] Mobile-friendly table

### Task 4: Performance Metrics Cards (3h)
- [ ] Create `src/components/stats/PerformanceMetrics.tsx`
- [ ] Calculate "Most Active Player" (count matches)
- [ ] Calculate "Biggest Winner" (max win streak)
- [ ] Calculate "Most Improved" (ELO gain)
- [ ] Display as highlight cards with icons

### Task 5: Data fetching logic (4h)
- [ ] Create `useTournamentStats(id)` hook
- [ ] Fetch matches with player info
- [ ] Aggregate stats (matches, wins, ELO history)
- [ ] Calculate derived metrics
- [ ] Cache with React Query (staleTime: 5min)

### Task 6: Chart library setup (2h)
- [ ] Install chart library (uPlot recommended for perf)
- [ ] Create chart wrapper component
- [ ] Configure responsive behavior
- [ ] Test bundle size impact

### Task 7: Responsive design (2h)
- [ ] Mobile: Vertical stack, full width charts
- [ ] Desktop: Grid layout, larger charts
- [ ] Test on multiple breakpoints
- [ ] Ensure legends readable

### Task 8: Unit tests (3h)
- [ ] Test StatsTab renders with data
- [ ] Test win rate calculations
- [ ] Test performance metrics calculations
- [ ] Test loading/error states
- [ ] Mock stats data

### Task 9: Integration tests (2h)
- [ ] Test full stats display
- [ ] Test premium gate (show/hide)
- [ ] Test chart interactions

**Total Estimate:** 28 hours (3.5 jours)

## Dev Notes

### useTournamentStats Hook
```typescript
// src/hooks/useTournamentStats.ts
export const useTournamentStats = (tournamentId: string) => {
  return useQuery({
    queryKey: ['tournament', tournamentId, 'stats'],
    queryFn: async () => {
      // Fetch all matches with player details
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          team1_player1:players!team1_player1_id(*),
          team1_player2:players!team1_player2_id(*),
          team2_player1:players!team2_player1_id(*),
          team2_player2:players!team2_player2_id(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('played_at', { ascending: true });
      
      // Aggregate stats
      const playerStats = calculatePlayerStats(matches);
      const eloHistory = calculateELOHistory(matches);
      const performanceMetrics = calculatePerformanceMetrics(matches);
      
      return {
        overview: {
          totalMatches: matches.length,
          totalPlayers: new Set(matches.flatMap(m => [m.team1_player1_id, m.team2_player1_id])).size,
          startDate: matches[0]?.played_at,
          endDate: matches[matches.length - 1]?.played_at,
        },
        playerStats,
        eloHistory,
        performanceMetrics,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
};
```

### ELO Chart Component
```typescript
// src/components/stats/ELOChart.tsx
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface ELOChartProps {
  data: {
    timestamps: number[];
    series: Array<{
      playerId: string;
      playerName: string;
      eloValues: number[];
    }>;
  };
}

export const ELOChart = ({ data }: ELOChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartRef.current || !data) return;
    
    const uplotData = [
      data.timestamps,
      ...data.series.map(s => s.eloValues),
    ];
    
    const opts: uPlot.Options = {
      width: chartRef.current.clientWidth,
      height: 300,
      series: [
        { label: 'Date' },
        ...data.series.map(s => ({
          label: s.playerName,
          stroke: getPlayerColor(s.playerId),
          width: 2,
        })),
      ],
      axes: [
        { label: 'Date' },
        { label: 'ELO' },
      ],
    };
    
    const chart = new uPlot(opts, uplotData, chartRef.current);
    
    return () => chart.destroy();
  }, [data]);
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-4">Évolution ELO</h3>
      <div ref={chartRef} className="w-full" />
    </div>
  );
};
```

### Win Rate Table
```typescript
// src/components/stats/WinRateTable.tsx
export const WinRateTable = ({ playerStats }) => {
  const sortedPlayers = [...playerStats].sort((a, b) => b.winRate - a.winRate);
  
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-x-auto">
      <h3 className="text-lg font-bold text-white mb-4">Taux de Victoire</h3>
      <table className="w-full">
        <thead className="text-left text-slate-400 text-sm border-b border-slate-700">
          <tr>
            <th className="pb-3">#</th>
            <th className="pb-3">Joueur</th>
            <th className="pb-3 text-center">Matchs</th>
            <th className="pb-3 text-center">V</th>
            <th className="pb-3 text-center">D</th>
            <th className="pb-3 text-right">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.id} className="border-b border-slate-700/50">
              <td className="py-3 text-slate-300">
                {getMedal(index) || index + 1}
              </td>
              <td className="py-3 text-white font-medium">{player.name}</td>
              <td className="py-3 text-center text-slate-400">{player.matchesPlayed}</td>
              <td className="py-3 text-center text-green-500">{player.wins}</td>
              <td className="py-3 text-center text-red-500">{player.losses}</td>
              <td className="py-3 text-right text-primary font-bold">
                {player.winRate.toFixed(1)}%
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
**Depends on:** Story 11.1

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
