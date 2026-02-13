# Story 14.1: Design tokens in Tailwind / theme

Status: done

## Story

As a developer,
I want centralized design tokens (colors, typography, radius, spacing),
So that the application has a consistent and maintainable visual base.

## Acceptance Criteria

1. **Given** the design system (design-system-convergence.md section 3)
   **When** I implement the tokens
   **Then** colors are defined (background slate-900/800/700, text, primary/success/error/ELO accents)

2. Gradients are defined (CTA, FAB, active tab)

3. Typography is defined (page titles, section titles, body, labels, stats)

4. Spacing is defined (page padding, card gap, bottom nav margin)

5. Radius and borders are defined (cards, buttons, inputs)

6. Tokens are in `tailwind.config.js` or dedicated theme file

7. Tokens are usable via existing Tailwind classes or CSS variables

## Tasks / Subtasks

- [x] Task 1: Colors (AC: 1)
  - [x] Define backgrounds: slate-900, slate-800, slate-700
  - [x] Define text: white, slate-300, slate-400, slate-500
  - [x] Define accents: primary, success, error, ELO, info
  - [x] Define semantic: active status, finished, ELO delta
- [x] Task 2: Gradients (AC: 2)
  - [x] Primary CTA: amber→yellow or blue→violet
  - [x] FAB / buttons: blue-500→violet-600
  - [x] Active tab
- [x] Task 3: Typography (AC: 3)
  - [x] Page titles: text-xl/2xl, font-bold
  - [x] Section titles: text-lg font-bold
  - [x] Body, labels, stats
- [x] Task 4: Spacing (AC: 4)
  - [x] Page padding: p-4, p-6
  - [x] Card gap: gap-4, gap-6
  - [x] Bottom nav margin: pb-20, pb-24
- [x] Task 5: Radius and borders (AC: 5)
  - [x] rounded-xl, rounded-lg
  - [x] border-slate-700
- [x] Task 6: Tailwind integration (AC: 6, 7)
  - [x] Update tailwind.config.js
  - [x] Verify consistency with screens Frame 1–11

## Dev Notes

- **Source:** `_bmad-output/planning-artifacts/design-system-convergence.md` sections 3.1 to 3.6
- Check existing `tailwind.config.js` for extensions (theme.extend)
- Project: Vite + React + Tailwind CSS
- Do not break existing styles — progressive migration

### Project Structure Notes

- `tailwind.config.js` at root
- Optional: `src/styles/design-tokens.css` for CSS variables if needed

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Design tokens centralized in `tailwind.config.js` (theme.extend)
- Colors: background (primary/secondary/tertiary), text (primary/secondary/tertiary/muted), accents (primary, success, error, elo, info), semantic (status-active, status-finished, delta-positive/negative)
- Gradients: gradient-cta, gradient-cta-alt, gradient-fab, gradient-tab-active
- Typography: page-title, section-title, body, label, stat
- Spacing: page, page-lg, card-gap, bottom-nav, bottom-nav-lg
- Radius: card (rounded-xl), button (rounded-lg), input (rounded-xl)
- Borders: border-card, border-card-muted
- Screens: sm/md/lg/xl aligned with Frame 1–11
- CSS variables in `src/styles/design-tokens.css` for optional use
- primary kept as amber for progressive migration (existing compatibility)
- 9 unit tests validating theme structure

### File List

- tailwind.config.js (modified)
- src/styles/design-tokens.css (new)
- src/index.css (modified — import design-tokens.css)
- tests/unit/config/tailwind-design-tokens.test.ts (new)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Changes Requested → Fixed  
**Reviewer:** Adversarial Code Review

### Summary

- **Git vs Story:** File List consistent with changes (tailwind.config.js, design-tokens.css, index.css, tests)
- **ACs:** All implemented
- **Tasks:** All completed

### Action Items (resolved automatically)

- [x] **[HIGH]** Typography: `page-title` and `page-title-lg` were identical (1.5rem). Spec: text-xl mobile = 1.25rem, text-2xl desktop = 1.5rem. Fixed: page-title = 1.25rem [tailwind.config.js]
- [x] **[MEDIUM]** design-tokens.css: missing gradient variables for parity with Tailwind. Added --gradient-cta and --gradient-fab [src/styles/design-tokens.css]
- [x] **[MEDIUM]** Tests: added assertions on typography sizes (page-title 1.25rem, page-title-lg 1.5rem) [tests/unit/config/tailwind-design-tokens.test.ts]

### Code Review (AI) - 2026-02-13 (Batch)

#### ✅ FIXED: design-tokens.css gradient parity (MEDIUM)

**Issue:** --gradient-cta-alt and --gradient-tab-active missing from CSS variables.  
**Fix:** Added both variables to design-tokens.css.  
**File:** `src/styles/design-tokens.css`

### Action Items (remaining — LOW)

- [ ] [AI-Review][LOW] No component uses the new tokens yet (bg-background-primary, text-text-primary, etc.). Progressive migration planned — document usage in Dev Notes or a design-tokens README.
- [ ] [AI-Review][LOW] Tests do not validate actual CSS output (computed styles). Tests only verify config structure. Optional: integration test with DOM rendering.

### Review Notes

- Tokens well structured, aligned with design-system-convergence.md
- primary kept as amber for compatibility — relevant choice
- 9 unit tests pass

---

## Change Log

- 2026-02-13: Full implementation of design tokens (Story 14-1). Tokens in tailwind.config.js + design-tokens.css. Unit tests added.
- 2026-02-13: Code review — 3 issues fixed (page-title typography, CSS gradients, typo tests). 2 LOW items remaining (usage doc, CSS output test).
