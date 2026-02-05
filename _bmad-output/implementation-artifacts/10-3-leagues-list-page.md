# Story 10.3: Leagues List Page

Status: ready-for-dev

## Story

As an authenticated user,
I want to see a list of all leagues I've joined or created (active first, then finished),
so that I can easily access any league and manage my long-term competitions.

## Context

The Leagues List page (`/leagues`) displays all leagues the user belongs to. Similar to Tournaments List, but with league-specific details.

**Key Features:**
- List of leagues (owned + joined)
- Status filtering (All, Active, Finished)
- Owner badge for created leagues
- Search by league name
- Bottom menu with "Créer" button (mobile)
- Premium limit enforcement (1 league max for free users)

**Dependencies:**
- Story 9.2 (Infrastructure)
- Story 9.4 (Bottom Menu Spécifique)
- Story 10.2 (Tournaments List for reference)

## Acceptance Criteria

### AC1: Page Layout
1. **Given** user visits `/leagues`
   **When** page loads
   **Then** display leagues list layout:
   - Header with title "Mes Leagues"
   - Search bar
   - Filter tabs (Tous, Actifs, Terminés)
   - List of league cards
   - Bottom menu with "CRÉER" button (mobile)

### AC2: League Cards Display
2. **Given** user has joined leagues
   **When** viewing list
   **Then** display each league as card:
   - League name (bold, 18px)
   - "Propriétaire" badge if user created it
   - Status badge (Active / Terminée)
   - Member count (e.g., "24 membres")
   - Tournament count (e.g., "3 tournois")
   - Last activity time (relative)
   **And** sort by: Active first (by last activity), then Finished (by end date)
   **When** user clicks card
   **Then** navigate to `/league/:id`

### AC3: Status Filtering
3. **Given** user viewing leagues list
   **When** filter tabs displayed
   **Then** show 3 tabs: "Tous" | "Actifs" | "Terminés"
   **When** user selects filter
   **Then** update list accordingly (same logic as Tournaments)

### AC4: Search Functionality
4. **Given** user has many leagues
   **When** user types in search bar
   **Then** filter leagues by name (case-insensitive)
   **And** update list in real-time

### AC5: Create League Action (Premium Limit)
5. **Given** user on `/leagues` page
   **When** user clicks "CRÉER" button
   **Then** check premium status:
   - **Free user with 0 active leagues** → navigate to `/create-league`
   - **Free user with 1+ active leagues** → show premium modal:
     - "Version gratuite limitée à 1 league active"
     - "Passez Premium pour créer des leagues illimitées"
     - "PASSER PREMIUM" button
   - **Premium user** → navigate to `/create-league`

### AC6: Owner Badge
6. **Given** user viewing league card
   **When** user is the league creator
   **Then** display "👑 Propriétaire" badge
   **And** highlight with orange accent

### AC7: Empty State
7. **Given** user has not joined any leagues
   **When** viewing `/leagues`
   **Then** display empty state:
   - Icon: 🏅
   - Title: "Aucune league"
   - Description: "Créez votre première league pour organiser des compétitions long terme"
   - Action button: "Créer une league" → check premium limit

### AC8: Responsive Design
8. **Given** leagues list renders
   **When** viewport < 768px
   **Then** cards full width, vertical stack
   **When** viewport >= 1024px
   **Then** cards in grid (2 columns), max-width 1200px

## Tasks / Subtasks

### Task 1: Create LeaguesList page (3h)
- [ ] Create `src/pages/LeaguesList.tsx`
- [ ] Implement layout (header, search, filters, list)
- [ ] Handle loading/error states
- [ ] Apply responsive styles

### Task 2: League Card component (2h)
- [ ] Create `src/components/leagues/LeagueCard.tsx`
- [ ] Display league info (name, status, members, tournaments)
- [ ] Show owner badge if applicable
- [ ] Handle click navigation
- [ ] Add hover effects

### Task 3: Data fetching (2h)
- [ ] Create `useLeaguesList()` hook
- [ ] Fetch leagues for current user (owned + joined)
- [ ] Include member count and tournament count
- [ ] Sort: active first, then finished
- [ ] Cache with React Query

### Task 4: Filtering & Search (2h)
- [ ] Implement filter tabs (Tous, Actifs, Terminés)
- [ ] Implement search with debounce
- [ ] Filter by name
- [ ] Update list reactively

### Task 5: Premium limit enforcement (3h)
- [ ] Update `usePremiumLimits()` hook to include leagues
- [ ] Check active league count vs limit
- [ ] Free: 1 league max, Premium: unlimited
- [ ] Show premium modal if at limit
- [ ] Handle "Créer" button click logic

### Task 6: Owner badge logic (1h)
- [ ] Check if user.id === league.creator_user_id
- [ ] Display "👑 Propriétaire" badge
- [ ] Apply orange accent styling

### Task 7: Empty state (1h)
- [ ] Create `LeaguesEmptyState` component
- [ ] Display when leagues.length === 0
- [ ] Add "Créer une league" CTA
- [ ] Check premium limit on click

### Task 8: Bottom Menu integration (1h)
- [ ] Import BottomMenuSpecific
- [ ] Configure "Créer" action with premium check
- [ ] Show lock icon if at limit

### Task 9: Unit tests (3h)
- [ ] Test page renders with leagues
- [ ] Test owner badge display
- [ ] Test filtering and search
- [ ] Test premium limit enforcement
- [ ] Test empty state
- [ ] Mock data hooks

### Task 10: Integration tests (2h)
- [ ] Test navigation to league detail
- [ ] Test "Créer" flow with premium modal
- [ ] Test empty state CTA

**Total Estimate:** 20 hours (2.5-3 jours)

## Dev Notes

### useLeaguesList Hook
```typescript
// src/hooks/useLeaguesList.ts
export const useLeaguesList = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['leagues', 'list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_members')
        .select(`
          league:leagues(
            id,
            name,
            status,
            creator_user_id,
            created_at,
            updated_at,
            member_count:league_members(count),
            tournament_count:tournaments(count)
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      
      const leagues = data.map(d => d.league);
      
      // Sort: active first, then finished
      return leagues.sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        }
        return a.status === 'active' ? -1 : 1;
      });
    },
    enabled: !!user?.id,
  });
};
```

### League Card Component
```typescript
// src/components/leagues/LeagueCard.tsx
interface LeagueCardProps {
  league: League;
}

export const LeagueCard = ({ league }: LeagueCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const isOwner = user?.id === league.creator_user_id;
  
  return (
    <div
      className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/league/${league.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {league.name}
            {isOwner && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                👑 Propriétaire
              </span>
            )}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span>{league.member_count} membres</span>
            <span>•</span>
            <span>{league.tournament_count} tournois</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
          league.status === 'active'
            ? 'bg-primary/20 text-primary'
            : 'bg-slate-700 text-slate-400'
        }`}>
          {league.status === 'active' ? 'Active' : 'Terminée'}
        </span>
      </div>
      
      <p className="text-xs text-slate-500">
        Dernière activité: {formatRelativeTime(league.updated_at)}
      </p>
    </div>
  );
};
```

### Premium Modal Content
```typescript
// When user at league limit
{
  title: "Limite gratuite atteinte",
  message: "La version gratuite est limitée à 1 league active. Passez Premium pour créer des leagues illimitées et profiter de toutes les fonctionnalités avancées.",
  actions: [
    { label: "PASSER PREMIUM", onClick: () => navigate('/profile?tab=premium'), primary: true },
    { label: "Annuler", onClick: closeModal },
  ]
}
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#page-leagues`  
**Epic:** Epic 10 - Connected User Experience  
**Depends on:** Story 9.2, Story 9.4, Story 10.2

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
