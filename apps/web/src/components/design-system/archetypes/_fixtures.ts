/**
 * Fixture data for archetype mocks. Pure dummies — no fetch, no hooks.
 *
 * These shapes intentionally match (loosely) the production types so the
 * mocked components render the same JSX, but we don't import the real types
 * to avoid bringing context dependencies into the showcase.
 */

export const FIXTURE_PLAYERS = [
  { id: "p1", name: "Florian", elo: 1234, avatarUrl: null },
  { id: "p2", name: "Amar", elo: 1180, avatarUrl: null },
  { id: "p3", name: "Niko", elo: 1102, avatarUrl: null },
  { id: "p4", name: "Winnie", elo: 1051, avatarUrl: null },
  { id: "p5", name: "Marie", elo: 998, avatarUrl: null },
  { id: "p6", name: "Théo", elo: 942, avatarUrl: null },
];

export const FIXTURE_EVENT = {
  id: "t1",
  name: "Méchoui XIII",
  date: new Date().toISOString(),
  format: "2v2" as const,
  location: "Bordeaux",
  leagueId: "l1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  playerIds: FIXTURE_PLAYERS.map((p) => p.id),
  matches: [{}, {}, {}, {}, {}],
  isFinished: false,
  creator_user_id: "u1",
  creator_anonymous_user_id: null,
  anti_cheat_enabled: false,
} as const;

export const FIXTURE_LEAGUE_LIST_ITEM = {
  id: "l1",
  name: "Ligue Beer Pong de Bordeaux",
  status: "active" as const,
  member_count: 12,
  event_count: 4,
  creator_user_id: "u1",
  creator_anonymous_user_id: null,
  updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
};

export const FIXTURE_ACHIEVEMENT = {
  slug: "first_win",
  label: "Première victoire",
  description: "Tu as remporté ton tout premier match.",
  icon_key: "trophy",
  earned_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
};
