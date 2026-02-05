# Contextual Header - UX Specifications

**Version:** 1.0  
**Date:** 2026-02-05  
**Status:** Specs Ready for Implementation  
**Author:** Sally (UX Designer)

---

## 📋 Executive Summary

### Problem Statement
Currently, the app has **redundant page titles**:
- A global navigation header (with logo + user info)
- A local page header with the same title (e.g., "Mes Tournois")

This creates:
- ❌ Visual clutter
- ❌ Wasted vertical space (~60px lost)
- ❌ Poor mobile UX (less content visible above the fold)

### Solution: Contextual Header
Replace the dual header system with a **single contextual header** that:
- ✅ Shows the current page title dynamically
- ✅ Removes redundant local headers from pages
- ✅ Saves vertical space
- ✅ Provides consistent navigation UX
- ✅ Keeps user profile access in the Bottom Tab Menu (not in header)

---

## 🎨 Visual Design

### Mobile Layout (< 1024px)

```
┌─────────────────────────────────────┐
│  [←]  Mes Tournois              [⋯] │  ← Contextual Header (64px height)
├─────────────────────────────────────┤
│  🔍 Rechercher un tournoi...        │  ← Page content starts immediately
│                                     │
│  [Tous] [Actifs] [Terminés]        │
│                                     │
│  🏆 yoyoyo            [En cours]    │
│  👥 1 joueur                        │
│  📅 5 févr. 2026                    │
│                                     │
│  🏆 Tournoi DevAdmin  [En cours]    │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│  [🏠] [🎯] [🏆] [🏅] [👤]          │  ← Bottom Tab Menu (64px height)
└─────────────────────────────────────┘
```

**Key Changes:**
1. Header now shows page title ("Mes Tournois")
2. **Removed**: Local header with "Mes Tournois" (was line 129 in Tournaments.tsx)
3. Search bar starts immediately below the header

### Desktop Layout (>= 1024px)

```
┌──────────┬──────────────────────────────────────────────────────────┐
│          │  [←]  Mes Tournois                     [+ CRÉER TOURNOI] │  ← Header (64px)
│  SIDEBAR ├──────────────────────────────────────────────────────────┤
│          │  🔍 Rechercher un tournoi...                             │
│ 🏠 Home  │                                                          │
│          │  [Tous] [Actifs] [Terminés]                             │
│ 🎯 Rejoin│                                                          │
│          │  ┌──────────────────┬──────────────────┐                │
│ 🏆 Tourn.│  │ 🏆 yoyoyo       │ 🏆 Tournoi...   │                │
│   ═══    │  │ [En cours]      │ [En cours]      │                │
│          │  └──────────────────┴──────────────────┘                │
│ 🏅 League│                                                          │
│          │                                                          │
│ 👤 Profil│                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. Header shows title + actions (Create button)
2. **Removed**: Local header with "Mes Tournois"
3. Sidebar remains on the left (unchanged)

---

## 🔧 Component Specification

### Component: `ContextualHeader.tsx`

**Purpose:** Display the current page title and optional actions in a consistent header across all pages.

**Location:** `src/components/navigation/ContextualHeader.tsx`

#### Props Interface

```typescript
interface ContextualHeaderProps {
  // Page title (dynamic based on route)
  title: string;
  
  // Optional back button (for detail pages)
  showBackButton?: boolean;
  onBack?: () => void;
  
  // Optional actions (buttons on the right)
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
    premium?: boolean; // Shows lock icon if true
  }>;
  
  // Optional menu button (3-dot menu)
  menuItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
}
```

#### Visual Specs

**Height:** 64px (fixed)  
**Background:** `bg-slate-900` (#0f172a)  
**Border Bottom:** `border-b border-slate-800` (1px)  
**Z-index:** 30 (below modals, above content)

**Elements:**
1. **Back Button (Optional)**
   - Size: 40x40px tap target
   - Icon: `ArrowLeft` (lucide-react) 24x24px
   - Color: `text-slate-400` → `hover:text-white`
   - Position: Left (16px margin)

2. **Title**
   - Font: Bold, 20px (mobile) / 24px (desktop)
   - Color: `text-white`
   - Position: Center (if no back button) or Left+48px (if back button)
   - Max-width: Truncate with ellipsis if too long

3. **Actions (Desktop only)**
   - Position: Right (16px margin)
   - Gap between buttons: 8px
   - Button height: 40px
   - Primary button: `bg-primary hover:bg-amber-600`
   - Secondary button: `bg-slate-700 hover:bg-slate-600`
   - Ghost button: `text-slate-400 hover:text-white`

4. **Menu Button (Optional)**
   - Size: 40x40px tap target
   - Icon: `MoreVertical` (lucide-react) 24x24px
   - Color: `text-slate-400` → `hover:text-white`
   - Position: Right (16px margin)
   - Opens dropdown menu on click

#### Code Example

```typescript
import React, { useState } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface ContextualHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
    premium?: boolean;
  }>;
  menuItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

export const ContextualHeader: React.FC<ContextualHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  actions = [],
  menuItems = [],
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
      {/* Left: Back Button + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            aria-label="Retour"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <h1 className="text-xl lg:text-2xl font-bold text-white truncate">
          {title}
        </h1>
      </div>

      {/* Right: Actions (Desktop) + Menu Button */}
      <div className="flex items-center gap-2">
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`
                flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all active:scale-95
                ${getButtonVariantClasses(action.variant)}
                ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {action.icon}
              {action.label}
              {action.premium && <span className="ml-1">🔒</span>}
            </button>
          ))}
        </div>

        {/* Menu Button (if menuItems provided) */}
        {menuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              aria-label="Menu"
            >
              <MoreVertical size={24} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-40">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors
                      ${item.destructive ? 'text-red-400' : 'text-white'}
                      ${index === 0 ? 'rounded-t-lg' : ''}
                      ${index === menuItems.length - 1 ? 'rounded-b-lg' : 'border-b border-slate-700'}
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// Helper function for button variant classes
const getButtonVariantClasses = (variant?: string) => {
  switch (variant) {
    case 'primary':
      return 'bg-primary hover:bg-amber-600 text-white';
    case 'secondary':
      return 'bg-slate-700 hover:bg-slate-600 text-white';
    case 'ghost':
      return 'text-slate-400 hover:text-white hover:bg-slate-800';
    default:
      return 'bg-primary hover:bg-amber-600 text-white';
  }
};
```

---

## 📄 Page-by-Page Specifications

### 1. Home Page (`/`)

**Title:** "Beer Pong League" (or just logo icon)  
**Back Button:** No  
**Actions:** None  
**Menu:** None

```tsx
<ContextualHeader 
  title="🍺 BPL"
/>
```

**Wireframe:**
```
┌─────────────────────────────────────┐
│  🍺 BPL                             │
├─────────────────────────────────────┤
│  👋 Salut floppyflax !              │
│                                     │
│  📍 REPRENDRE OÙ TU T'ES ARRÊTÉ    │
│  ...                                │
```

---

### 2. Tournaments Page (`/tournaments`)

**Title:** "Mes Tournois"  
**Back Button:** No (main page)  
**Actions (Desktop):** [+ CRÉER TOURNOI] (premium-aware)  
**Menu:** None

```tsx
<ContextualHeader 
  title="Mes Tournois"
  actions={[
    {
      label: 'CRÉER TOURNOI',
      icon: <Plus size={20} />,
      onClick: handleCreate,
      variant: 'primary',
      premium: isAtTournamentLimit,
    },
  ]}
/>
```

**Changes in Tournaments.tsx:**
1. **Remove** lines 128-141 (entire `<header>` block)
2. **Add** `<ContextualHeader>` at the top of the component
3. **Keep** the search bar and filter tabs as-is (they start immediately below the header)

**Before:**
```tsx
return (
  <div className="min-h-screen bg-slate-900 pb-20 lg:pb-8">
    {/* Header */}
    <header className="p-6 border-b border-slate-800 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white">Mes Tournois</h1>
      {/* Desktop Create Button */}
      <button ...>...</button>
    </header>

    {/* Search Bar */}
    <div className="p-6 pb-0">...</div>
    ...
  </div>
);
```

**After:**
```tsx
return (
  <div className="min-h-screen bg-slate-900 pb-20 lg:pb-8">
    {/* Contextual Header */}
    <ContextualHeader 
      title="Mes Tournois"
      actions={[
        {
          label: 'CRÉER TOURNOI',
          icon: <Plus size={20} />,
          onClick: handleCreate,
          variant: 'primary',
          premium: isAtTournamentLimit,
        },
      ]}
    />

    {/* Search Bar */}
    <div className="p-6 pb-0">...</div>
    ...
  </div>
);
```

**Wireframe:**
```
┌─────────────────────────────────────────────────┐
│  Mes Tournois              [+ CRÉER TOURNOI]    │  ← Contextual Header (64px)
├─────────────────────────────────────────────────┤
│  🔍 Rechercher un tournoi...                    │  ← Search (padding: 24px)
│                                                 │
│  [Tous] [Actifs] [Terminés]                    │  ← Filters
│                                                 │
│  🏆 yoyoyo            [En cours]                │  ← Content
│  👥 1 joueur                                    │
│  ...                                            │
```

---

### 3. Leagues Page (`/leagues`)

**Title:** "Mes Leagues"  
**Back Button:** No  
**Actions (Desktop):** [+ CRÉER LEAGUE] (premium-aware)  
**Menu:** None

```tsx
<ContextualHeader 
  title="Mes Leagues"
  actions={[
    {
      label: 'CRÉER LEAGUE',
      icon: <Plus size={20} />,
      onClick: handleCreateLeague,
      variant: 'primary',
      premium: isAtLeagueLimit,
    },
  ]}
/>
```

**Same changes as Tournaments page:** Remove local header, add ContextualHeader.

---

### 4. Join Page (`/join`)

**Title:** "Rejoindre"  
**Back Button:** No (main page)  
**Actions:** None  
**Menu:** None

```tsx
<ContextualHeader 
  title="Rejoindre"
/>
```

**Wireframe:**
```
┌─────────────────────────────────────┐
│  Rejoindre                          │
├─────────────────────────────────────┤
│                                     │
│        🏆                           │
│                                     │
│   Rejoins un tournoi existant       │
│   ...                               │
```

---

### 5. Profile Page (`/profile`)

**Title:** "Mon Profil"  
**Back Button:** No  
**Actions:** None  
**Menu:** None

```tsx
<ContextualHeader 
  title="Mon Profil"
/>
```

**Wireframe:**
```
┌─────────────────────────────────────┐
│  Mon Profil                         │
├─────────────────────────────────────┤
│  [INFOS] [MES STATS] [PARAMÈTRES]  │  ← Sub-tabs
│    ════                             │
│                                     │
│  Content...                         │
```

---

### 6. Tournament Detail Page (`/tournament/:id`)

**Title:** Tournament name (e.g., "Méchoui Amar")  
**Back Button:** Yes (go back to `/tournaments`)  
**Actions (Admin):**  
  - Desktop: [⚡ NOUVEAU MATCH] [👤+ INVITER] [📺 DIFFUSION] [⚙️ PARAMÈTRES]  
  - Mobile: Menu button with actions  
**Actions (Player with invite):**  
  - Desktop: [⚡ NOUVEAU MATCH] [👤+ INVITER]  
**Actions (Player without invite):**  
  - Desktop: [⚡ NOUVEAU MATCH]  

```tsx
// Admin
<ContextualHeader 
  title="Méchoui Amar"
  showBackButton={true}
  onBack={() => navigate('/tournaments')}
  actions={[
    {
      label: 'NOUVEAU MATCH',
      icon: <Zap size={20} />,
      onClick: handleNewMatch,
      variant: 'primary',
    },
    {
      label: 'INVITER',
      icon: <UserPlus size={20} />,
      onClick: handleInvite,
      variant: 'secondary',
    },
  ]}
  menuItems={[
    {
      label: 'Mode Diffusion',
      icon: <Monitor size={20} />,
      onClick: handleDisplayMode,
    },
    {
      label: 'Paramètres',
      icon: <Settings size={20} />,
      onClick: handleSettings,
    },
  ]}
/>
```

**Wireframe (Mobile - Admin):**
```
┌─────────────────────────────────────┐
│  [←]  Méchoui Amar              [⋯] │  ← Header with menu
├─────────────────────────────────────┤
│  Code: HAGYKH • EN COURS            │  ← Tournament info
│  📊 Format: Libre | 👥 12 joueurs   │
│                                     │
│  [CLASSEMENT] [MATCHS] [STATS] [⚙️] │  ← Sub-tabs
│     ═════════                       │
│                                     │
│  Content...                         │
```

**Wireframe (Desktop - Admin):**
```
┌─────────────────────────────────────────────────────────────┐
│  [←]  Méchoui Amar  [⚡MATCH][👤INVITER][📺][⚙️]            │
├─────────────────────────────────────────────────────────────┤
│  Code: HAGYKH • EN COURS                                    │
│  [CLASSEMENT] [MATCHS] [STATS] [⚙️ PARAMÈTRES]             │
│     ═════════                                               │
│                                                             │
│  Content...                                                 │
```

---

### 7. League Detail Page (`/league/:id`)

**Same structure as Tournament Detail**, with league-specific actions.

```tsx
<ContextualHeader 
  title="Summer League 2026"
  showBackButton={true}
  onBack={() => navigate('/leagues')}
  actions={[...]}
  menuItems={[...]}
/>
```

---

## 🔄 Responsive Behavior

### Mobile (< 1024px)

**Header Layout:**
```
┌────────────────────────────────┐
│  [←?]  Title         [Actions?] │  64px height
└────────────────────────────────┘
```

**Rules:**
- Title always visible (truncate with ellipsis if too long)
- Back button: 40x40px (if needed)
- Actions: Hidden on mobile (moved to BottomMenuSpecific or MenuButton)
- Menu button: 40x40px (if menuItems provided)

### Desktop (>= 1024px)

**Header Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [←?]  Title                 [Action] [Action] [⋯?] │  64px height
└──────────────────────────────────────────────────────┘
```

**Rules:**
- Title + Back button (if needed) on the left
- Actions visible as buttons on the right
- Menu button optional (for overflow actions)

---

## 📝 Implementation Checklist

### Phase 1: Create Component (1h)
- [ ] Create `src/components/navigation/ContextualHeader.tsx`
- [ ] Implement props interface
- [ ] Add responsive logic (mobile/desktop)
- [ ] Style with Tailwind
- [ ] Add menu dropdown functionality
- [ ] Test with different prop combinations

### Phase 2: Integrate on Main Pages (2h)
- [ ] **Home** (`/`): Add ContextualHeader with title "🍺 BPL"
- [ ] **Tournaments** (`/tournaments`): Remove local header (lines 128-141), add ContextualHeader
- [ ] **Leagues** (`/leagues`): Remove local header, add ContextualHeader
- [ ] **Join** (`/join`): Remove local header, add ContextualHeader
- [ ] **Profile** (`/profile`): Remove local header, add ContextualHeader

### Phase 3: Integrate on Detail Pages (2h)
- [ ] **Tournament Detail** (`/tournament/:id`): Add ContextualHeader with back button + actions
- [ ] **League Detail** (`/league/:id`): Add ContextualHeader with back button + actions
- [ ] Handle permissions (admin vs player)
- [ ] Handle responsive actions (desktop: buttons, mobile: menu)

### Phase 4: Clean Up (1h)
- [ ] Remove all local `<header>` elements from pages
- [ ] Verify spacing consistency (content should start immediately below header)
- [ ] Test navigation flow (back button, actions)
- [ ] Test responsive breakpoints

### Phase 5: Testing (1h)
- [ ] Unit tests for ContextualHeader component
- [ ] Visual regression tests (mobile + desktop)
- [ ] Accessibility tests (keyboard navigation, screen reader)
- [ ] Test all pages (main + detail)

**Total Estimate:** 7 hours

---

## 🎯 Acceptance Criteria

### AC1: Single Source of Truth for Page Title
**Given** a user navigates to any page  
**When** the page loads  
**Then** the page title is displayed **only once** in the ContextualHeader  
**And** no local header with the same title is visible

### AC2: Consistent Header Height
**Given** a user navigates between pages  
**When** the header is rendered  
**Then** the header height is **always 64px**  
**And** the content starts immediately below the header

### AC3: Back Button Navigation
**Given** a user is on a detail page (tournament/league)  
**When** the user clicks the back button  
**Then** navigate to the corresponding list page  
**And** the transition is smooth (no page reload)

### AC4: Responsive Actions
**Given** a user is on desktop (>= 1024px)  
**When** viewing a page with actions  
**Then** actions are displayed as **buttons** in the header  

**Given** a user is on mobile (< 1024px)  
**When** viewing a page with actions  
**Then** actions are **hidden** from the header  
**And** moved to BottomMenuSpecific or accessible via MenuButton

### AC5: Menu Dropdown
**Given** a user clicks the menu button (⋯)  
**When** the menu is open  
**Then** display a dropdown with menu items  
**And** clicking an item executes the action  
**And** clicking outside closes the menu

### AC6: Premium Indicators
**Given** an action requires premium (e.g., "Créer tournoi" when at limit)  
**When** the action is rendered  
**Then** display a lock icon (🔒) next to the label  
**And** clicking the action opens the PaymentModal

### AC7: Accessibility
**Given** a user navigates with keyboard only  
**When** tabbing through the header  
**Then** all interactive elements are focusable  
**And** Enter key activates buttons  
**And** Escape key closes dropdown menus

---

## 🔍 Visual Regression Tests

### Test Cases

1. **Mobile - Tournaments Page**
   - Title: "Mes Tournois"
   - No back button
   - No actions visible
   - Height: 64px

2. **Desktop - Tournaments Page**
   - Title: "Mes Tournois"
   - No back button
   - Action: [+ CRÉER TOURNOI] visible on right
   - Height: 64px

3. **Mobile - Tournament Detail (Admin)**
   - Title: "Méchoui Amar"
   - Back button visible
   - Menu button (⋯) visible
   - Actions: hidden (in menu)

4. **Desktop - Tournament Detail (Admin)**
   - Title: "Méchoui Amar"
   - Back button visible
   - Actions: [⚡ NOUVEAU MATCH] [👤+ INVITER] visible
   - Menu button (⋯) visible (for overflow actions)

5. **Mobile - Tournament Detail (Player without invite)**
   - Title: "Méchoui Amar"
   - Back button visible
   - No menu button
   - No actions

---

## 📦 Dependencies

**New:**
- None (uses existing lucide-react icons)

**Existing:**
- `lucide-react` (for icons: ArrowLeft, MoreVertical, Plus, Zap, UserPlus, etc.)
- `react-router-dom` (for navigation)
- Tailwind CSS (for styling)

---

## 🚀 Migration Guide

### Step 1: Create ContextualHeader Component
Copy the code example from the "Component Specification" section into `src/components/navigation/ContextualHeader.tsx`.

### Step 2: Update Tournaments Page

**File:** `src/pages/Tournaments.tsx`

**Remove:**
```tsx
{/* Header */}
<header className="p-6 border-b border-slate-800 flex items-center justify-between">
  <h1 className="text-2xl font-bold text-white">Mes Tournois</h1>
  
  {/* Desktop Create Button */}
  <button
    onClick={handleCreate}
    className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-amber-600 text-white font-bold rounded-lg transition-all active:scale-95"
  >
    <Plus size={20} />
    Créer un tournoi
    {isAtTournamentLimit && <span className="ml-1">🔒</span>}
  </button>
</header>
```

**Add (at the top of the return statement):**
```tsx
<ContextualHeader 
  title="Mes Tournois"
  actions={[
    {
      label: 'CRÉER TOURNOI',
      icon: <Plus size={20} />,
      onClick: handleCreate,
      variant: 'primary',
      premium: isAtTournamentLimit,
    },
  ]}
/>
```

**Import:**
```tsx
import { ContextualHeader } from '../components/navigation/ContextualHeader';
```

### Step 3: Repeat for Other Pages
Follow the same pattern for:
- Leagues page
- Join page
- Profile page
- Tournament detail page
- League detail page

---

## 🎨 Design Tokens

### Colors
- **Background:** `#0f172a` (`bg-slate-900`)
- **Border:** `#1e293b` (`border-slate-800`)
- **Text Primary:** `#ffffff` (`text-white`)
- **Text Secondary:** `#94a3b8` (`text-slate-400`)
- **Primary:** `#f59e0b` (`bg-primary`)
- **Hover:** `#d97706` (`hover:bg-amber-600`)

### Typography
- **Title Mobile:** 20px, Bold
- **Title Desktop:** 24px, Bold
- **Button:** 14px, Semibold

### Spacing
- **Header Height:** 64px (16 Tailwind units)
- **Horizontal Padding:** 16px (4 Tailwind units)
- **Button Gap:** 8px (2 Tailwind units)
- **Icon Size:** 24x24px

---

## 📖 References

- **UX Design Doc:** `ux-ui-design-responsive-architecture.md`
- **Epic:** Epic 9 - Responsive Navigation Refactor
- **Related Stories:** 
  - Story 9.2: Responsive Infrastructure
  - Story 9.3: Bottom Tab Menu Principal
  - Story 9.6: Desktop Sidebar Navigation

---

**End of Specifications Document**

Ready for implementation! 🚀
