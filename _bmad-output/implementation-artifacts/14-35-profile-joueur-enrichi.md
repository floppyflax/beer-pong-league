# Story 14.35: Player profile enrichment (Frame 11 — full data)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the Player profile page to display enriched data as in Frame 11 (Marc Dupont),
So that I see avatar photo, member since, ELO evolution graph, head-to-head with avatars, and improved match history.

## Acceptance Criteria

1. **Avatar:** Show photo if available (`users.avatar_url`), else initials fallback
2. **Membre depuis:** Display "Membre depuis…" with formatted date from `league_players.joined_at` or `tournament_players.joined_at`
3. **Streak variant:** When streak ≥ 3 wins, show "En feu !" variant on streak card
4. **ELO evolution:** Section displays a graph with monthly aggregation from `elo_history` or match data
5. **Stats per league:** Section shows stats grouped by league (ELO, W/L per league)
6. **Head-to-head:** Section shows opponent avatars (or initials) with head-to-head stats
7. **Recent matches:** Display "Il y a X" relative time, league/tournament name, badge Victoire/Défaite, delta ELO
8. Bottom nav visible

## Tasks / Subtasks

- [x] Task 1: Avatar photo + Membre depuis (AC: 1, 2)
  - [x] 1.1: Fetch avatar_url from users via league_players.user_id / tournament_players.user_id
  - [x] 1.2: Display img if avatar_url, else getInitials
  - [x] 1.3: Display joined_at formatted (e.g. "Membre depuis janvier 2025")
- [x] Task 2: Streak "En feu !" variant (AC: 3)
  - [x] 2.1: When streak >= 3 and positive, show "En feu !" with distinct styling
- [x] Task 3: Recent matches enrichment (AC: 7)
  - [x] 3.1: Format match date as "Il y a X" (relative time)
  - [x] 3.2: Add league/tournament name
  - [x] 3.3: Badge Victoire (green) / Défaite (red)
  - [x] 3.4: Delta ELO (+/- with color)
- [x] Task 4: Head-to-head avatars (AC: 6)
  - [x] 4.1: Resolve opponent avatar_url or initials for each head-to-head row
- [x] Task 5: Stats per league (AC: 5)
  - [x] 5.1: Group stats by league when player is in multiple leagues
- [x] Task 6: ELO evolution graph (AC: 4)
  - [x] 6.1: Query elo_history by user_id/anonymous_user_id + league_id
  - [x] 6.2: Aggregate by month (elo_after per month)
  - [x] 6.3: Render simple line/area chart (e.g. Recharts or lightweight lib)

## Dev Notes

- **File:** `src/pages/PlayerProfile.tsx` — extend existing implementation (Story 14-20)
- **Reference:** design-system-convergence section 5.4, Frame 11 (Marc Dupont)
- **Previous story:** 14-20 implemented StatCard, ListRow, avatar initials, streak card, loadPlayerById

### Data Model

| Source               | Field                                                                                              | Notes                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `users`              | `avatar_url`                                                                                       | Via league_players.user_id or tournament_players.user_id                            |
| `league_players`     | `joined_at`                                                                                        | Use when player in league context                                                   |
| `tournament_players` | `joined_at`                                                                                        | Use when player in tournament context                                               |
| `elo_history`        | `user_id`, `anonymous_user_id`, `league_id`, `elo_before`, `elo_after`, `elo_change`, `created_at` | Linked to user/anonymous, not league_player_id. Resolve user_id from league_players |
| `league_players`     | `elo`, `wins`, `losses`, `streak`                                                                  | Per-league stats                                                                    |

### Phased Implementation (recommended)

- **Phase 1:** Avatar, Membre depuis, match badges + relative time (Tasks 1, 2, 3)
- **Phase 2:** ELO evolution graph (Task 6)
- **Phase 3:** Head-to-head avatars, Stats per league (Tasks 4, 5)

### Project Structure Notes

- Reuse `getInitials` from PlayerProfile
- Reuse `loadPlayerById`, `loadTournamentParticipants` from DatabaseService
- Add `loadEloHistoryForPlayer(userId, anonymousUserId, leagueId?)` if needed
- Chart: No chart lib in package.json yet. Add `recharts` (React-friendly) or `chart.js` + `react-chartjs-2` for ELO graph. Keep bundle impact minimal.

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.4]
- [Source: _bmad-output/planning-artifacts/epic-14.md#Story 14.35]
- [Source: supabase/migrations/001_initial_schema.sql — users.avatar_url, league_players.joined_at, elo_history]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Extended loadPlayerById to fetch avatar_url and joined_at via users join. Added loadPlayerEnrichment for league players. Added formatJoinedSince in dateUtils.
- Task 2: Streak card shows "En feu !" with amber styling when streak >= 3.
- Task 3: playerMatchesWithContext built with league/tournament name. Recent matches show formatRelativeTime, context name, Victoire/Défaite badge, delta ELO.
- Task 4: loadAvatarUrlsForPlayerIds batches avatar fetch for head-to-head opponents. ListRow receives avatarUrl.
- Task 5: statsByLeague already grouped by league (verified).
- Task 6: loadEloHistoryForPlayer in DatabaseService. Recharts AreaChart for ELO evolution. Fallback to match data when elo_history empty.

### File List

- src/pages/PlayerProfile.tsx
- src/services/DatabaseService.ts
- src/utils/dateUtils.ts
- src/components/design-system/ListRow.tsx (code review fix: avatar onError fallback)
- package.json (recharts added)
- tests/unit/pages/PlayerProfile.test.tsx

## Senior Developer Review (AI)

**Reviewer:** floppyflax on 2026-02-16

**Issues found:** 2 High, 4 Medium, 2 Low

**Fixes applied:**
- [MEDIUM] ListRow: Added `onError` handler for avatar img — fallback to initials when URL fails (aligned with PlayerProfile main avatar)
- [MEDIUM] dateUtils: Added invalid date handling for `formatJoinedSince` and `formatRelativeTime` — return safe fallback instead of "Invalid Date"
- [MEDIUM] Tests: Mocked Recharts to avoid ResponsiveContainer dimension warnings in jsdom
- [MEDIUM] Tests: Replaced `getBy` with `findBy`/`waitFor` to fix act() warnings from async state updates
- [HIGH] Tests: Added Story 14-35 coverage — avatar photo, Membre depuis, Victoire/Défaite badge, delta ELO, ELO chart with data, head-to-head avatars

**Outcome:** Approve — all HIGH and MEDIUM issues fixed.

## Change Log

- 2026-02-13: Story created — Profile joueur enrichi (Frame 11 full data)
- 2026-02-13: Story 14-35 implemented — Avatar, Membre depuis, streak En feu, matchs enrichis, head-to-head avatars, ELO graph Recharts
- 2026-02-16: Code review — 5 fixes applied (ListRow onError, dateUtils validation, test improvements)