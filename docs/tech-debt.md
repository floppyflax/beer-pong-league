# Tech debt & follow-up backlog

Living register of known debt items, deferred chantiers, and admin tasks
that surfaced from the audit cycle landed in main between commits
[`cb80fff`](https://github.com/floppyflax/beer-pong-league/commit/cb80fff)
(audit wave 1) and [`752c5d8`](https://github.com/floppyflax/beer-pong-league/commit/752c5d8)
(skills sync) — May 2026.

This file is the **single source of truth** for "what's left after the
audit" so we don't have to reread chat transcripts or PR descriptions to
remember what's outstanding. Update it when a chantier is picked up,
when a new debt item is discovered, or when scope shifts.

## Convention

- 🔴 **Critical** — security or data-integrity gap. Pick first when
  surface increases (public ranking, mobile launch, …).
- 🟠 **Major** — DX / maintainability / scalability. Worth a sprint.
- 🟡 **Minor** — polish, naming, dead code. Pick during slow weeks.

Each item links to the trigger skill (cf. [`.claude/skills/`](../.claude/skills/))
that captures the relevant pattern, so picking it up doesn't require
re-discovering conventions.

---

## Admin tasks — user only

These don't live in the codebase, the user has to do them from
GitHub / Supabase consoles. Listed first because they're the cheapest
wins.

| # | 🔴/🟠/🟡 | Task | Where | Why |
|---|---|---|---|---|
| **U1** | 🟠 | Add GitHub secrets `E2E_SUPABASE_URL` + `E2E_SUPABASE_PUBLIC_KEY` | github.com/floppyflax/beer-pong-league/settings/secrets/actions | Without them, `e2e-nightly.yml` fails every night. Use a staging Supabase instance (NOT prod). |
| **U2** | 🟠 | Set Supabase secret `STRIPE_ALLOWED_PRICE_IDS=price_xxx` (csv) | `supabase secrets set …` or Vault tab | The hardened `create-checkout-session` falls open if this is empty. Currently a config gap, not a code gap. |
| **U3** | 🟡 | Push a "ping CI" PR to confirm the workflow is green on `main` | New branch + PR | Validates the CI we just bootstrapped (lint + unit + integration + build). |
| **U4** | 🟠 | Enable branch protection on `main` (require PR + status checks) | GitHub → Settings → Branches | Régime de croisière sain. Whitelister owner pour hotfix possible. |

---

## Code debt — engineering

Severity, scope and the trigger skill that holds the pattern.

### 🔴 Security gaps

#### A. RLS hardening on `elo_history` / `*_memberships`

- **Why critical**: post mig 025, the honest write path goes through
  `apply_match_elo` (SECURITY DEFINER, anti-replay, server-side calc).
  But the **direct write path is still open** — RLS policies on
  `elo_history`, `league_memberships`, `event_memberships` allow any
  authenticated client to `INSERT` / `UPDATE` arbitrary rows. A
  malicious client can still spoof an ELO by bypassing the RPC.
- **Surface to look at**: existing policies are `lm_all` /
  `em_all` / `Anyone can read elo history` / `Anyone can insert elo
  history`. They date from the pre-mig-025 era when the client was the
  source of truth.
- **Approach**: new migration `NNN_lock_down_elo_writes.sql` that
  rewrites those policies to `WITH CHECK (false)` for INSERT/UPDATE on
  the stat columns, and relies entirely on the SECURITY DEFINER
  functions for legitimate writes. Allow `pseudo_override` / `joined_at`
  / `archived_at` updates by the row owner.
- **Skill**: [`postgres-rpc`](../.claude/skills/postgres-rpc/SKILL.md),
  [`supabase-migrations`](../.claude/skills/supabase-migrations/SKILL.md).
- **Effort**: 1 migration + a tweak to `MatchAdminService` if any code
  was relying on direct UPDATE outside the RPC. ~½ day.

#### H. Harden `verify-payment-session` edge function

- **Why critical**: `create-checkout-session` was hardened in audit
  wave 1.2 (Bearer JWT + Zod + whitelist). Its sibling
  `verify-payment-session` is still on the pre-hardening pattern — no
  JWT check, no Zod, trusts `sessionId` from the body.
- **Surface**: `supabase/functions/verify-payment-session/index.ts`.
- **Approach**: copy the pattern from `create-checkout-session/index.ts`,
  validate the Stripe session belongs to the user's `customer_email`
  before flipping `users.is_premium`.
- **Skill**: [`edge-function`](../.claude/skills/edge-function/SKILL.md),
  [`stripe-premium`](../.claude/skills/stripe-premium/SKILL.md).
- **Effort**: ~½ day. Fast because `edge-function` skill has the full
  skeleton.

### 🟠 DX & maintainability

#### B. Wave 2.2 step 2+ — migrate `useLeague` callers to facade hooks

- **Why**: audit wave 2.2 step 1 introduced `useLeagues` / `useEvents` /
  `usePlayers` / `useMatches` as facades over the 1157-line
  `LeagueContext`. The 22 existing call sites still consume the
  umbrella `useLeague()` directly. As long as that's true, we can't
  split the provider into 4 dedicated providers.
- **Surface**: 22 files call `useLeague()` directly (cf. `grep -rln
  "useLeague\b" apps/web/src`). Pages: `RecordMatch.tsx`,
  `EventDashboard.tsx`, `LeagueDashboard.tsx`, `DesignSystemShowcase.tsx`,
  `CreateEvent.tsx`, `EventInvite.tsx`, `UserProfile.tsx`,
  `PlayerProfile.tsx`, …
- **Approach**: 1 PR per page. Replace `useLeague()` destructuring with
  the relevant focused hook(s). Update mocks in the matching `*.test.tsx`.
  Once a domain has zero direct umbrella callers, split the provider
  (phase C of the migration plan in the skill).
- **Skill**: [`context-facade`](../.claude/skills/context-facade/SKILL.md).
- **Effort**: ~3-5 PRs, 2-4 h each. Spread across feature work — touch
  `useLeague` only when you're already in the file.

#### C. Wave 2.3 — extract business layer into `packages/shared`

- **Why**: today `packages/shared/src/` only holds types + a few utils.
  Services (`AuthService`, `IdentityMergeService`, `EloRecalcService`,
  `PremiumService`) and repositories live in `apps/web/src/services/`
  exclusively. **The mobile app cannot reuse them**, which is why
  `apps/mobile/` is currently a UI shell with no working backend wiring.
- **Surface**: `apps/web/src/services/{Auth,IdentityMerge,EloRecalc,Premium,Stripe}Service.ts`,
  `apps/web/src/services/repositories/*`, `apps/web/src/utils/elo.ts`.
  Move to `packages/shared/src/services/` + `packages/shared/src/utils/`.
- **Approach**: extract one service at a time, update web import paths
  via the `@elofight/shared` alias, run tests, repeat. The repositories
  pattern is already split (`_base.ts` exports an abstract class) so
  they're the easiest first move.
- **Skill**: none specific (general TS refactor).
- **Effort**: ~1 sprint full-time, or 2-3 weeks parallel to features.
  Pre-requisite for chantier F (mobile).

#### D. Wave 3.1 — unify `design-system/` and `ponglo/`

- **Why**: two design-system folders coexist with duplicates
  (`Avatar` / `PAvatar`, `Button` / `PButton`, `FAB`, …). Confusing for
  contributors, no rule arbitrates which to use, the showcase mixes
  both.
- **Surface**: `apps/web/src/components/design-system/` (~30 files) +
  `apps/web/src/components/ponglo/` (~12 files).
- **Approach**: ⚠️ **DS work — needs user validation item-by-item**.
  Probably : keep `ponglo/` for branded primitives (Wordmark, glyph,
  PRankBadge), fold the rest into `design-system/` with prefix
  convention. Update showcase. Migrate import paths.
- **Skill**: [`ui-component`](../.claude/skills/ui-component/SKILL.md).
- **Effort**: 2-3 PRs, ~1 day each. **Requires explicit user sign-off**
  on the chosen split because it touches the visible design surface.

#### E. Wave 3.2 — split giant pages

- **Why**: 4 pages exceed 600 LOC, hard to navigate, hard to test.
- **Surface**:
  - `RecordMatch.tsx` — 1286 lines.
  - `EventDashboard.tsx` — 982 lines.
  - `LeagueDashboard.tsx` — 798 lines.
  - `CreateEvent.tsx` — 679 lines.
- **Approach**: extract by responsibility (form section, ranking
  section, match list, sticky CTA, modals). Keep the page as the
  composition root.
- **Skill**: [`ui-component`](../.claude/skills/ui-component/SKILL.md).
- **Effort**: 1 PR per page. **Requires user validation** because the
  visual diff is wide (many props moved around).

### 🟡 Polish

#### F. Wave 3.3 — wire mobile to the business layer

- Depends on chantier C. Today `apps/mobile/` is 15 screens with
  hardcoded fixtures.
- **Effort**: 1-2 weeks once C is done.

#### G. Wave 3.5 — finish `tournaments` → `events` rename

- Mig 024 renamed the DB but a few code-side references remain in
  comments, variable names, leftover function names. Cosmetic, but
  reduces grep confusion.
- **Surface**: `grep -rn 'tournament' apps/web/src` gives ~50 hits to
  triage (some are legitimate — comments mentioning the historical
  rename, etc.).
- **Effort**: ~½ day, mostly find-and-replace + careful review.

---

## Test coverage gaps

Closed during wave 3.4 partial: 85 stale tests deleted/fixed. **Still
open**: services and repositories have no direct unit-test coverage,
they're exercised only through page-level integration tests. Items:

- Direct unit tests for `AuthService`, `IdentityMergeService`,
  `EloRecalcService`, `PremiumService`, `StripeService`, and each
  repository (`PlayersRepository`, `EventsRepository`,
  `LeaguesRepository`, `MatchesRepository`).
- Tracking ticket: not blocking, but expect to add tests progressively
  as services move into `packages/shared` (chantier C) — that's the
  natural moment to write tests against a stable boundary.
- **Skill**: [`e2e-test`](../.claude/skills/e2e-test/SKILL.md).

---

## Maintenance of this doc

- When a chantier is **picked up**, move it to a "🟢 In progress"
  section at the top until merged.
- When **merged**, delete the entry (the commit log + PR are the
  permanent record).
- When **new debt** is discovered (during a feature, a review, or an
  outage), add it under the right severity bucket with a 2-3 line
  description, surface, approach, and the trigger skill.
- Don't let this file grow past ~300 lines — if it does, the project
  has too much known debt and we need to schedule a sprint.

The companion skill for the maintenance discipline is
[`doc-curator`](../.claude/skills/doc-curator/SKILL.md).
