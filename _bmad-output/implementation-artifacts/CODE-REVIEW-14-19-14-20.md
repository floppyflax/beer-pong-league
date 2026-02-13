# Code Review — Stories 14-19 & 14-20

**Date:** 2026-02-13  
**Reviewer:** Adversarial Senior Developer (AI)  
**Stories:** 14-19 (Create Tournament), 14-20 (Player Profile)  
**Git vs Story Discrepancies:** 0 (stories already done; uncommitted changes are from 14-35)

---

## Story 14-19: Create Tournament Page

### AC Validation

| AC | Status | Evidence |
|----|--------|----------|
| 1. Header title + back | ✅ | ContextualHeader, back navigates to / |
| 2. Fields with labels, inline validation | ✅ | Labels, validateForm, onBlur, errors |
| 3. Primary CTA at bottom | ✅ | Sticky bottom-16, form association |
| 4. Frame 10 alignment | ✅ | Design tokens applied |

### Findings

#### 🔴 HIGH

1. **Limit-reached modal: no Escape key handler** [CreateTournament.tsx:265-296]  
   Design-system 6.1 + epic-14 require modals to be closable. UX spec (line 4640): "Escape key closes modals". The Limit reached modal has no `onKeyDown` for Escape. Users expect Escape to dismiss.

2. **Limit-reached modal: no focus trap** [CreateTournament.tsx:265-296]  
   UX spec (lines 3430, 3888): "Focus trap in modal". When the modal opens, focus is not moved to the first focusable element. Keyboard users may tab to elements behind the overlay.

#### 🟡 MEDIUM

3. **Limit-reached modal: X and "Plus tard" both navigate away** [CreateTournament.tsx:267-294]  
   The X button calls `navigate("/")` — same as "Plus tard". Design-system 6.1 says "X closes". For a blocking limit modal, navigating away is acceptable, but the X has no `aria-label` describing the action. The button has `aria-label="Fermer"` — good.

4. **Player limit input: no debounce on validation** [CreateTournament.tsx:344-368]  
   `onBlur` triggers validation. If the user types "150" quickly and blurs, validation runs. Fine. But `onChange` does not clear the error when the user corrects — only `onBlur` re-validates. Minor UX: user might see stale error until blur.

5. **Missing test: limit-reached modal Escape key**  
   No test verifies Escape closes/dismisses the modal.

#### 🟢 LOW

6. **Magic number 10 in generateUniqueCode** [CreateTournament.tsx:167]  
   `maxAttempts = 10` — could be a named constant `MAX_CODE_GENERATION_ATTEMPTS` for clarity.

---

## Story 14-20: Player Profile Page

### AC Validation

| AC | Status | Evidence |
|----|--------|----------|
| 1. Header name + back | ✅ | ContextualHeader |
| 2. Avatar + info | ✅ | Avatar (img or initials), league name |
| 3. StatCards | ✅ | ELO, W/L, Win rate |
| 4. Streak card | ✅ | Positive/negative/zero, "En feu !" for streak ≥ 3 |
| 5. Sections | ✅ | ELO evolution, Stats par league, Head-to-head, Recent matches |
| 6. Bottom nav visible | ✅ | pb-bottom-nav lg:pb-bottom-nav-lg |
| 7. Frame 11 alignment | ✅ | Design tokens |

### Findings

#### 🔴 HIGH

1. **Avatar image: no error fallback** [PlayerProfile.tsx:374-382]  
   When `avatarUrl` is set but the image fails to load (404, CORS, etc.), the user sees a broken image. Project context: "Never expose technical errors to users". Add `onError` to fall back to initials.

2. **Recharts gradient ID collision risk** [PlayerProfile.tsx:369-391]  
   `id="eloGradient"` is hardcoded. If multiple PlayerProfile instances are ever mounted (e.g. in a list or during route transition), duplicate IDs in the DOM can cause SVG rendering issues. Use a unique ID per instance (e.g. `useId()`).

#### 🟡 MEDIUM

3. **MatchEnrichedDisplay not covered by 14-20 tests**  
   Story 14-20 completion notes say "MatchEnrichedDisplay added to Recent matches". The test file has no assertion that MatchEnrichedDisplay is rendered. Add a test that recent match cards include the enriched display (or at least that the component is present when match has photo/cups).

4. **loadPlayerEnrichment called even when fetchedPlayer has data** [PlayerProfile.tsx:131-144]  
   When `fetchedPlayer` exists, we already have `avatarUrl` and `joinedAt` from `loadPlayerById`. We still call `loadPlayerEnrichment` to get `userId` for ELO history. That's correct. But the effect runs whenever `player` changes — and `player` is reassigned from `fetchedPlayer.player`. The dependency `[playerId, player]` may cause extra runs when `player` reference changes. Consider depending on `player?.id` instead of `player` to reduce churn.

5. **headToHead useMemo: non-null assertion** [PlayerProfile.tsx:221-222]  
   `currentPlayer!.id` — if `currentPlayer` were null, this would throw. The logic ensures we only iterate when we have matches, but the type system doesn't guarantee `currentPlayer` is non-null inside the forEach. Safer: early return when `!currentPlayer`.

#### 🟢 LOW

6. **No test for "Membre depuis" display**  
   Story 14-35 added `formatJoinedSince`. The 14-20 tests don't cover it. The mock returns `joinedAt: null`. Add a test with `joinedAt` set to verify "Membre depuis" appears.

7. **No test for avatar with photo**  
   When `avatarUrl` is provided, the img is shown. No test verifies this path. Mock `loadPlayerEnrichment` to return `avatarUrl: "https://example.com/avatar.png"` and assert an img is present.

---

## Summary

| Severity | 14-19 | 14-20 |
|----------|-------|-------|
| HIGH | 2 | 2 |
| MEDIUM | 3 | 3 |
| LOW | 1 | 2 |
| **Total** | **6** | **7** |

---

## Recommended Actions

1. ~~**Fix HIGH issues**~~ — ✅ **DONE** (2026-02-13)
   - 14-19: Escape key handler + focus trap on Limit modal; `role="dialog"` + `aria-labelledby`
   - 14-20: Avatar `onError` → fallback to initials; Recharts gradient uses `useId()` for unique ID
2. **Fix MEDIUM issues** — Add tests, reduce effect churn, remove non-null assertion
3. **Fix LOW issues** — Constants, additional tests
