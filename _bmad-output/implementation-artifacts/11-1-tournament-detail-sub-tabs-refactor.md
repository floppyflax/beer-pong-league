# Story 11.1: Tournament Detail Page - Sub-tabs Refactor

Status: ready-for-dev

## Story

As a tournament participant,
I want to see the tournament detail page with clear sub-tabs (Classement, Matchs, Stats, Paramètres),
so that I can easily navigate between different aspects of the tournament.

## Context

This story refactors the existing Tournament Dashboard (Story 8.3) to fit the new responsive navigation architecture. The sub-tabs structure remains similar, but the layout and navigation patterns are updated.

**Sub-tabs:**
1. **Classement** - Rankings (always visible)
2. **Matchs** - Match history (always visible)
3. **Stats** - Tournament statistics (premium only, visible if tournament creator is premium)
4. **Paramètres** - Settings (admin only)

**Key Changes from 8.3:**
- Integrate with Contextual Action Bar (Story 9.5)
- Premium-gated Stats tab
- Responsive sub-tab navigation
- Desktop: Header tabs, Mobile: Horizontal scrollable tabs

**Dependencies:**
- Story 8.3 (base implementation)
- Story 9.5 (Contextual Action Bar)

## Acceptance Criteria

### AC1: Sub-tab Navigation Structure
1. **Given** user on `/tournament/:id`
   **When** page loads
   **Then** display horizontal sub-tabs:
   - "Classement" (default active)
   - "Matchs"
   - "Stats" (if tournament is premium)
   - "Paramètres" (if user is admin)
   **And** apply responsive layout:
   - Mobile: Horizontal scroll if needed
   - Desktop: Inline tabs in header

### AC2: Stats Tab (Premium Gate)
2. **Given** user viewing tournament detail
   **When** tournament creator is premium
   **Then** show "Stats" tab
   **When** user clicks "Stats" tab
   **Then** display tournament statistics
   **When** tournament creator is NOT premium
   **Then** HIDE "Stats" tab
   **Or** show tab with 🔒 lock icon (disabled state)

### AC3: Permissions-Based Tabs
3. **Given** user is tournament admin
   **Then** show all tabs: Classement, Matchs, Stats (if premium), Paramètres
   **Given** user is standard player
   **Then** show limited tabs: Classement, Matchs, Stats (if premium)
   **And** HIDE "Paramètres" tab

### AC4: Contextual Action Bar Integration
4. **Given** user on tournament detail page
   **Then** display Contextual Action Bar at bottom (mobile) or header (desktop)
   **With** actions:
   - "⚡ NOUVEAU MATCH" (if tournament not finished)
   - "👤+ INVITER" (if admin OR player with canInvite permission)
   **And** actions persist across all sub-tabs

### AC5: Responsive Sub-tab Design
5. **Given** sub-tabs render
   **When** viewport < 768px (mobile)
   **Then** tabs horizontal scroll, equal width
   **And** active tab highlighted with bottom border (orange)
   **When** viewport >= 1024px (desktop)
   **Then** tabs inline in page header, auto-width
   **And** active tab highlighted

### AC6: URL State Management
6. **Given** user switches sub-tabs
   **Then** update URL with query param (e.g., `/tournament/:id?tab=matchs`)
   **And** preserve tab state on refresh
   **And** deep link support

### AC7: Back Button Navigation
7. **Given** user on tournament detail page
   **Then** display back button in top-left corner
   **When** user clicks back button
   **Then** navigate to previous page (e.g., `/tournaments` or `/`)

## Tasks / Subtasks

### Task 1: Refactor TournamentDashboard layout (4h)
- [ ] Update `src/pages/TournamentDashboard.tsx`
- [ ] Integrate new sub-tab navigation component
- [ ] Apply responsive layout
- [ ] Add back button to header
- [ ] Remove old tab structure

### Task 2: Create SubTabNavigation component (3h)
- [ ] Create `src/components/navigation/SubTabNavigation.tsx`
- [ ] Accept tabs array with visibility logic
- [ ] Implement horizontal scroll on mobile
- [ ] Inline layout on desktop
- [ ] Handle active state highlighting

### Task 3: Integrate ContextualBar (2h)
- [ ] Import ContextualBar from Story 9.5
- [ ] Replace old bottom action bar
- [ ] Configure Match + Invite actions
- [ ] Apply permission logic
- [ ] Test on mobile and desktop

### Task 4: Premium-gated Stats tab (3h)
- [ ] Check if tournament.creatorIsPremium
- [ ] Conditionally show "Stats" tab
- [ ] Create placeholder Stats content (full implementation in Story 11.3)
- [ ] Show lock icon if not premium (optional)

### Task 5: Permissions logic for tabs (2h)
- [ ] Use `useDetailPagePermissions()` hook
- [ ] Check if user is admin
- [ ] Show/hide "Paramètres" tab accordingly
- [ ] Test with admin and non-admin users

### Task 6: URL query param support (2h)
- [ ] Read `?tab=` param on mount
- [ ] Set active sub-tab based on param
- [ ] Update URL on tab change
- [ ] Default to "classement" if no param

### Task 7: Back button implementation (1h)
- [ ] Add back button to page header (top-left)
- [ ] Use `useNavigate(-1)` or custom logic
- [ ] Style: `<ArrowLeft />` icon, 44x44px touch target
- [ ] Mobile and desktop styling

### Task 8: Responsive testing (2h)
- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Ensure tabs scroll/fit properly

### Task 9: Unit tests (3h)
- [ ] Test sub-tab navigation
- [ ] Test premium-gated Stats tab
- [ ] Test permissions (admin vs player)
- [ ] Test URL query param handling
- [ ] Mock premium status and permissions

### Task 10: Integration tests (2h)
- [ ] Test full navigation flow
- [ ] Test Contextual Bar actions
- [ ] Test back button navigation

**Total Estimate:** 24 hours (3 jours)

## Dev Notes

### SubTabNavigation Component
```typescript
// src/components/navigation/SubTabNavigation.tsx
interface SubTab {
  id: string;
  label: string;
  visible: boolean;
  icon?: React.ReactNode;
}

interface SubTabNavigationProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SubTabNavigation = ({ tabs, activeTab, onTabChange }: SubTabNavigationProps) => {
  const visibleTabs = tabs.filter(t => t.visible);
  
  return (
    <div className="border-b border-slate-800 overflow-x-auto scrollbar-hide">
      <div className="flex lg:justify-center gap-2 px-6 min-w-max">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Updated TournamentDashboard Structure
```typescript
// src/pages/TournamentDashboard.tsx
export const TournamentDashboard = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialTab = searchParams.get('tab') || 'classement';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { tournament, isLoading } = useTournament(id);
  const { isAdmin, canInvite } = useDetailPagePermissions(id, 'tournament');
  
  const tabs = [
    { id: 'classement', label: 'Classement', visible: true },
    { id: 'matchs', label: 'Matchs', visible: true },
    { 
      id: 'stats', 
      label: 'Stats', 
      visible: tournament?.creatorIsPremium || false,
      icon: tournament?.creatorIsPremium ? null : <Lock size={14} />
    },
    { id: 'settings', label: 'Paramètres', visible: isAdmin },
  ];
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  const contextualActions = [
    {
      id: 'match',
      label: 'NOUVEAU MATCH',
      icon: <Zap size={20} />,
      onClick: () => setShowRecordMatch(true),
      visible: !tournament?.is_finished,
    },
    {
      id: 'invite',
      label: 'INVITER',
      icon: <UserPlus size={20} />,
      onClick: () => setShowInviteModal(true),
      visible: isAdmin || canInvite,
    },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900 pb-20 lg:pb-8">
      {/* Header with Back Button */}
      <header className="p-4 border-b border-slate-800 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{tournament?.name}</h1>
        </div>
        {/* Desktop Actions */}
        <div className="hidden lg:flex">
          <ContextualBar actions={contextualActions} />
        </div>
      </header>
      
      {/* Sub-tabs */}
      <SubTabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'classement' && <ClassementTab />}
        {activeTab === 'matchs' && <MatchsTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <ParametresTab />}
      </div>
      
      {/* Mobile Contextual Bar */}
      <div className="lg:hidden">
        <ContextualBar actions={contextualActions} />
      </div>
    </div>
  );
};
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#page-detail-tournoi`  
**Epic:** Epic 11 - Detail Pages & Sub-tabs  
**Depends on:** Story 8.3, Story 9.5  
**Related:** Story 11.2 (League Detail)

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
