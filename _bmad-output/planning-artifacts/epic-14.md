# Epic 14: Full Design System Overhaul

**Goal:** Complete overhaul of the application according to the new design system, first creating all atomic assets and components, then migrating each page to integrate elements from reference designs (Frame 1–11).

**User Outcome:** The application adopts a consistent and strong visual identity, aligned with the mockups, with reusable components, unified navigation, and enriched features (match flow, modals).

**Scope:**

1. **Foundations** — Design tokens + atomic components (StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar) + BeerPongMatchIcon + navigation rules + navigation in showcase (14.10, 14.10b)
2. **Modals** — Mandatory X button (applied early for consistency from the first migrations)
3. **Page migration** — Each page migrated according to design-system-convergence
4. **Enriched match flow** — Winner selection, cups remaining, souvenir photo

**FRs covered:** FR5 (User Interface), design-system-convergence.md (full), ux-design-specification.md

**Implementation Notes:**

- Reference: `design-system-convergence.md` + screens Frame 1–11 in `assets/`
- Order: foundations (tokens, components) → modals (mandatory X) → page-by-page migration → enriched match flow
- Each component must be isolated, testable, documented

**Dependencies:** Epic 9 (Navigation), Epic 10 (List pages)

**Related Documents:**

- `_bmad-output/planning-artifacts/design-system-convergence.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- Screens Frame 1–11 (assets/)

---

## Phase 1 — Foundations (assets + tokens + atomic components)

---

## Story 14.1: Design tokens in Tailwind / theme

As a developer,
I want centralized design tokens (colors, typography, radius, spacing),
So that the application has a consistent and maintainable visual base.

**Acceptance Criteria:**

**Given** the design system (design-system-convergence.md section 3)
**When** I implement the tokens
**Then** colors are defined (background slate-900/800/700, text, primary/success/error/ELO accents)
**And** gradients are defined (CTA, FAB, active tab)
**And** typography is defined (page titles, section titles, body, labels, stats)
**And** spacing is defined (page padding, card gap, bottom nav margin)
**And** radius and borders are defined (cards, buttons, inputs)
**And** tokens are in `tailwind.config.js` or dedicated theme file
**And** tokens are usable via existing Tailwind classes or CSS variables

**Technical Notes:**

- Section 3 design-system-convergence: 3.1 Colors, 3.2 Gradients, 3.3 Typography, 3.4 Spacing, 3.5 Borders, 3.6 Elevations
- Verify consistency with screens Frame 1–11

---

## Story 14.1b: Design System page (showcase)

As a developer,
I want a Design System page that displays and allows testing of atomic components,
So that I can visualize and validate each component as they are created.

**Acceptance Criteria:**

**Given** the route `/design-system`
**When** I access this page
**Then** a showcase page is displayed with:
**And** **Design Tokens** section (Story 14-1) at the top: colors, gradients, typography, spacing, radius, borders
**And** **Components** sections: StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar
**And** each component section displays the component if it exists, or a "Coming soon" placeholder
**And** variants are testable (e.g. StatCard primary/success/accent)
**And** the page is accessible via DevPanel in dev mode
**And** the bottom nav is hidden on this page

**Technical Notes:**

- `src/pages/DesignSystemShowcase.tsx`
- Route `/design-system`, link in DevPanel
- Tokens section: color swatches, gradient bars, typography/spacing/radius/border examples
- Each story 14-2 to 14-8 adds its demo in the corresponding section

---

## Story 14.2: StatCard component

As a developer,
I want a reusable StatCard component,
So that numeric summaries (Players, Matches, ELO, etc.) are consistent everywhere.

**Acceptance Criteria:**

**Given** the design system (section 4.1)
**When** I use StatCard
**Then** the component displays a value (text or number) and a label
**And** variants: primary, success, accent (semantic colors)
**And** structure: `bg-slate-800 p-3 rounded-xl text-center`
**And** value: `text-2xl font-bold` + color per variant
**And** label: `text-[10px] text-slate-400 uppercase font-bold`
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/StatCard.tsx`
- Props: value, label, variant? ('primary' | 'success' | 'accent')

---

## Story 14.3: SegmentedTabs component

As a developer,
I want a reusable SegmentedTabs component,
So that filters (All/Active/Finished) and tabs (Ranking/Matches/Settings) are consistent.

**Acceptance Criteria:**

**Given** the design system (section 4.2)
**When** I use SegmentedTabs
**Then** the component displays a list of tabs
**And** active tab: `bg-primary text-white` or gradient
**And** inactive tab: `bg-slate-800 text-slate-400 hover:bg-slate-700`
**And** structure: `flex gap-2`, `px-4 py-2 rounded-lg font-semibold`
**And** onClick callback for tab change
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/SegmentedTabs.tsx`
- Props: tabs: { id, label }[], activeId, onChange

---

## Story 14.4: ListRow component

As a developer,
I want a reusable ListRow component,
So that list rows (player, tournament, league) are consistent.

**Acceptance Criteria:**

**Given** the design system (section 4.3)
**When** I use ListRow (player)
**Then** circular avatar or initials placeholder
**And** rank badge (1, 2, 3 with gold/silver/bronze)
**And** name + subtitle (W/L, winrate)
**And** ELO on the right + delta (green/red)
**And** chevron or right arrow
**When** I use ListRow (tournament/league card)
**Then** name, date, status (badge)
**And** metrics: Matches, Players, Format
**And** right chevron
**And** the component supports variants and is clickable

**Technical Notes:**

- `src/components/design-system/ListRow.tsx`
- Props per variant (player, tournament, league)
- Reference: screens Frame 3 (My tournaments), Frame 7 (My leagues)

---

## Story 14.5: InfoCard component

As a developer,
I want a reusable InfoCard component,
So that context banners (tournament/league dashboard) are consistent.

**Acceptance Criteria:**

**Given** the design system (section 4.4)
**When** I use InfoCard
**Then** structure: `bg-slate-800/50 rounded-xl p-4 border border-slate-700/50`
**And** title + status badge
**And** info line with icons (calendar, users, format)
**And** the component is flexible (children or structured props)
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/InfoCard.tsx`
- Reference: screens Frame 4 (Tournament dashboard), Frame 8 (League dashboard)

---

## Story 14.6: FAB component (Floating Action Button)

As a developer,
I want a reusable FAB component,
So that primary actions (Create tournament, New match) are consistent.

**Acceptance Criteria:**

**Given** the design system (sections 2.2, 4.5)
**When** I use FAB
**Then** size: 56px (mobile), 64px (desktop)
**And** background: gradient `from-blue-500 to-violet-600`
**And** icon: white, 24px
**And** shadow: `shadow-lg`
**And** position: `fixed bottom-20 right-4` (above bottom nav)
**And** props: icon, onClick, ariaLabel, variant? (primary, secondary)
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/FAB.tsx`
- Integrate BeerPongMatchIcon for "New match" action

---

## Story 14.7: Banner component (feedback)

As a developer,
I want a reusable Banner component for feedback (success, error),
So that toasts and banners are consistent.

**Acceptance Criteria:**

**Given** the design system (section 4.6)
**When** I use Banner
**Then** structure: green background (success) or red (error)
**And** icon + text
**And** position: top or inline depending on context
**And** props: message, variant ('success' | 'error'), onDismiss?
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/Banner.tsx`
- May complement or replace react-hot-toast for some cases

---

## Story 14.8: SearchBar component

As a developer,
I want a reusable SearchBar component,
So that searches (tournaments, leagues) are consistent.

**Acceptance Criteria:**

**Given** the design system (section 4.7)
**When** I use SearchBar
**Then** magnifying glass icon on the left
**And** input: `bg-slate-800 border border-slate-700 rounded-lg pl-12`
**And** debounce 300ms
**And** props: value, onChange, placeholder
**And** the component is exported and documented

**Technical Notes:**

- `src/components/design-system/SearchBar.tsx`
- Reference: screens Frame 3, Frame 7

---

## Story 14.9: Identity icon BeerPongMatchIcon

**Status:** done ✅

As a user,
I want the "New match" button to display an icon with a beer pong cup and ping-pong ball,
So that the app has a stronger visual identity.

**Implementation:** Already done — `src/components/icons/BeerPongMatchIcon.tsx`

---

## Story 14.10: Navigation rules (bottom nav always visible)

As a developer,
I want the bottom nav visible on all core routes,
So that navigation is consistent with the design system.

**Acceptance Criteria:**

**Given** the design system (section 2.1)
**When** the user is on a core route
**Then** the bottom nav is displayed
**And** core routes: `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/tournament/:id`, `/league/:id`, `/player/:id`
**And** exclusions: Landing (logged out), Display views, Auth callback, full-screen modals
**And** `shouldShowBottomMenu` (or equivalent) returns true for all core cases
**And** content bottom padding (`pb-20` or `pb-24`) is applied

**Technical Notes:**

- `src/utils/navigationHelpers.ts` — `shouldShowBottomMenu`, `shouldShowBackButton`
- Verify BottomTabMenu, BottomMenuSpecific

---

## Story 14.10b: Navigation in Design System (showcase)

As a developer,
I want navigation components (BottomTabMenu, BottomMenuSpecific) documented and visible in the Design System showcase,
So that navigation is an official part of the design system and I can visualize and validate it.

**Acceptance Criteria:**

**Given** the Design System page (`/design-system`)
**When** I access the Navigation section
**Then** a "Navigation" section displays BottomTabMenu and BottomMenuSpecific

**And** BottomTabMenu: preview in a mobile-style frame (or dedicated area) with the 5 tabs (Home, Join, Tournaments, Leagues, Profile)
**And** active/inactive states are demonstrated (e.g. active tab with primary color)
**And** BottomMenuSpecific: demo with 1 or 2 actions (e.g. Scan QR, Create tournament)

**And** BottomTabMenu aligned with design-system-convergence section 2.1:

- Leagues icon: Medal (not Users)
- Min height 64px, touch target 48px+
- Active state: primary color / gradient

**And** components remain in `src/components/navigation/` (no duplication in design-system/)

**Technical Notes:**

- `src/pages/DesignSystemShowcase.tsx` — add Navigation section
- Preview: MemoryRouter or area with fixed height to simulate rendering
- Reference: design-system-convergence.md sections 2.1, 2.2
- BottomTabMenu: `src/components/navigation/BottomTabMenu.tsx`
- BottomMenuSpecific: `src/components/navigation/BottomMenuSpecific.tsx`

---

## Story 14.11: Modal close button (design system)

As a user,
I want an X button on all modals,
So that I can always close without being blocked.

**Acceptance Criteria:**

**Given** any modal in the app
**When** the modal is displayed
**Then** X button visible in top right
**And** clicking X closes the modal
**And** modals concerned: New match, Enter code, Limit reached, Add player, etc.

**Technical Notes:**

- design-system-convergence section 6.1
- Audit: MatchRecordingForm, CodeInputModal, PaymentModal, AddPlayerModal
- Applied early for consistency from the first page migrations

---

## Phase 1b — Refinements design system (Frame 3, 2026-02-13)

---

## Story 14.29: Token gradient-card

As a developer,
I want the `gradient-card` token in Tailwind,
So that tournament and league cards have a subtle vertical gradient for depth.

**Acceptance Criteria:**

**Given** design-system-convergence.md section 3.2 (gradient-card)
**When** I use the token
**Then** `bg-gradient-card` is available in Tailwind
**And** value: `linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))` (slate-800 → slate-900)
**And** token is added to `tailwind.config.js` under `backgroundImage`
**And** Design System showcase displays the gradient on a sample card

**Technical Notes:**

- `tailwind.config.js` — extend `backgroundImage`
- Reference: Frame 3 (Mes tournois), design-system-convergence 3.2

---

## Story 14.30: SegmentedTabs variante encapsulated

As a developer,
I want SegmentedTabs to support a variant `encapsulated`,
So that filters (Tous / Actifs / Terminés) appear in a single rounded block as in Frame 3.

**Acceptance Criteria:**

**Given** design-system-convergence.md section 4.2 (variante encapsulated)
**When** I use SegmentedTabs with `variant="encapsulated"`
**Then** container: `bg-slate-800 rounded-xl p-1` (single block)
**And** tabs: `flex` inside, no gap between them
**And** active tab: `bg-gradient-tab-active text-white rounded-lg`
**And** inactive tab: transparent background, `text-slate-400`
**And** the component remains backward compatible (default variant = current behavior)
**And** Design System showcase demonstrates both variants

**Technical Notes:**

- `src/components/design-system/SegmentedTabs.tsx` — add prop `variant?: 'default' | 'encapsulated'`
- Reference: Frame 3 (Mes tournois)

---

## Story 14.31: TournamentCard refonte (design system 4.8)

As a developer,
I want TournamentCard aligned with design-system-convergence section 4.8,
So that the card matches Frame 3 (icône Trophy, gradient, structure).

**Acceptance Criteria:**

**Given** design-system-convergence.md section 4.8
**When** I view a tournament card
**Then** background: `bg-gradient-card`
**And** header: [Icône Trophy] [Titre gras blanc] [Badge En cours / Terminé]
**And** body: 3 lines with icons (Users, Calendar, Trophy) — joueurs, date, dernière activité
**And** footer: separator + "Cliquez pour voir le classement" (text-slate-500)
**And** container: `rounded-xl p-6 border border-slate-700/50`
**And** click navigates to `/tournament/:id`

**Technical Notes:**

- `src/components/tournaments/TournamentCard.tsx`
- Badge actif: `bg-green-500/20 text-green-400` — "En cours"
- Badge terminé: `bg-slate-700 text-slate-300` — "Terminé"
- Depends on Story 14-29 (gradient-card)

---

## Story 14.32: BottomTabMenu alignement design system (Frame 3)

As a developer,
I want BottomTabMenu to match the design system (section 2.1) and Frame 3,
So that the active tab uses the blue-purple gradient and the bar is visually consistent.

**Acceptance Criteria:**

**Given** design-system-convergence.md section 2.1
**When** I view the bottom nav
**Then** active tab: `bg-gradient-tab-active` (blue-purple gradient) with white text
**And** inactive tabs: grey (text-slate-400)
**And** min height 64px, touch target 48px+
**And** 5 tabs: Accueil, Rejoindre, Tournois, Leagues, Profil
**And** icons: Home, QrCode, Trophy, Medal, User
**And** Design System showcase displays the navigation with active/inactive states

**Technical Notes:**

- `src/components/navigation/BottomTabMenu.tsx`
- Verify gradient-tab-active is applied to active tab (may already be done in 14-10b)
- Reference: Frame 3, design-system-convergence 2.1

---

## Phase 2 — Tournament flow

---

## Story 14.12: My tournaments page (overhaul)

As a user,
I want the My tournaments page aligned with the design system,
So that design elements (search, filters, cards, FAB) are present.

**Acceptance Criteria:**

**Given** the design system (section 5.1)

**When** I view My tournaments
**Then** header: title + button + search (or dedicated bar)
**And** SearchBar (debounce 300ms)
**And** SegmentedTabs (All / Active / Finished)
**And** list or grid of cards (ListRow or TournamentCard)
**And** FAB: Create tournament
**And** bottom nav visible
**And** the page matches designs Frame 3

**Technical Notes:**

- `src/pages/Tournaments.tsx`
- Reuse StatCard, SegmentedTabs, ListRow, SearchBar, FAB

---

## Story 14.13: Tournament dashboard page (overhaul)

As a user,
I want the tournament dashboard aligned with the design system,
So that InfoCard, StatCards, tabs and ranking are consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.2)

**When** I view a tournament
**Then** header: name + back + actions (+, …)
**And** InfoCard (status, code, format, date)
**And** StatCards (3 columns)
**And** SegmentedTabs (Ranking / Matches / Settings)
**And** ranking list with ListRow (avatar, rank, ELO, delta)
**And** FAB: New match (BeerPongMatchIcon)
**And** bottom nav visible
**And** the page matches designs Frame 4

**Technical Notes:**

- `src/pages/TournamentDashboard.tsx`
- Reuse InfoCard, StatCard, SegmentedTabs, ListRow, FAB

---

## Story 14.14: Invite players page (overhaul)

As a user,
I want the Invite page aligned with the design system,
So that QR code, link and sharing are consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.5)

**When** I view Invite players
**Then** header: title + back
**And** tournament recap card
**And** QR code (large, readable)
**And** link + Copy / Share
**And** "How does it work?" block
**And** bottom nav visible
**And** the page matches designs Frame 5

**Technical Notes:**

- Tournament invitation page
- Reference: Frame 5

---

## Story 14.15: Join page (via link)

As a user,
I want the Join (link) page aligned with the design system,
So that the flow is consistent with the designs.

**Acceptance Criteria:**

**Given** the design system

**When** I join via link
**Then** the page is aligned with Frame 6
**And** bottom nav visible if relevant

**Technical Notes:**

- Join flow via link (vs QR scan)

---

## Phase 3 — League flow

---

## Story 14.16: My leagues page (overhaul)

As a user,
I want the My leagues page aligned with the design system,
So that search, filters, cards and FAB are consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.1)

**When** I view My leagues
**Then** header: title + button + search
**And** SearchBar
**And** SegmentedTabs (All / Active / Finished)
**And** list or grid of cards (ListRow or LeagueCard)
**And** FAB: Create league
**And** bottom nav visible
**And** the page matches designs Frame 7

**Technical Notes:**

- `src/pages/Leagues.tsx`

---

## Story 14.17: League dashboard page (overhaul)

As a user,
I want the league dashboard aligned with the design system,
So that InfoCard, StatCards, tabs and ranking are consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.2)

**When** I view a league
**Then** header: name + back + actions
**And** InfoCard (status, format, date)
**And** StatCards (3 columns)
**And** SegmentedTabs (Ranking / Matches / Settings)
**And** ranking list with ListRow
**And** FAB: New match (BeerPongMatchIcon)
**And** bottom nav visible
**And** the page matches designs Frame 8

**Technical Notes:**

- `src/pages/LeagueDashboard.tsx`

---

## Story 14.18: Create league page (overhaul)

As a user,
I want the Create league page aligned with the design system,
So that the form is consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.3)

**When** I create a league
**Then** header: title + back
**And** fields with labels, inline validation
**And** primary CTA at bottom
**And** bottom nav visible (or hidden per choice)
**And** the page matches designs Frame 9

**Technical Notes:**

- `src/pages/CreateLeague.tsx`

---

## Phase 4 — Rest

---

## Story 14.19: Create tournament page (overhaul)

As a user,
I want the Create tournament page aligned with the design system,
So that the form is consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.3)

**When** I create a tournament
**Then** header: title + back
**And** fields with labels, inline validation
**And** primary CTA at bottom
**And** the page matches designs Frame 10

**Technical Notes:**

- `src/pages/CreateTournament.tsx`

---

## Story 14.20: Player profile page (overhaul)

As a user,
I want the Player profile page aligned with the design system,
So that avatar, StatCards, streak and sections are consistent.

**Acceptance Criteria:**

**Given** the design system (section 5.4)

**When** I view a player profile
**Then** header: name + back
**And** avatar + info
**And** StatCards (ELO, W/L, Win rate)
**And** streak card
**And** sections: ELO evolution, Stats per league, Head-to-head, Recent matches
**And** bottom nav visible
**And** the page matches designs Frame 11

**Technical Notes:**

- `src/pages/PlayerProfile.tsx`

---

## Story 14.21: My profile page (overhaul)

As a user,
I want the My profile page aligned with the design system,
So that elements are consistent.

**Acceptance Criteria:**

**Given** the design system

**When** I view My profile
**Then** the page is aligned with the designs
**And** bottom nav visible

**Technical Notes:**

- `src/pages/UserProfile.tsx`

---

## Story 14.22: Landing page (overhaul)

As a user,
I want the Landing page aligned with the design system,
So that onboarding is consistent.

**Acceptance Criteria:**

**Given** the design system

**When** I am on the Landing (logged out)
**Then** the page matches designs Frame 1

**Technical Notes:**

- `src/pages/LandingPage.tsx`

---

## Story 14.23: Join page (scan + code)

As a user,
I want the Join (scan, code) page aligned with the design system,
So that the entry flow is consistent.

**Acceptance Criteria:**

**Given** the design system

**When** I am on Join (scan + code)
**Then** the page matches designs Frame 2

**Technical Notes:**

- `src/pages/Join.tsx`

---

## Phase 5 — Enriched match flow

---

## Story 14.24: Database schema for enriched match

As a developer,
I want the DB schema for cups_remaining and photo_url,
So that matches can store this optional data.

**Acceptance Criteria:**

**Given** the need for enriched data
**When** I create the migration
**Then** `matches` has `cups_remaining` (integer, nullable)
**And** `matches` has `photo_url` (text, nullable)
**And** migration in `supabase/migrations/`
**And** Zod schemas and TypeScript types updated

**Technical Notes:**

- design-system-convergence section 7

---

## Story 14.25: Winning team selection (mandatory)

As a player,
I want to choose the winning team instead of scores,
So that I can validate a match quickly.

**Acceptance Criteria:**

**Given** I am recording a match
**When** I have selected the teams
**Then** I see "Who won?" — Team 1 / Team 2 (mandatory)
**And** the form replaces teamAScore/teamBScore with this choice
**And** ELO uses the winner

**Technical Notes:**

- Refactor MatchRecordingForm
- design-system-convergence section 7.4

---

## Story 14.26: Cups remaining (optional)

As a player,
I want to optionally indicate the cups remaining for the winning team,
So that match intensity can be tracked.

**Acceptance Criteria:**

**Given** I have selected the winner
**When** the form displays the options
**Then** optional field "Cups remaining" (1–10)
**And** value stored in `cups_remaining`

**Technical Notes:**

- design-system-convergence section 7.2

---

## Story 14.27: Winning team photo (optional)

As a player,
I want to optionally add a photo of the winning team,
So that I have a souvenir of the match.

**Acceptance Criteria:**

**Given** I have selected the winner
**When** the form displays the options
**Then** optional "Photo" button (camera or gallery)
**And** photo uploaded to Supabase Storage
**And** URL stored in `photo_url`

**Technical Notes:**

- design-system-convergence section 7.2, 7.3

---

## Story 14.28: Display photo and cups in match history

As a player,
I want to see the photo and cups in match history,
So that I can relive the matches.

**Acceptance Criteria:**

**Given** a match with photo and/or cups
**When** I view the history
**Then** photo thumbnail if available
**And** badge "X cups remaining" if recorded

**Technical Notes:**

- TournamentDashboard, LeagueDashboard — match list
