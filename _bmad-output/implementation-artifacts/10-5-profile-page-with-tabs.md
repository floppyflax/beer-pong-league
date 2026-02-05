# Story 10.5: Profile Page with 3 Tabs (Infos, Mes Stats, Paramètres)

Status: ready-for-dev

## Story

As an authenticated user,
I want to access my profile page with 3 tabs (Infos, Mes Stats, Paramètres),
so that I can view my personal information, statistics, and manage my settings.

## Context

The Profile page (`/profile`) provides a comprehensive view of the user's account. It includes personal information, statistics (premium feature), and settings like logout and premium upgrade.

**3 Sub-tabs:**
1. **Infos** - User email, join date, premium status
2. **Mes Stats** - Personal statistics (premium only)
3. **Paramètres** - Logout, premium upgrade, account management

**Dependencies:**
- Story 9.2 (Infrastructure)
- Story 9.3 (Bottom Tab Menu)

## Acceptance Criteria

### AC1: Page Layout & Tab Navigation
1. **Given** authenticated user visits `/profile`
   **When** page loads
   **Then** display profile page with:
   - Header with user avatar/icon and name
   - 3 horizontal tabs: "Infos" | "Mes Stats" | "Paramètres"
   - Default active tab: "Infos"
   - Tab content area below
   **And** apply responsive layout

### AC2: Tab 1 - Infos
2. **Given** user on "Infos" tab
   **Then** display user information card:
   - Email address
   - Account creation date (e.g., "Membre depuis mars 2024")
   - Premium status badge (Premium / Gratuit)
   - Total tournaments joined
   - Total leagues joined
   **When** user is NOT premium
   **Then** show "PASSER PREMIUM" button prominently

### AC3: Tab 2 - Mes Stats (Premium Gate)
3. **Given** user on "Mes Stats" tab
   **When** user is premium
   **Then** display personal statistics:
   - Total matches played
   - Win rate (%)
   - ELO evolution chart (last 30 days)
   - Achievements/badges (if any)
   - Link: "Voir stats détaillées" → full stats view
   **When** user is NOT premium
   **Then** display premium paywall:
   - 🔒 Lock icon
   - Title: "Statistiques Premium"
   - Message: "Accédez à vos stats détaillées, graphiques ELO, et bien plus"
   - "PASSER PREMIUM" button
   - Teaser preview (blurred stats)

### AC4: Tab 3 - Paramètres
4. **Given** user on "Paramètres" tab
   **Then** display settings options:
   - **Compte Premium** section:
     - If premium: "Statut: Premium 💎" + manage subscription button
     - If not premium: "PASSER PREMIUM" button
   - **Compte** section:
     - Email (read-only for now)
     - "Se déconnecter" button (red, danger style)
   - **À propos** section:
     - App version
     - "Conditions d'utilisation" link
     - "Politique de confidentialité" link

### AC5: Tab Switching
5. **Given** user on profile page
   **When** user clicks a tab
   **Then** switch to corresponding tab content
   **And** highlight active tab (orange)
   **And** update URL with query param (e.g., `/profile?tab=stats`)
   **And** preserve tab state on refresh

### AC6: Premium Upgrade Flow
6. **Given** user clicks "PASSER PREMIUM" button
   **Then** open premium upgrade modal (or navigate to payment page)
   **And** display pricing plans
   **And** payment options

### AC7: Logout
7. **Given** user on "Paramètres" tab
   **When** user clicks "Se déconnecter"
   **Then** show confirmation modal: "Êtes-vous sûr de vouloir vous déconnecter ?"
   **When** user confirms
   **Then** log out user
   **And** navigate to landing page (`/`)

### AC8: Responsive Design
8. **Given** profile page renders
   **When** viewport < 768px (mobile)
   **Then** tabs full width, stacked content
   **When** viewport >= 1024px (desktop)
   **Then** tabs centered, max-width 800px

## Tasks / Subtasks

### Task 1: Create Profile page with tabs (4h)
- [ ] Create `src/pages/Profile.tsx` (or update existing)
- [ ] Implement 3-tab navigation (Infos, Mes Stats, Paramètres)
- [ ] Handle tab switching with state
- [ ] URL query param support (`?tab=stats`)
- [ ] Apply responsive layout

### Task 2: Tab 1 - Infos component (2h)
- [ ] Create `src/components/profile/InfosTab.tsx`
- [ ] Display user email, join date, premium status
- [ ] Show tournament/league count
- [ ] Add "Passer Premium" button if not premium
- [ ] Handle button click → premium modal

### Task 3: Tab 2 - Mes Stats component (4h)
- [ ] Create `src/components/profile/MesStatsTab.tsx`
- [ ] Check user premium status
- [ ] If premium: display stats summary (matches, win rate, ELO)
- [ ] If not premium: display paywall with teaser
- [ ] Add link to full stats view
- [ ] Create blurred preview for non-premium users

### Task 4: Tab 3 - Paramètres component (3h)
- [ ] Create `src/components/profile/ParametresTab.tsx`
- [ ] Display premium status section
- [ ] Add "Se déconnecter" button
- [ ] Handle logout confirmation modal
- [ ] Add "À propos" section with links
- [ ] Show app version

### Task 5: Premium upgrade modal (3h)
- [ ] Create `src/components/premium/PremiumUpgradeModal.tsx`
- [ ] Display pricing plans
- [ ] Show feature comparison (free vs premium)
- [ ] Add payment options
- [ ] Handle payment flow (placeholder for now)

### Task 6: Logout logic (2h)
- [ ] Create confirmation modal
- [ ] Implement logout function (clear auth state)
- [ ] Clear local storage / session
- [ ] Navigate to landing page
- [ ] Test logout flow

### Task 7: Data fetching (2h)
- [ ] Create `useProfileData()` hook
- [ ] Fetch user info (email, join date, premium status)
- [ ] Fetch aggregate stats (tournaments, leagues count)
- [ ] Fetch personal stats if premium
- [ ] Cache with React Query

### Task 8: URL query param handling (1h)
- [ ] Read `?tab=` param from URL
- [ ] Set active tab on mount
- [ ] Update URL on tab change
- [ ] Default to "Infos" if no param

### Task 9: Unit tests (3h)
- [ ] Test tab navigation
- [ ] Test premium paywall on stats tab
- [ ] Test logout flow
- [ ] Test URL query param handling
- [ ] Mock auth context and data hooks

### Task 10: Integration tests (2h)
- [ ] Test full profile navigation
- [ ] Test premium upgrade flow
- [ ] Test logout confirmation

**Total Estimate:** 26 hours (3-4 jours)

## Dev Notes

### Profile Component Structure
```typescript
// src/pages/Profile.tsx
export const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'infos';
  const [activeTab, setActiveTab] = useState<'infos' | 'stats' | 'settings'>(initialTab as any);
  
  const { user } = useAuthContext();
  const { data, isLoading } = useProfileData();
  
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  return (
    <div className="min-h-screen bg-slate-900 pb-20 lg:pb-8">
      {/* Header */}
      <header className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user?.email?.split('@')[0] || 'Profil'}
            </h1>
            <p className="text-slate-400 text-sm">
              {user?.isPremium ? '💎 Membre Premium' : 'Compte Gratuit'}
            </p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-6">
        <TabButton 
          active={activeTab === 'infos'} 
          onClick={() => handleTabChange('infos')}
        >
          Infos
        </TabButton>
        <TabButton 
          active={activeTab === 'stats'} 
          onClick={() => handleTabChange('stats')}
        >
          Mes Stats
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => handleTabChange('settings')}
        >
          Paramètres
        </TabButton>
      </div>
      
      {/* Content */}
      <div className="p-6 max-w-3xl mx-auto">
        {activeTab === 'infos' && <InfosTab data={data} isLoading={isLoading} />}
        {activeTab === 'stats' && <MesStatsTab isPremium={user?.isPremium} />}
        {activeTab === 'settings' && <ParametresTab />}
      </div>
    </div>
  );
};
```

### Mes Stats Tab (Premium Paywall)
```typescript
// src/components/profile/MesStatsTab.tsx
export const MesStatsTab = ({ isPremium }: { isPremium?: boolean }) => {
  const { data: stats } = usePersonalStats({ enabled: isPremium });
  
  if (!isPremium) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
        <div className="mb-6">
          <Lock size={48} className="text-slate-600 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Statistiques Premium
        </h2>
        <p className="text-slate-400 mb-6">
          Accédez à vos stats détaillées, graphiques d'évolution ELO, 
          historique de performances, et bien plus encore.
        </p>
        
        {/* Blurred Teaser */}
        <div className="relative mb-6 blur-sm pointer-events-none">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-primary">42</div>
              <div className="text-xs text-slate-400">Matchs</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-primary">68%</div>
              <div className="text-xs text-slate-400">Victoires</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-primary">1250</div>
              <div className="text-xs text-slate-400">ELO</div>
            </div>
          </div>
        </div>
        
        <button className="px-8 py-4 bg-primary hover:bg-amber-600 text-white font-bold rounded-xl transition-all">
          PASSER PREMIUM
        </button>
      </div>
    );
  }
  
  // Premium user - show real stats
  return (
    <div className="space-y-6">
      <StatsCard title="Résumé" data={stats} />
      <ELOChart data={stats?.eloHistory} />
      <Link to="/stats/full" className="text-primary hover:underline">
        Voir toutes mes statistiques →
      </Link>
    </div>
  );
};
```

### Logout Confirmation
```typescript
// In ParametresTab
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
const { logout } = useAuthContext();

const handleLogout = async () => {
  await logout();
  navigate('/');
};

// Logout button
<button
  onClick={() => setShowLogoutConfirm(true)}
  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
>
  SE DÉCONNECTER
</button>

// Confirmation modal
{showLogoutConfirm && (
  <ConfirmModal
    title="Déconnexion"
    message="Êtes-vous sûr de vouloir vous déconnecter ?"
    onConfirm={handleLogout}
    onCancel={() => setShowLogoutConfirm(false)}
  />
)}
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#page-profil`  
**Epic:** Epic 10 - Connected User Experience  
**Depends on:** Story 9.2, Story 9.3

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
