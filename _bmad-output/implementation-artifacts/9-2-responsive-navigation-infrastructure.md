# Story 9.2: Responsive Navigation Infrastructure Setup

Status: review

## Story

As a developer,
I want to set up the responsive navigation infrastructure (layout wrapper, breakpoints, base components),
so that I can implement mobile-first navigation with desktop enhancements consistently across the app.

## Context

Before implementing specific navigation components (Bottom Tab Menu, Sidebar, etc.), we need to establish the foundational infrastructure for responsive navigation.

**This is a SETUP story** - it creates the scaffolding for all subsequent navigation stories.

## Acceptance Criteria

### AC1: Responsive Layout Wrapper Component
1. **Given** the app needs responsive layout
   **When** any page loads
   **Then** render content within `ResponsiveLayout` wrapper
   **And** apply correct layout based on viewport width:
   - Mobile (< 768px): Full width, padding 16px
   - Tablet (768px - 1024px): Max-width 768px, centered
   - Desktop (> 1024px): Sidebar left (240px) + main content

### AC2: Breakpoint Configuration
2. **Given** app uses Tailwind CSS
   **Then** ensure breakpoints are configured:
   ```javascript
   theme: {
     screens: {
       'sm': '640px',
       'md': '768px',
       'lg': '1024px',
       'xl': '1440px',
     }
   }
   ```
   **And** create utility hooks:
   - `useBreakpoint()` → returns current breakpoint
   - `useIsMobile()` → returns boolean
   - `useIsDesktop()` → returns boolean

### AC3: Base Navigation Components Scaffolding
3. **When** setting up infrastructure
   **Then** create component files (empty shells):
   - `src/components/navigation/BottomTabMenu.tsx`
   - `src/components/navigation/BottomMenuSpecific.tsx`
   - `src/components/navigation/ContextualBar.tsx`
   - `src/components/navigation/Sidebar.tsx`
   - `src/components/layout/ResponsiveLayout.tsx`
   **And** define TypeScript interfaces for props

### AC4: Layout Wrapper Integration
4. **Given** ResponsiveLayout exists
   **When** app renders
   **Then** wrap all routes in ResponsiveLayout
   **And** detect viewport width
   **And** pass `isMobile` and `isDesktop` via context or props
   **And** apply appropriate layout structure

### AC5: Navigation Context Setup
5. **When** infrastructure is ready
   **Then** create `NavigationContext` with:
   ```typescript
   interface NavigationContextType {
     activeTab: string;
     setActiveTab: (tab: string) => void;
     isMobile: boolean;
     isDesktop: boolean;
     showBackButton: boolean;
     onBack: () => void;
   }
   ```
   **And** provide context at App level

## Tasks / Subtasks

### Task 1: Create useBreakpoint hooks (1h)
- [x] Create `src/hooks/useBreakpoint.ts`
- [x] Implement `useBreakpoint()` with window.matchMedia
- [x] Implement `useIsMobile()` (< 768px)
- [x] Implement `useIsDesktop()` (>= 1024px)
- [x] Add resize event listeners with cleanup
- [x] Add SSR safety checks

### Task 2: Create ResponsiveLayout component (2h)
- [x] Create `src/components/layout/ResponsiveLayout.tsx`
- [x] Accept children prop
- [x] Detect breakpoint with useBreakpoint
- [x] Apply responsive wrapper classes
- [x] Mobile: `<div className="w-full max-w-md mx-auto px-4">`
- [x] Desktop: `<div className="flex">` with sidebar + main areas
- [x] Handle display view routes (no layout wrapper)

### Task 3: Create NavigationContext (1h)
- [x] Create `src/context/NavigationContext.tsx`
- [x] Define NavigationContextType interface
- [x] Implement NavigationProvider
- [x] Track active tab state
- [x] Track back button visibility
- [x] Provide navigation helpers

### Task 4: Create component scaffolds (1h)
- [x] Create `src/components/navigation/BottomTabMenu.tsx` (empty shell)
- [x] Create `src/components/navigation/BottomMenuSpecific.tsx` (empty shell)
- [x] Create `src/components/navigation/ContextualBar.tsx` (empty shell)
- [x] Create `src/components/navigation/Sidebar.tsx` (empty shell)
- [x] Define props interfaces for each

### Task 5: Integrate ResponsiveLayout in App.tsx (2h)
- [x] Import ResponsiveLayout
- [x] Wrap main content area
- [x] Pass breakpoint info to children
- [x] Ensure display routes bypass layout
- [x] Test layout renders correctly
- [x] Verify no visual regressions

### Task 6: Update Tailwind config if needed (30min)
- [x] Verify breakpoints in `tailwind.config.js`
- [x] Add custom utilities if needed
- [x] Ensure all responsive classes available

### Task 7: Unit tests (2h)
- [x] Test useBreakpoint hook (all breakpoints)
- [x] Test useIsMobile/useIsDesktop hooks
- [x] Test ResponsiveLayout renders correctly
- [x] Test NavigationContext state management
- [x] Mock window.matchMedia

### Task 8: Integration tests (1h)
- [x] Test layout switches mobile → desktop
- [x] Test navigation context provides correct values
- [x] Test responsive classes applied correctly

**Total Estimate:** 10.5 hours (1.5 jours)

## Dev Notes

### useBreakpoint Implementation
```typescript
// src/hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'desktop-large';

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else if (width < 1440) setBreakpoint('desktop');
      else setBreakpoint('desktop-large');
    };
    
    handleResize(); // Initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return breakpoint;
};

export const useIsMobile = () => useBreakpoint() === 'mobile';
export const useIsDesktop = () => {
  const bp = useBreakpoint();
  return bp === 'desktop' || bp === 'desktop-large';
};
```

### ResponsiveLayout Structure
```typescript
// src/components/layout/ResponsiveLayout.tsx
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const ResponsiveLayout = ({ children, showSidebar = true }: ResponsiveLayoutProps) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'desktop-large';
  
  if (isDesktop && showSidebar) {
    return (
      <div className="flex h-screen">
        {/* Sidebar will be rendered by parent or passed as prop */}
        <div className="w-60 bg-slate-800 border-r border-slate-700">
          {/* Sidebar component */}
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }
  
  // Mobile layout
  return (
    <div className="w-full max-w-md mx-auto px-4">
      {children}
    </div>
  );
};
```

### Component Scaffold Interfaces
```typescript
// BottomTabMenu
interface BottomTabMenuProps {
  activeTab: 'home' | 'join' | 'tournaments' | 'leagues' | 'profile';
  onTabChange: (tab: string) => void;
}

// BottomMenuSpecific
interface BottomMenuSpecificProps {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    premium?: boolean;
  }>;
}

// ContextualBar
interface ContextualBarProps {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    visible?: boolean;
  }>;
}

// Sidebar
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
}
```

## References

**UX Design Doc:** `_bmad-output/planning-artifacts/ux-ui-design-responsive-architecture.md#responsive-strategy`  
**Epic:** Epic 9 - Responsive Navigation Refactor

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Completion Notes

Successfully implemented the responsive navigation infrastructure setup following TDD (Red-Green-Refactor) approach:

**Infrastructure Created:**
1. ✅ **useBreakpoint Hooks** - Custom React hooks for detecting viewport breakpoints (mobile, tablet, desktop, desktop-large) with SSR safety and resize listeners
2. ✅ **ResponsiveLayout Component** - Smart layout wrapper that adapts to viewport width (mobile: centered with padding, desktop: flex with optional sidebar)
3. ✅ **NavigationContext** - Global navigation state management for active tab tracking and breakpoint awareness
4. ✅ **Component Scaffolds** - Empty shells for future navigation components (BottomTabMenu, BottomMenuSpecific, ContextualBar, Sidebar) with TypeScript interfaces

**Integration:**
- NavigationProvider integrated into App.tsx context hierarchy (inside Router due to useNavigate dependency)
- ResponsiveLayout wrapped around main content area with display routes properly bypassed
- Tailwind config updated with explicit breakpoints matching UX design spec

**Testing:**
- 36 tests created and passing (15 for useBreakpoint, 10 for ResponsiveLayout, 11 for NavigationContext)
- All tests follow TDD approach: Red (failing) → Green (passing) → Refactor
- Mock setup for React Router (useNavigate) and breakpoint hooks

**Technical Decisions:**
1. Used `typeof window === 'undefined'` checks for SSR safety instead of try-catch
2. Breakpoints match Tailwind defaults: mobile < 768px, tablet 768-1023px, desktop >= 1024px
3. NavigationProvider uses useNavigate() so must be inside Router context
4. Component scaffolds use underscore prefix (_) for unused props to satisfy TypeScript
5. Display routes bypass layout wrapper to maintain full-screen mode

**Ready for Next Steps:**
This infrastructure enables implementation of specific navigation components in upcoming stories:
- Story 9.3: Bottom Tab Menu implementation
- Story 9.4: Contextual Bar implementation
- Story 9.6: Desktop Sidebar implementation

### File List

**New Files Created:**
- `src/hooks/useBreakpoint.ts` - Breakpoint detection hooks
- `src/components/layout/ResponsiveLayout.tsx` - Responsive layout wrapper
- `src/context/NavigationContext.tsx` - Navigation state management
- `src/components/navigation/BottomTabMenu.tsx` - Bottom tab menu scaffold
- `src/components/navigation/BottomMenuSpecific.tsx` - Bottom menu specific scaffold
- `src/components/navigation/ContextualBar.tsx` - Contextual bar scaffold
- `src/components/navigation/Sidebar.tsx` - Sidebar scaffold
- `tests/unit/hooks/useBreakpoint.test.ts` - useBreakpoint tests (15 tests)
- `tests/unit/components/ResponsiveLayout.test.tsx` - ResponsiveLayout tests (10 tests)
- `tests/unit/context/NavigationContext.test.tsx` - NavigationContext tests (11 tests)

**Files Modified:**
- `src/App.tsx` - Added NavigationProvider and ResponsiveLayout integration
- `tailwind.config.js` - Added explicit breakpoint configuration
