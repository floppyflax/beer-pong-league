# Story 14.29: Token gradient-card

Status: done

## Story

As a developer,
I want the `gradient-card` token in Tailwind,
So that tournament and league cards have a subtle horizontal gradient for depth.

## Acceptance Criteria

1. **Given** design-system-convergence.md section 3.2 (gradient-card)
   **When** I use the token
   **Then** `bg-gradient-card` is available in Tailwind

2. Value: `linear-gradient(to left, rgba(51, 65, 85, 0.98), rgba(30, 41, 59, 0.98))` (slate-700 → slate-800, horizontal, design-system-convergence 3.2)

3. Token is added to `tailwind.config.js` under `backgroundImage`

4. Design System showcase displays the gradient on a sample card

## Tasks / Subtasks

- [x] Task 1: Add gradient-card to Tailwind (AC: 1, 2, 3)
  - [x] Extend `backgroundImage` in tailwind.config.js
  - [x] Add gradient-card value
- [x] Task 2: Design System showcase (AC: 4)
  - [x] Add gradient-card demo in DesignSystemShowcase

## Dev Notes

- **Source:** design-system-convergence.md section 3.2
- **File:** `tailwind.config.js`
- Reference: Frame 3 (Mes tournois)

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#3.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Token `gradient-card` ajouté dans `tailwind.config.js` sous `backgroundImage` avec la valeur `linear-gradient(to left, rgba(51, 65, 85, 0.98), rgba(30, 41, 59, 0.98))` (slate-700 → slate-800, design-system-convergence 3.2).
- DesignSystemShowcase : GradientBar pour gradient-card + carte exemple avec `bg-gradient-card`.
- Tests : tailwind-design-tokens.test.ts (gradient-card), DesignSystemShowcase.test.tsx (gradient-card + sample card).

- 2026-02-13: Code review — 7 issues fixed (2 HIGH, 3 MEDIUM, 2 LOW). AC2/narrative/Completion Notes alignés design-system-convergence 3.2. DesignSystemShowcase description corrigée. File List complétée (design-tokens.css). Tests renforcés (commentaire + assertion gradient class).

### File List

- tailwind.config.js
- src/styles/design-tokens.css
- src/pages/DesignSystemShowcase.tsx
- tests/unit/config/tailwind-design-tokens.test.ts
- tests/unit/pages/DesignSystemShowcase.test.tsx
