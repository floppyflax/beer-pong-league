# Code Review — Story 14-23: Join page (scan + code)

**Reviewer:** Senior Developer (AI)  
**Date:** 2026-02-13  
**Story:** 14-23-page-rejoindre-scan-code  
**Status:** Fixed (5 issues)

---

## Git vs Story Discrepancies

| Check                                | Result                                          |
| ------------------------------------ | ----------------------------------------------- |
| Files in story File List             | Join.tsx, BottomMenuSpecific.tsx, Join.test.tsx |
| Files in git diff (story scope)      | All 3 present ✓                                 |
| Files changed but not in story       | None for this story                             |
| Story lists files but no git changes | None                                            |

**Discrepancy count:** 0

---

## Issues Found

### 🔴 CRITICAL (1)

**1. Unhandled promise rejection when scan succeeds but join fails**

- **File:** `src/pages/Join.tsx:45`
- **Issue:** `handleScanCode` calls `handleJoinByCode(code)` without `await`. When the user scans a valid QR that extracts a code, but `joinByCode` fails (invalid code, network error, etc.), the error is an unhandled promise rejection. The scanner closes, the user sees no feedback.
- **Impact:** User scans → scanner closes → nothing happens. No toast, no modal, no error message.
- **Fix:** Make `handleScanCode` async, `await handleJoinByCode(code)`, and in `catch` either open `CodeInputModal` with the error or show a toast.

### 🟡 HIGH (2)

**2. Relative imports instead of path alias**

- **File:** `src/pages/Join.tsx:3-10`
- **Issue:** Uses `'../components/...'` instead of `'@/components/...'` per project-context: "Use `@/components/...` instead of `../components/...`"
- **Impact:** Inconsistent with other pages (CreateLeague, LeagueDashboard, PlayerProfile, etc. use `@/`).

**3. Tests use `any` in mock types**

- **File:** `tests/unit/pages/Join.test.tsx:17, 19, 29, 32, 41`
- **Issue:** Mocks use `({ actions }: any)`, `(action: any)`, etc. Project-context: "Never use `any` - use `unknown` if type is truly unknown"
- **Impact:** Bypasses TypeScript strict mode, masks type errors.

### 🟢 MEDIUM (2)

**4. No test for BottomMenuSpecific variant="gradient"**

- **File:** `tests/unit/pages/Join.test.tsx`
- **Issue:** BottomMenuSpecific is fully mocked, so we never verify that `variant="gradient"` is passed or that the design system gradient is applied.
- **Impact:** Design system alignment (Task 2) is not covered by tests.

**5. No test for error handling when joinByCode fails**

- **File:** `tests/unit/pages/Join.test.tsx`
- **Issue:** `joinByCode` is mocked to always resolve. No test for rejection (invalid code, network error).
- **Impact:** Error paths are untested.

### 🟢 LOW (2)

**6. Redundant test**

- **File:** `tests/unit/pages/Join.test.tsx:80-84`
- **Issue:** "should render large icon in empty state" asserts `getAllByText('Rejoindre un Tournoi')` — same as "should render page title". Does not actually verify the icon.
- **Impact:** Duplicate coverage, misleading test name.

**7. Outdated docblock AC numbering**

- **File:** `src/pages/Join.tsx:24-31`
- **Issue:** Docblock references AC1–AC7 from legacy story 4.1/10.4. Story 14-23 has a single AC (Frame 2 alignment).
- **Impact:** Documentation drift.

---

## Summary

| Severity  | Count |
| --------- | ----- |
| CRITICAL  | 1     |
| HIGH      | 2     |
| MEDIUM    | 2     |
| LOW       | 2     |
| **Total** | **7** |

---

## Fixes Applied (2026-02-13)

1. **CRITICAL**: `handleScanCode` now async, awaits `handleJoinByCode`, catches errors and shows toast + opens CodeInputModal
2. **HIGH**: All imports in Join.tsx use `@/` path alias
3. **HIGH**: Mocks use typed interfaces (BottomMenuAction, QRScannerProps, CodeInputModalProps)
4. **MEDIUM**: Added test for `variant="gradient"` on BottomMenuSpecific
5. **MEDIUM**: Added test for error handling when scan join fails (toast + modal)
6. **LOW**: Removed redundant "should render large icon" test
7. **LOW**: Updated docblock to Story 14-23
