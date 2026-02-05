# Story 13.1: Mode Diffusion (Full-Screen Display)

Status: ready-for-dev

## Story

As a tournament or league admin,
I want to activate a full-screen display mode to show live rankings on a TV or projector,
so that participants can follow the competition in real-time during events.

## Context

Mode Diffusion is a full-screen, read-only view designed for large displays (TVs, projectors) during live events. It shows live rankings with automatic refresh and optimized for visibility from a distance.

**Key Features:**
- Admin-only access (via "Diffusion" button in detail page)
- Full-screen layout with no navigation
- Large, readable text and icons
- Auto-refresh every 30 seconds
- Optimized for landscape/horizontal displays
- Exit button (ESC key or close icon)

**Access:** Tournament or League detail page → "Diffusion" button (admin only)

**Dependencies:**
- Story 11.1 & 11.2 (Detail pages)

## Acceptance Criteria

### AC1: Access Control (Admin Only)
1. **Given** user is tournament/league admin
   **When** on detail page (any sub-tab)
   **Then** display "📺 DIFFUSION" button in contextual bar or header
   **When** user is NOT admin
   **Then** HIDE "Diffusion" button

### AC2: Diffusion Button & Launch
2. **Given** admin on tournament/league detail page
   **When** user clicks "Diffusion" button
   **Then** open new browser tab with `/display/tournament/:id` or `/display/league/:id`
   **And** enter full-screen mode (via Fullscreen API)

### AC3: Full-Screen Layout
3. **Given** display mode is active
   **Then** render full-screen layout:
   - Tournament/League name at top (large, centered)
   - Live rankings table (centered, max-width 1400px)
   - Last updated timestamp (bottom-right corner)
   - Exit button (top-right corner, subtle)
   **And** NO navigation elements (no menus, no tabs)
   **And** dark background (slate-900) for visibility

### AC4: Large, Readable Rankings Table
4. **Given** display mode shows rankings
   **Then** apply large text styling:
   - Rank: 48px bold
   - Player name: 36px medium
   - Points/ELO: 32px
   - Row height: 80px minimum
   **And** alternating row colors (slate-800 / slate-850)
   **And** top 3 highlighted with medal icons (🥇🥈🥉)

### AC5: Auto-Refresh
5. **Given** display mode is active
   **Then** fetch latest rankings every 30 seconds
   **And** update table without page reload
   **And** show refresh indicator (subtle animation)
   **When** new match recorded elsewhere
   **Then** rankings update within 30 seconds

### AC6: Exit Mechanism
6. **Given** user in display mode
   **When** user presses ESC key
   **Then** exit full-screen mode and close tab
   **When** user clicks exit button (X icon top-right)
   **Then** exit full-screen and close tab

### AC7: Responsive Display (Landscape Optimized)
7. **Given** display mode renders on various screens
   **Then** optimize for landscape orientation (16:9, 16:10)
   **And** support resolutions: 1920x1080, 1280x720, etc.
   **When** display on portrait or mobile
   **Then** show warning "Mode Diffusion optimisé pour écran horizontal"

### AC8: Error Handling
8. **Given** display mode loses connection
   **Then** show reconnection message
   **And** retry fetching data
   **When** tournament/league not found or deleted
   **Then** show error "Tournoi introuvable" with close button

## Tasks / Subtasks

### Task 1: Add Diffusion button to detail pages (2h)
- [ ] Update TournamentDashboard and LeagueDashboard
- [ ] Add "Diffusion" button to ContextualBar (admin only)
- [ ] Handle click → open new tab with display URL
- [ ] Style button with 📺 icon

### Task 2: Create Display page component (4h)
- [ ] Create `src/pages/DisplayMode.tsx`
- [ ] Support both tournament and league display
- [ ] Read entity ID from URL params
- [ ] Fetch rankings data
- [ ] Implement full-screen layout (no navigation)

### Task 3: Full-screen API integration (2h)
- [ ] Request fullscreen on mount (Fullscreen API)
- [ ] Handle fullscreen change events
- [ ] Handle ESC key to exit
- [ ] Add manual exit button (X icon)

### Task 4: Large Rankings Table component (4h)
- [ ] Create `src/components/display/LargeRankingsTable.tsx`
- [ ] Large text sizes (48px ranks, 36px names)
- [ ] Alternating row colors
- [ ] Medal icons for top 3
- [ ] Min row height 80px
- [ ] Responsive to screen width

### Task 5: Auto-refresh logic (3h)
- [ ] Implement polling with 30-second interval
- [ ] Fetch latest rankings
- [ ] Update state without page reload
- [ ] Show subtle refresh indicator
- [ ] Clear interval on unmount

### Task 6: Header & Footer elements (2h)
- [ ] Header: Tournament/League name (large, centered)
- [ ] Footer: "Dernière mise à jour: [timestamp]"
- [ ] Exit button (top-right, fixed position)
- [ ] Styling optimized for dark background

### Task 7: Error handling & reconnection (2h)
- [ ] Handle fetch errors (network issues)
- [ ] Show reconnection message
- [ ] Retry logic with exponential backoff
- [ ] Handle entity not found error

### Task 8: Landscape orientation check (1h)
- [ ] Detect screen orientation
- [ ] Show warning if portrait or mobile
- [ ] Optimize for 16:9 aspect ratios

### Task 9: Styling & animations (2h)
- [ ] Dark theme optimized for projection
- [ ] Smooth transitions on rank changes
- [ ] Subtle refresh animation
- [ ] High contrast for readability

### Task 10: Unit tests (2h)
- [ ] Test DisplayMode renders correctly
- [ ] Test auto-refresh polling
- [ ] Test fullscreen API calls
- [ ] Test exit mechanisms
- [ ] Mock entity data

### Task 11: Integration tests (2h)
- [ ] Test full display flow (button → new tab → display)
- [ ] Test auto-refresh updates
- [ ] Test ESC key exit

**Total Estimate:** 26 hours (3-4 jours)

## Dev Notes

### Display URL Structure
```
/display/tournament/:id
/display/league/:id
```

### DisplayMode Component
```typescript
// src/pages/DisplayMode.tsx
export const DisplayMode = () => {
  const { type, id } = useParams<{ type: 'tournament' | 'league'; id: string }>();
  const [rankings, setRankings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Fetch rankings
  const fetchRankings = useCallback(async () => {
    const { data } = await supabase
      .from(type === 'tournament' ? 'tournament_rankings' : 'league_rankings')
      .select('*')
      .eq(`${type}_id`, id)
      .order('rank', { ascending: true });
    
    setRankings(data || []);
    setLastUpdated(new Date());
  }, [type, id]);
  
  // Enter fullscreen on mount
  useEffect(() => {
    document.documentElement.requestFullscreen?.();
    
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchRankings]);
  
  // Exit on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col">
      {/* Header */}
      <header className="text-center mb-8 relative">
        <h1 className="text-6xl font-bold text-primary">
          {/* Entity name */}
          Tournoi de Beer Pong
        </h1>
        
        {/* Exit Button */}
        <button
          onClick={() => window.close()}
          className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-all"
        >
          <X size={24} />
        </button>
      </header>
      
      {/* Rankings Table */}
      <div className="flex-1 flex items-center justify-center">
        <LargeRankingsTable rankings={rankings} />
      </div>
      
      {/* Footer */}
      <footer className="text-right text-slate-500 text-lg">
        Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
      </footer>
    </div>
  );
};
```

### Large Rankings Table
```typescript
// src/components/display/LargeRankingsTable.tsx
export const LargeRankingsTable = ({ rankings }) => {
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };
  
  return (
    <div className="w-full max-w-7xl">
      <table className="w-full">
        <thead className="border-b-4 border-slate-700">
          <tr className="text-slate-400 text-2xl">
            <th className="pb-4 text-center w-24">Rang</th>
            <th className="pb-4 text-left">Joueur</th>
            <th className="pb-4 text-center w-40">Matchs</th>
            <th className="pb-4 text-center w-40">Points</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((player, index) => (
            <tr
              key={player.id}
              className={`border-b border-slate-700/50 ${
                index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-850/50'
              }`}
              style={{ height: '80px' }}
            >
              <td className="text-center text-6xl font-bold text-primary">
                {getMedal(player.rank)}
              </td>
              <td className="text-4xl font-medium">
                {player.pseudo}
              </td>
              <td className="text-center text-3xl text-slate-400">
                {player.matchesPlayed}
              </td>
              <td className="text-center text-3xl font-bold text-primary">
                {player.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Diffusion Button in ContextualBar
```typescript
// In TournamentDashboard or LeagueDashboard
const handleOpenDisplay = () => {
  const displayUrl = `/display/${entityType}/${entityId}`;
  window.open(displayUrl, '_blank', 'fullscreen=yes');
};

// Add to ContextualBar actions (admin only)
{
  id: 'display',
  label: 'DIFFUSION',
  icon: <Monitor size={20} />,
  onClick: handleOpenDisplay,
  visible: isAdmin,
}
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#mode-diffusion`  
**Epic:** Epic 13 - Display Mode  
**Depends on:** Story 11.1, Story 11.2

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
