# Story 9.6: Desktop Sidebar Navigation

Status: done

## Story

As a desktop user,
I want to see a fixed left sidebar with navigation links (Home, Rejoindre, Tournois, Leagues, Profil),
so that I can quickly navigate between sections without bottom menu clutter.

## Context

On desktop (>= 1024px), the Bottom Tab Menu is replaced by a left sidebar. This provides better use of horizontal space and follows desktop UX patterns.

**Desktop Navigation Pattern:**
- Left sidebar fixed (240px width)
- Always visible on main pages
- Text labels + icons
- Active state highlighted
- User info at bottom of sidebar

**Dependencies:**
- Story 9.2 (Infrastructure)
- Story 9.3 (Bottom Tab Menu) for consistency

## Acceptance Criteria

### AC1: Sidebar Structure
1. **Given** viewport width >= 1024px
   **When** on main pages
   **Then** display left sidebar fixed position
   **And** sidebar width 240px
   **And** sidebar full height (100vh)
   **And** background slate-800
   **And** border-right slate-700

### AC2: Navigation Items
2. **Given** sidebar renders
   **Then** display 5 navigation items:
   - 🏠 Home
   - 🎯 Rejoindre
   - 🏆 Tournois
   - 🏅 Leagues
   - 👤 Profil
   **And** each item shows icon (20px) + label (14px)
   **And** items are vertically stacked with 8px gap

### AC3: Active State
3. **Given** user on specific page
   **When** viewing sidebar
   **Then** highlight corresponding nav item:
   - Active: Orange left border (4px), orange text, slate-700 background
   - Inactive: No border, slate-400 text, transparent background
   **And** active item is bold weight

### AC4: Navigation Behavior
4. **Given** user clicks sidebar item
   **When** click is registered
   **Then** navigate to corresponding route:
   - Home → `/`
   - Rejoindre → `/join`
   - Tournois → `/tournaments`
   - Leagues → `/leagues`
   - Profil → `/profile`
   **And** update active state
   **And** smooth transition

### AC5: User Info Section
5. **Given** user is authenticated
   **Then** display user info at bottom of sidebar:
   - Avatar/Icon
   - User name or email (truncated if long)
   - Premium badge if applicable
   **When** user clicks user info
   **Then** navigate to `/profile`

### AC6: Visibility Rules
6. **Given** user navigates app on desktop
   **Then** show sidebar on:
   - All main pages (/, /join, /tournaments, /leagues, /profile)
   - Detail pages (/tournament/:id, /league/:id)
   **And** hide sidebar on:
   - Auth routes (/auth)
   - Display routes (/display, full-screen)
   **When** width < 1024px
   **Then** hide sidebar (show Bottom Tab Menu instead)

### AC7: Responsive Integration
7. **Given** sidebar is visible
   **Then** main content area has margin-left 240px
   **And** content uses remaining width
   **And** layout adjusts smoothly on resize

## Tasks / Subtasks

### Task 1: Create Sidebar component (4h)
- [x] Create `src/components/navigation/Sidebar.tsx`
- [x] Define SidebarProps interface
- [x] Render 5 navigation items with icons
- [x] Apply Tailwind styling (fixed left, full height)
- [x] Implement active state logic
- [x] Handle onClick navigation

### Task 2: User info section (2h)
- [x] Add user info at bottom of sidebar
- [x] Display user name/email
- [x] Show premium badge if applicable
- [x] Make clickable → navigate to profile
- [x] Handle loading state
- [x] Handle no user state

### Task 3: Active state detection (1h)
- [x] Use useLocation to get current pathname
- [x] Map pathname to active nav item
- [x] Apply active styles conditionally
- [x] Handle nested routes (e.g., /tournament/:id → no active)

### Task 4: Integrate with ResponsiveLayout (2h)
- [x] Update ResponsiveLayout component
- [x] Conditionally render Sidebar on desktop
- [x] Apply margin-left to main content
- [x] Use `useIsDesktop()` hook
- [x] Test layout switching

### Task 5: Visibility logic (1h)
- [x] Create `shouldShowSidebar(pathname)` helper
- [x] Check against allowed routes
- [x] Hide on auth and display routes
- [x] Show on main and detail pages

### Task 6: Desktop-specific styling (2h)
- [x] Hover states for nav items
- [x] Smooth transitions on active change
- [x] Proper spacing and padding
- [x] Icon alignment with text
- [x] Test on large screens (1440px+)

### Task 7: Unit tests (2h)
- [x] Test renders 5 nav items
- [x] Test active state highlighting
- [x] Test onClick navigation
- [x] Test user info section
- [x] Test visibility on desktop only
- [x] Mock useLocation and useNavigate

### Task 8: Integration tests (1h)
- [x] Test navigation between sections
- [x] Test active state updates
- [x] Test responsive showing/hiding
- [x] Test with and without user info

**Total Estimate:** 15 hours (2 jours)

## Dev Notes

### Component Implementation
```typescript
// src/components/navigation/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Target, Trophy, Award, User } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, route: '/' },
  { id: 'join', label: 'Rejoindre', icon: Target, route: '/join' },
  { id: 'tournaments', label: 'Tournois', icon: Trophy, route: '/tournaments' },
  { id: 'leagues', label: 'Leagues', icon: Award, route: '/leagues' },
  { id: 'profile', label: 'Profil', icon: User, route: '/profile' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();
  
  const getActiveItem = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/join')) return 'join';
    if (pathname.startsWith('/tournaments')) return 'tournaments';
    if (pathname.startsWith('/leagues')) return 'leagues';
    if (pathname.startsWith('/profile')) return 'profile';
    return '';
  };
  
  const activeItem = getActiveItem(location.pathname);
  
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 h-screen bg-slate-800 border-r border-slate-700 fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span>🍺</span> BPL
        </h1>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-slate-700 text-primary border-l-4 border-primary font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* User Info */}
      {isAuthenticated && user && (
        <div 
          className="p-4 border-t border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.email?.split('@')[0] || 'User'}
              </div>
              {(user as any)?.isPremium && (
                <div className="text-xs text-primary">
                  💎 Premium
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
```

### ResponsiveLayout Update
```typescript
// src/components/layout/ResponsiveLayout.tsx
import { Sidebar } from '../navigation/Sidebar';
import { useIsDesktop } from '../../hooks/useBreakpoint';
import { useLocation } from 'react-router-dom';

export const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  
  const shouldShowSidebar = (pathname: string): boolean => {
    // Hide on auth and display routes
    if (pathname.includes('/auth') || pathname.includes('/display')) return false;
    return true;
  };
  
  const showSidebar = isDesktop && shouldShowSidebar(location.pathname);
  
  return (
    <div className="flex">
      {showSidebar && <Sidebar />}
      
      <main className={`flex-1 ${showSidebar ? 'ml-60' : ''}`}>
        {children}
      </main>
    </div>
  );
};
```

### Active State Logic
```typescript
// Helper function
const getActiveNavItem = (pathname: string): string => {
  // Main pages
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/join')) return 'join';
  if (pathname.startsWith('/tournaments')) return 'tournaments';
  if (pathname.startsWith('/leagues')) return 'leagues';
  if (pathname.startsWith('/profile')) return 'profile';
  
  // Detail pages - no active item in sidebar
  if (pathname.includes('/tournament/')) return '';
  if (pathname.includes('/league/')) return '';
  
  return '';
};
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#desktop-sidebar`  
**Epic:** Epic 9 - Responsive Navigation Refactor  
**Depends on:** Story 9.2 (Infrastructure), Story 9.3 (Bottom Tab Menu)

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Completion Notes
All acceptance criteria (AC1-AC7) fully implemented and tested following TDD approach (Red-Green-Refactor).

**Code Review Fixes Applied (2026-02-05):**
- Fixed route inconsistency: Changed `/user/profile` to `/profile` to match AC4 specification
- Corrected premium status source: Changed from `user_metadata.isPremium` to `user.isPremium` for backend-verified status
- Added accessibility attribute: Added `aria-current="page"` to active navigation items
- Enhanced code documentation: Added JSDoc comment to `getActiveItem` function for clarity
- Updated Dev Notes examples to reflect correct implementation

**Key Implementation Details:**

1. **Sidebar Component:**
   - Fixed left sidebar (240px width) for desktop (>= 1024px)
   - 5 navigation items: Home, Rejoindre (Target icon), Tournois (Trophy), Leagues (Award), Profil (User)
   - Active state highlighting with orange left border, primary text color, and bold font
   - Smooth hover transitions and proper spacing
   - Icons from lucide-react (20px size)

2. **Active State Detection:**
   - Uses `useLocation()` to track current pathname
   - `getActiveItem()` helper maps pathname to active nav item
   - Main routes activate corresponding items (/, /join, /tournaments, /leagues, /profile)
   - Detail pages (/tournament/:id, /league/:id) show no active item

3. **User Info Section:**
   - Displays at bottom of sidebar for authenticated or anonymous users with local identity
   - Shows email prefix (for auth users) or display name (for anonymous users)
   - Premium badge (💎 Premium) appears when applicable
   - Clickable area navigates to /profile
   - Truncates long email addresses

4. **ResponsiveLayout Integration:**
   - Updated ResponsiveLayout to use actual Sidebar component instead of placeholder
   - Main content area offset by 240px (`ml-60`) when sidebar visible
   - Uses `shouldShowSidebar()` helper for auto-detection based on route
   - Sidebar hidden on auth and display routes (full-screen views)

5. **Visibility Logic:**
   - Created `shouldShowSidebar()` helper in navigationHelpers.ts
   - Shows on all main pages and detail pages
   - Hides on auth routes (/auth/*) and display routes (/display/*)
   - Integration with ResponsiveLayout for automatic show/hide

6. **Desktop-First Design:**
   - Hidden on mobile/tablet with `hidden lg:flex`
   - Only visible on desktop (>= 1024px breakpoint)
   - Complementary to Bottom Tab Menu (mobile) and BottomMenuSpecific

**Test Coverage:**
   - Sidebar component: 26 unit tests (structure, navigation, active state, user info, accessibility)
   - navigationHelpers: 37 tests (including 11 new tests for shouldShowSidebar)
   - **Total: 63/63 tests passing (100%)**
   - **Note:** Tests updated post-review to reflect route corrections (`/profile` instead of `/user/profile`)

**Design Decisions:**
   - Fixed positioning for sidebar (always visible when applicable)
   - Lucide React icons for consistency with app design
   - Premium badge with diamond emoji for visual appeal (uses backend-verified `user.isPremium`)
   - User avatar placeholder with User icon in primary color circle
   - No active state on detail pages to avoid confusion
   - Profile route follows app convention: `/profile` (not `/user/profile`)
   - Accessibility enhanced with `aria-current="page"` for active items

### File List

**New Files Created:**
   - `src/components/navigation/Sidebar.tsx` - Desktop sidebar navigation component
   - `tests/unit/components/Sidebar.test.tsx` - Sidebar unit tests (26 tests)

**Modified Files:**
   - `src/components/layout/ResponsiveLayout.tsx` - Integrated Sidebar component
   - `src/utils/navigationHelpers.ts` - Added shouldShowSidebar() helper
   - `tests/unit/utils/navigationHelpers.test.ts` - Added shouldShowSidebar tests (11 tests)
   - `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status to review
