# Story 11.2: League Detail Page - Sub-tabs with Matches & Tournaments

Status: ready-for-dev

## Story

As a league participant,
I want to see the league detail page with sub-tabs (Classement, Matchs, Tournois, Stats, Paramètres),
so that I can navigate between league rankings, direct matches, tournaments, and settings.

## Context

League Detail page is similar to Tournament Detail, but includes additional features:
- Direct league matches (not part of tournaments)
- List of tournaments within the league
- Match history with labels (tournament vs direct league match)

**Sub-tabs:**
1. **Classement** - League overall rankings
2. **Matchs** - All matches (tournaments + direct), chronological with labels
3. **Tournois** - List of tournaments in this league
4. **Stats** - League statistics (premium only)
5. **Paramètres** - Settings (admin only)

**Dependencies:**
- Story 11.1 (Tournament Detail for reference)
- Story 9.5 (Contextual Action Bar)

## Acceptance Criteria

### AC1: Sub-tab Navigation
1. **Given** user on `/league/:id`
   **When** page loads
   **Then** display horizontal sub-tabs:
   - "Classement" (default)
   - "Matchs"
   - "Tournois"
   - "Stats" (if league creator is premium)
   - "Paramètres" (if user is admin)

### AC2: Classement Tab (Overall League Rankings)
2. **Given** user on "Classement" tab
   **Then** display league-wide rankings:
   - Player pseudo
   - Total wins/losses (across all league matches)
   - ELO (if applicable)
   - Points
   **And** sort by ELO or points (desc)

### AC3: Matchs Tab (Chronological with Labels)
3. **Given** user on "Matchs" tab
   **Then** display all matches chronologically (most recent first)
   **And** for each match, show:
   - Match details (teams, score, date)
   - **Label**: "🏆 Tournoi: [Nom Tournoi]" OR "🏅 Match League"
   **When** match was part of a tournament
   **Then** label links to `/tournament/:id`

### AC4: Tournois Tab (List of League Tournaments)
4. **Given** user on "Tournois" tab
   **Then** display list of tournaments in this league:
   - Tournament name
   - Status (En cours / Terminé)
   - Player count
   - Last activity date
   **When** user clicks tournament card
   **Then** navigate to `/tournament/:id`
   **When** no tournaments
   **Then** show empty state: "Aucun tournoi créé"

### AC5: Stats Tab (Premium Gate)
5. **Given** user on "Stats" tab
   **When** league creator is premium
   **Then** display league statistics (placeholder for now)
   **When** league creator is NOT premium
   **Then** HIDE "Stats" tab

### AC6: Paramètres Tab (Admin Only)
6. **Given** user on "Paramètres" tab
   **Then** display league settings:
   - League name (editable by admin)
   - League status (Active / Terminée)
   - Delete league button (admin only)
   - Invitation settings (QR code, join code)

### AC7: Contextual Action Bar
7. **Given** user on league detail page
   **Then** display Contextual Action Bar with:
   - "⚡ NOUVEAU MATCH" (record direct league match)
   - "👤+ INVITER" (if admin or canInvite)
   **And** actions persist across sub-tabs

### AC8: Back Button
8. **Given** user on league detail page
   **Then** show back button in top-left corner
   **When** clicked
   **Then** navigate to previous page

## Tasks / Subtasks

### Task 1: Create LeagueDashboard page (4h)
- [ ] Create `src/pages/LeagueDashboard.tsx` (or update existing)
- [ ] Implement sub-tab navigation (5 tabs)
- [ ] Apply responsive layout
- [ ] Add back button
- [ ] Integrate SubTabNavigation component

### Task 2: Classement Tab component (2h)
- [ ] Create `src/components/league/ClassementTab.tsx`
- [ ] Fetch league-wide rankings
- [ ] Display player list with ELO/points
- [ ] Sort by ranking
- [ ] Handle empty state

### Task 3: Matchs Tab component (4h)
- [ ] Create `src/components/league/MatchsTab.tsx`
- [ ] Fetch all matches (direct + tournament matches)
- [ ] Sort chronologically (desc)
- [ ] Display match with label:
  - If `tournament_id` exists → "🏆 Tournoi: [name]"
  - Else → "🏅 Match League"
- [ ] Make tournament label clickable
- [ ] Handle empty state

### Task 4: Tournois Tab component (3h)
- [ ] Create `src/components/league/TournamentsTab.tsx`
- [ ] Fetch tournaments for this league
- [ ] Display tournament cards (name, status, players, date)
- [ ] Handle click → navigate to tournament detail
- [ ] Empty state: "Aucun tournoi"

### Task 5: Stats Tab component (2h)
- [ ] Create `src/components/league/StatsTab.tsx`
- [ ] Check league.creatorIsPremium
- [ ] Placeholder content for now (full implementation in Phase 5)
- [ ] Show premium paywall if not premium

### Task 6: Paramètres Tab component (3h)
- [ ] Create `src/components/league/ParametresTab.tsx`
- [ ] Display league settings (name, status)
- [ ] Editable name (admin only)
- [ ] Delete league button with confirmation
- [ ] Invitation section (QR code, join code)

### Task 7: Contextual Bar integration (2h)
- [ ] Import ContextualBar
- [ ] Configure "Nouveau Match" action (direct league match)
- [ ] Configure "Inviter" action (permission-based)
- [ ] Test on mobile and desktop

### Task 8: Data fetching (3h)
- [ ] Create `useLeague(id)` hook
- [ ] Fetch league details
- [ ] Fetch rankings
- [ ] Fetch matches with tournament info
- [ ] Fetch tournaments list
- [ ] Cache with React Query

### Task 9: Permissions logic (2h)
- [ ] Use `useDetailPagePermissions()` for league
- [ ] Check if user is admin
- [ ] Show/hide "Paramètres" tab
- [ ] Show/hide "Inviter" button

### Task 10: Unit tests (3h)
- [ ] Test sub-tab navigation
- [ ] Test match labels (tournament vs direct)
- [ ] Test permissions (admin vs player)
- [ ] Test premium-gated stats tab
- [ ] Mock league data

### Task 11: Integration tests (2h)
- [ ] Test full navigation flow
- [ ] Test tournament navigation from Matchs tab
- [ ] Test contextual actions

**Total Estimate:** 30 hours (4 jours)

## Dev Notes

### Matchs Tab with Labels
```typescript
// src/components/league/MatchsTab.tsx
export const MatchsTab = ({ leagueId }: { leagueId: string }) => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['league', leagueId, 'matches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(id, name)
        `)
        .eq('league_id', leagueId)
        .order('played_at', { ascending: false });
      
      return data;
    },
  });
  
  if (isLoading) return <SkeletonLoader />;
  
  if (!matches || matches.length === 0) {
    return <EmptyState message="Aucun match joué" />;
  }
  
  return (
    <div className="space-y-4">
      {matches.map(match => (
        <div key={match.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          {/* Match details */}
          <MatchCard match={match} />
          
          {/* Label */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            {match.tournament ? (
              <Link
                to={`/tournament/${match.tournament.id}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Trophy size={16} />
                <span>Tournoi: {match.tournament.name}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Award size={16} />
                <span>Match League</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Tournois Tab
```typescript
// src/components/league/TournamentsTab.tsx
export const TournamentsTab = ({ leagueId }: { leagueId: string }) => {
  const navigate = useNavigate();
  const { data: tournaments } = useQuery({
    queryKey: ['league', leagueId, 'tournaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false });
      
      return data;
    },
  });
  
  if (!tournaments || tournaments.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={48} />}
        title="Aucun tournoi"
        description="Créez votre premier tournoi dans cette league"
      />
    );
  }
  
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tournaments.map(tournament => (
        <div
          key={tournament.id}
          onClick={() => navigate(`/tournament/${tournament.id}`)}
          className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-primary/50 transition-all cursor-pointer"
        >
          <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span>{tournament.player_count} joueurs</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              tournament.is_finished 
                ? 'bg-slate-700 text-slate-400' 
                : 'bg-primary/20 text-primary'
            }`}>
              {tournament.is_finished ? 'Terminé' : 'En cours'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#page-detail-league`  
**Epic:** Epic 11 - Detail Pages & Sub-tabs  
**Depends on:** Story 11.1, Story 9.5

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
