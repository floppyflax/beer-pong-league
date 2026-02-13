# Story 14.35: Player profile enrichment (Frame 11 — full data)

Status: ready-for-dev

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

- [ ] Task 1: Avatar photo + Membre depuis (AC: 1, 2)
  - [ ] 1.1: Fetch avatar_url from users via league_players.user_id / tournament_players.user_id
  - [ ] 1.2: Display img if avatar_url, else getInitials
  - [ ] 1.3: Display joined_at formatted (e.g. "Membre depuis janvier 2025")
- [ ] Task 2: Streak "En feu !" variant (AC: 3)
  - [ ] 2.1: When streak >= 3 and positive, show "En feu !" with distinct styling
- [ ] Task 3: Recent matches enrichment (AC: 7)
  - [ ] 3.1: Format match date as "Il y a X" (relative time)
  - [ ] 3.2: Add league/tournament name
  - [ ] 3.3: Badge Victoire (green) / Défaite (red)
  - [ ] 3.4: Delta ELO (+/- with color)
- [ ] Task 4: Head-to-head avatars (AC: 6)
  - [ ] 4.1: Resolve opponent avatar_url or initials for each head-to-head row
- [ ] Task 5: Stats per league (AC: 5)
  - [ ] 5.1: Group stats by league when player is in multiple leagues
- [ ] Task 6: ELO evolution graph (AC: 4)
  - [ ] 6.1: Query elo_history by user_id/anonymous_user_id + league_id
  - [ ] 6.2: Aggregate by month (elo_after per month)
  - [ ] 6.3: Render simple line/area chart (e.g. Recharts or lightweight lib)

## Dev Notes

- **File:** `src/pages/PlayerProfile.tsx` — extend existing implementation (Story 14-20)
- **Reference:** design-system-convergence section 5.4, Frame 11 (Marc Dupont)
- **Previous story:** 14-20 implemented StatCard, ListRow, avatar initials, streak card, loadPlayerById

### Data Model

| Source | Field | Notes |
|--------|-------|-------|
| `users` | `avatar_url` | Via league_players.user_id or tournament_players.user_id |
| `league_players` | `joined_at` | Use when player in league context |
| `tournament_players` | `joined_at` | Use when player in tournament context |
| `elo_history` | `user_id`, `anonymous_user_id`, `league_id`, `elo_before`, `elo_after`, `elo_change`, `created_at` | Linked to user/anonymous, not league_player_id. Resolve user_id from league_players |
| `league_players` | `elo`, `wins`, `losses`, `streak` | Per-league stats |

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

### File List

## Change Log

- 2026-02-13: Story created — Profile joueur enrichi (Frame 11 full data)
