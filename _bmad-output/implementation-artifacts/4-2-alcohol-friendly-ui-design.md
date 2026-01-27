# Story 4.2: Alcohol-Friendly UI Design

Status: ready-for-dev

## Story

As a player in a bar environment,
I want large, clear buttons and simple flows,
So that I can use the app easily even after a few drinks.

## Acceptance Criteria

**Given** the application interface
**When** user interacts with the app
**Then** all buttons are minimum 44x44px touch targets
**And** primary actions require maximum 2-3 clicks
**And** text has high contrast (WCAG AA minimum)
**And** font sizes are large and readable
**And** navigation is intuitive
**And** error messages are clear and actionable
**And** interface works in dim lighting conditions

## Tasks / Subtasks

- [ ] Audit touch target sizes (AC: 44x44px minimum)
  - [ ] Review all buttons in components
  - [ ] Measure touch target sizes
  - [ ] Increase size to 44x44px minimum
  - [ ] Test on mobile devices (actual touch)
  - [ ] Verify thumb-zone accessibility

- [ ] Simplify user flows (AC: 2-3 clicks max)
  - [ ] Map all primary user journeys
  - [ ] Count clicks for each action
  - [ ] Reduce steps where possible
  - [ ] Eliminate unnecessary confirmations
  - [ ] Test flow simplicity

- [ ] Verify contrast ratios (AC: WCAG AA)
  - [ ] Check text/background contrast
  - [ ] Use contrast checker tool
  - [ ] Ensure minimum 4.5:1 for normal text
  - [ ] Ensure minimum 3:1 for large text
  - [ ] Fix any failing contrasts

- [ ] Increase font sizes (AC: Large and readable)
  - [ ] Set minimum text size: 16px (mobile)
  - [ ] Use 18px+ for body text
  - [ ] Use 24px+ for headings
  - [ ] Test readability at arm's length
  - [ ] Verify in dim lighting

- [ ] Improve navigation clarity (AC: Intuitive navigation)
  - [ ] Clear page titles
  - [ ] Prominent back buttons
  - [ ] Consistent navigation patterns
  - [ ] Visual hierarchy clear
  - [ ] Test with new users

- [ ] Enhance error messaging (AC: Clear error messages)
  - [ ] Use plain language
  - [ ] Provide actionable next steps
  - [ ] Display errors prominently
  - [ ] Use icons for visual clarity
  - [ ] Test error scenarios

- [ ] Test in bar conditions (AC: Works in dim lighting)
  - [ ] Test in low light environment
  - [ ] Verify screen brightness settings
  - [ ] Check contrast in dim lighting
  - [ ] Test with glare on screen
  - [ ] Ensure buttons visible

## Dev Notes

### Touch Target Guidelines

**Minimum Touch Targets:**
- All buttons: 44x44px minimum (iOS guideline)
- Ideal: 48x48px (Material Design guideline)
- Spacing: 8px between adjacent targets
- Thumb-zone optimization: Bottom 2/3 of screen

**Tailwind CSS Classes:**
```typescript
// Minimum touch target (44x44px)
"min-w-[44px] min-h-[44px]"

// Comfortable touch target (48x48px)
"min-w-12 min-h-12"

// Large button (recommended)
"px-6 py-3" // Horizontal padding 24px, vertical 12px

// Extra large button (very comfortable)
"px-8 py-4" // Horizontal padding 32px, vertical 16px
```

### Typography Scale

**Recommended Font Sizes:**
```typescript
// Small text (captions, labels)
"text-sm" // 14px - use sparingly

// Body text
"text-base" // 16px - minimum for mobile
"text-lg" // 18px - recommended for readability

// Headings
"text-xl" // 20px - small heading
"text-2xl" // 24px - medium heading
"text-3xl" // 30px - large heading
"text-4xl" // 36px - extra large heading

// Special emphasis
"text-5xl" // 48px - hero text
```

### Contrast Standards (WCAG AA)

**Required Ratios:**
- Normal text (< 18px or < 14px bold): 4.5:1
- Large text (≥ 18px or ≥ 14px bold): 3:1
- UI components: 3:1

**Color Palette (Beer Pong Theme):**
```typescript
// High contrast combinations (WCAG AA+)
const colors = {
  // Background
  slate900: '#0f172a',  // Dark background
  slate800: '#1e293b',  // Card background
  
  // Primary (Amber - Beer color)
  amber500: '#f59e0b',  // Primary action
  amber600: '#d97706',  // Hover state
  
  // Text
  white: '#ffffff',     // Primary text (21:1 contrast on slate900)
  slate400: '#94a3b8',  // Secondary text (5.8:1 contrast on slate900)
  slate500: '#64748b',  // Tertiary text (4.5:1 contrast on slate900)
  
  // Status
  green500: '#10b981',  // Success
  red500: '#ef4444',    // Error
};
```

### User Flow Audit

**Primary Flows (Target: 2-3 clicks):**

1. **Join Tournament:**
   - Click 1: Scan QR code (opens page)
   - Click 2: Enter name + Join button
   - **Total: 2 clicks** ✅

2. **Record Match:**
   - Click 1: "Record Match" button
   - Click 2: Select players + scores
   - Click 3: Submit
   - **Total: 3 clicks** ✅

3. **View Leaderboard:**
   - Click 1: "Leaderboard" tab
   - **Total: 1 click** ✅

4. **Create Tournament:**
   - Click 1: "Create Tournament" button
   - Click 2: Fill form + Create button
   - **Total: 2 clicks** ✅

### Error Message Guidelines

**Bad Error Message:**
```
❌ "Error: PGRST116"
```

**Good Error Message:**
```
✅ "Impossible de rejoindre le tournament. Vérifiez votre connexion internet et réessayez."
```

**Error Message Template:**
```typescript
const errorMessages = {
  network: "Problème de connexion. Vérifiez votre internet et réessayez.",
  validation: "Informations invalides. Vérifiez les champs en rouge.",
  auth: "Session expirée. Reconnectez-vous pour continuer.",
  notFound: "Tournament introuvable. Vérifiez le lien ou le QR code.",
  duplicate: "Vous avez déjà rejoint ce tournament.",
};
```

### Testing Checklist

**Touch Target Audit:**
- [ ] All buttons ≥ 44x44px
- [ ] Adequate spacing between buttons
- [ ] Thumb-zone optimization
- [ ] Test with actual fingers (not stylus)

**Contrast Audit:**
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Buttons meet 3:1 contrast
- [ ] Status indicators visible
- [ ] Test in bright and dim lighting

**Readability Audit:**
- [ ] Minimum 16px font size
- [ ] Headings 24px+
- [ ] Clear visual hierarchy
- [ ] Test at arm's length (50cm)

**Flow Audit:**
- [ ] Primary actions ≤ 3 clicks
- [ ] No unnecessary steps
- [ ] Clear navigation
- [ ] Test with new users

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Design Patterns - Alcohol-Friendly UI]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System - Touch Targets]
- [Source: _bmad-output/planning-artifacts/prd.md#FR5.1: Design "Alcoolisé-Friendly"]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Tournament Participation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- All components in src/components/
- All pages in src/pages/
- tailwind.config.js (verify color palette)
- src/index.css (verify base font sizes)
