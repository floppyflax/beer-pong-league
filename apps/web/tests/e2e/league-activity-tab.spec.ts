/**
 * E2E Tests: League Activity Tab — 3 tabs (Activité / Classement / Stats)
 * + dual mode (Par event / Timeline) + persistance localStorage.
 *
 * Stratégie : on seed les ligues + events directement en localStorage
 * pour isoler la vérification de l'UI du LeagueActivityFeed sans dépendre
 * d'un flow Stripe/Auth complet.
 */

import { test, expect, type Page } from "@playwright/test";

const LEAGUE_ID = "lg-activity-e2e";
const EVENT_ID = "ev-activity-e2e";
const STORAGE_VIEW_MODE_KEY = "bpl_league_activity_view_mode";

async function seedLeague(page: Page, opts: { withEvent: boolean }) {
  await page.goto("/");
  await page.evaluate(
    ({ leagueId, eventId, withEvent }) => {
      localStorage.clear();
      const baseLeague = {
        id: leagueId,
        name: "Ligue E2E Activité",
        type: "season",
        createdAt: new Date().toISOString(),
        players: [
          {
            id: "p1",
            name: "Alice",
            elo: 1500,
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
            streak: 0,
          },
          {
            id: "p2",
            name: "Bob",
            elo: 1500,
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
            streak: 0,
          },
        ],
        matches: [],
        events: withEvent ? [eventId] : [],
      };
      localStorage.setItem("bpl_leagues", JSON.stringify([baseLeague]));
      if (withEvent) {
        const event = {
          id: eventId,
          name: "Tournoi E2E",
          date: new Date().toISOString(),
          format: "1v1",
          leagueId,
          createdAt: new Date().toISOString(),
          playerIds: ["p1", "p2"],
          matches: [
            {
              id: "m1",
              date: new Date().toISOString(),
              teamA: ["p1"],
              teamB: ["p2"],
              scoreA: 10,
              scoreB: 5,
            },
          ],
          isFinished: false,
          startedAt: new Date().toISOString(),
          pausedAt: null,
        };
        localStorage.setItem("bpl_events", JSON.stringify([event]));
      } else {
        localStorage.setItem("bpl_events", JSON.stringify([]));
      }
    },
    { leagueId: LEAGUE_ID, eventId: EVENT_ID, withEvent: opts.withEvent },
  );
}

test.describe("LeagueDashboard — Activity tab", () => {
  test("displays 3 tabs (Activité / Classement / Stats) and defaults to Activité", async ({
    page,
  }) => {
    await seedLeague(page, { withEvent: false });
    await page.goto(`/league/${LEAGUE_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("tab", { name: "Activité" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Classement" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Stats" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Events" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Matchs" })).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "Activité", selected: true }),
    ).toBeVisible();
  });

  test("hides the view mode switcher when the league has no events", async ({
    page,
  }) => {
    await seedLeague(page, { withEvent: false });
    await page.goto(`/league/${LEAGUE_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("tab", { name: "Par event" }),
    ).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Timeline" })).toHaveCount(0);
  });

  test("shows view mode switcher and defaults to 'Par event' when league has events", async ({
    page,
  }) => {
    await seedLeague(page, { withEvent: true });
    await page.goto(`/league/${LEAGUE_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("tab", { name: "Par event", selected: true }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();
    await expect(page.getByText("Tournoi E2E", { exact: false })).toBeVisible();
  });

  test("persists view mode switch across reloads", async ({ page }) => {
    await seedLeague(page, { withEvent: true });
    await page.goto(`/league/${LEAGUE_ID}`);
    await page.waitForLoadState("networkidle");

    // Bascule vers Timeline.
    await page.getByRole("tab", { name: "Timeline" }).click();
    await expect(
      page.getByRole("tab", { name: "Timeline", selected: true }),
    ).toBeVisible();

    // Sanity check : valeur stockée.
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_VIEW_MODE_KEY,
    );
    expect(stored).toBe("timeline");

    // Reload — la pref doit être conservée.
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("tab", { name: "Timeline", selected: true }),
    ).toBeVisible();
  });
});
