# Story 14.1b: Design System page (showcase)

Status: done

## Story

As a developer,
I want a Design System page that displays tokens and allows testing atomic components,
So that I can visualize and validate foundations (colors, typography, gradients, etc.) and each component as they are created.

## Acceptance Criteria

1. **Given** the route `/design-system`
   **When** I access this page
   **Then** a showcase page is displayed with the design system background and typography

2. **Design Tokens section** (Story 14-1) — at the top of the page:
   - **Colors:** swatches for background (primary/secondary/tertiary), text (primary/secondary/tertiary/muted), accents (primary, success, error, elo, info), semantic (status-active, status-finished, delta-positive/negative)
   - **Gradients:** bars or squares for gradient-cta, gradient-cta-alt, gradient-fab, gradient-tab-active
   - **Typography:** examples for page-title, section-title, body, label, stat
   - **Spacing:** visual examples (page, card-gap, bottom-nav)
   - **Radius:** examples for card, button, input
   - **Borders:** examples for border-card, border-card-muted

3. **Components section:** StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar, Navigation (BottomTabMenu, BottomMenuSpecific — added by Story 14.10b)

4. Each component section displays the component if it exists, or a "Coming soon" placeholder with the component name

5. Sections allow testing variants (e.g. StatCard primary/success/accent, Banner success/error)

6. The page is accessible in dev via DevPanel or direct link

7. The bottom nav is hidden on this page (dev tool page)

## Tasks / Subtasks

- [x] Task 1: Create page and route (AC: 1, 6, 7)
  - [x] Create `src/pages/DesignSystemShowcase.tsx`
  - [x] Add route `/design-system` in App.tsx
  - [x] Exclude `/design-system` from `shouldShowBottomMenu`
  - [x] Add "Design System" link in DevPanel
- [x] Task 2: Design Tokens section (AC: 2)
  - [x] Colors subsection: grid of swatches with names (bg-background-primary, text-text-primary, etc.)
  - [x] Gradients subsection: colored bars (gradient-cta, gradient-fab, etc.)
  - [x] Typography subsection: examples text-page-title, text-section-title, text-body, text-label, text-stat
  - [x] Spacing subsection: blocks with p-page, gap-card, etc.
  - [x] Radius subsection: squares/cards with rounded-card, rounded-button, rounded-input
  - [x] Borders subsection: examples border-card, border-card-muted
- [x] Task 3: Component sections structure (AC: 3, 4)
  - [x] Sections with titles (h2) for StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar
  - [x] "Coming soon" placeholder for components not yet implemented
  - [x] Conditional import or barrel to avoid errors if component missing
- [x] Task 4: Progressive integration (AC: 5)
  - [x] Each story 14-2 to 14-8 adds its demo in the corresponding section

## Dev Notes

- **File:** `src/pages/DesignSystemShowcase.tsx`
- **Route:** `/design-system`
- **Access:** Link in DevPanel (visible only in `import.meta.env.DEV`)
- **Structure:** Scrollable page, sections with `space-y-8`, page title "Design System — Beer Pong League"
- **Tokens section (Story 14-1):** Tokens are already implemented in `tailwind.config.js` and `src/styles/design-tokens.css`. The showcase displays them visually for validation.
- **Placeholder:** Component not created → display `<div className="p-4 bg-slate-800 rounded-xl border border-dashed border-slate-600 text-slate-400">StatCard — Coming soon</div>`
- **Dynamic import:** Use direct imports; if the component does not exist yet, DesignSystemShowcase can import from a barrel that only exports existing components, or use conditional blocks per component

### Progressive integration strategy

Option A (recommended): The page imports all components from the barrel `design-system/index.ts`. Initially, the barrel exports nothing (or only what exists). Each story 14-2 to 14-8:

1. Creates its component
2. Exports it from the barrel
3. Adds a demo section in DesignSystemShowcase

Option B: The page uses subcomponents `DesignSystemShowcase/StatCardSection.tsx` etc., created progressively. More modular but more files.

**Recommendation:** Option A — single page with inline sections, updated by each component story.

### Project Structure Notes

- `src/pages/DesignSystemShowcase.tsx`
- Updates: `src/App.tsx`, `src/components/DevPanel.tsx`, `src/utils/navigationHelpers.ts`

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md]
- [Source: Story 14-1 — design tokens (tailwind.config.js, design-tokens.css)]
- [Source: Stories 14-2 to 14-8 — components to showcase]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- DesignSystemShowcase page created with Design Tokens section (colors, gradients, typography, spacing, radius, borders) and component sections with placeholders
- Route /design-system added in App.tsx (lazy-loaded)
- "Design System" link added in DevPanel (visible in dev mode)
- /design-system excluded from shouldShowBottomMenu in navigationHelpers.ts
- 14 DesignSystemShowcase unit tests + 1 navigationHelpers test for /design-system
- **Code review (2026-02-13):** 5 issues fixed — @/ alias imports, token mb-bottom-nav, removed dead ComponentPlaceholder, Banner demo position=top, InfoCard/FAB/Banner tests

### Senior Developer Review (AI)

**Reviewer:** floppyflax on 2026-02-13  
**Outcome:** Approve (after fixes)

**Findings addressed:**

1. Imports harmonized on `@/` alias (project-context)
2. Magic number replaced by token `mb-bottom-nav`
3. Removed `ComponentPlaceholder` (dead code)
4. Banner demo `position="top"` added
5. InfoCard, FAB, Banner tests strengthened

### File List

- src/pages/DesignSystemShowcase.tsx (new)
- src/App.tsx (modified)
- src/components/DevPanel.tsx (modified)
- src/utils/navigationHelpers.ts (modified)
- tests/unit/pages/DesignSystemShowcase.test.tsx (new)
- tests/unit/utils/navigationHelpers.test.ts (modified)

## Code Review (AI) - 2026-02-13 (Batch 10-1, 10-3, 10-4, 14-1, 14-1b)

### Fixes Applied

- **[14-1b]** Banner test: Added assertion for Banner component (success, error, dismissable)
- **[14-1b]** BannerShowcase: Dismissable demo now uses useState — clicking X hides the banner
- **[14-1b]** Padding: Changed pb-24 to pb-8 (bottom nav hidden on /design-system)

### File List (Code Review)

- src/pages/DesignSystemShowcase.tsx (modified — BannerShowcase, pb-8)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified — Banner test)

## Change Log

- 2026-02-13: Full implementation Story 14-1b — Design System page (showcase) with tokens and component placeholders
- 2026-02-13: Code review batch — Banner test, BannerShowcase dismiss demo, pb-8
- 2026-02-13: Code review — 5 fixes (imports @/, bottom-nav token, dead code, Banner position top, tests)
