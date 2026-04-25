/**
 * Navigation Helper Functions
 *
 * These functions help determine the visibility and behavior of navigation components
 * across different routes and breakpoints.
 */

/**
 * Core routes where bottom nav should always be visible (design system 2.1).
 *
 * NOTE — action-oriented pages (modale-équivalent) masquent le BottomTabMenu :
 *   /join, /create-event, /create-league, /record-match.
 *
 * Ces écrans ont un CTA primaire qui doit rester seul en bas d'écran
 * (ex. "Rejoindre l'événement", "Créer", "Lancer la ligue") et leur propre
 * back button dans un header minimal. Le menu global reviendrait parasiter
 * la hiérarchie visuelle.
 */
const CORE_ROUTES = [
  "/",
  "/events",
  "/leagues",
  "/competitions",
  "/leaderboard",
  "/user/profile",
] as const;

/**
 * Route patterns for detail pages (bottom nav visible)
 * Canonical event/league detail routes — /tournament/* are kept as backward-compat redirects.
 */
const CORE_ROUTE_PATTERNS = [
  /^\/event\/[^/]+$/, // /event/:id (exclude /event/:id/display)
  /^\/event\/[^/]+\/invite$/, // /event/:id/invite
  /^\/event\/[^/]+\/join$/, // /event/:id/join
  /^\/league\/[^/]+$/, // /league/:id (exclude /league/:id/display)
  /^\/league\/[^/]+\/join$/, // /league/:id/join (mig 016 parity)
  /^\/player\/[^/]+$/, // /player/:id
];

/**
 * Excluded routes: Landing (handled by hasIdentity), Display views, Auth, payment, modals
 */
const EXCLUDED_PATTERNS = [
  /\/display/, // Display views (full-screen)
  /^\/auth\//, // Auth callback
  /^\/payment-success/, // Payment success
  /^\/payment-cancel/, // Payment cancel
  /^\/design-system/, // Dev tool (includes subpaths)
];

/**
 * Determines if the bottom menu should be visible for a given route.
 *
 * Bottom Menu Visibility Rules (design system 2.1, post refonte 4 onglets) :
 * - SHOW on core routes : /, /competitions, /leaderboard, /user/profile
 *   (+ /events, /leagues)
 * - SHOW on detail pages (lecture) : /event/:id, /league/:id, /player/:id
 * - HIDE on action pages (modale-équivalent) : /join, /create-event,
 *   /create-league, /auth/*, /display/*, /payment-*
 *
 * @param pathname - The current route pathname
 * @returns true if bottom menu should be visible, false otherwise
 */
export function shouldShowBottomMenu(pathname: string): boolean {
  // Exclusions first
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(pathname)) {
      return false;
    }
  }

  // Exact match for core routes
  if (CORE_ROUTES.includes(pathname as (typeof CORE_ROUTES)[number])) {
    return true;
  }

  // Detail page patterns
  for (const pattern of CORE_ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      return true;
    }
  }

  return false;
}

/**
 * Routes that historically rendered `BottomMenuSpecific` (secondary action bar)
 * on top of the global `BottomTabMenu` and needed extra bottom padding.
 *
 * Post-refonte : `/join` est maintenant modale-like (pas de BottomTabMenu),
 * donc plus besoin de padding empilé. La liste est vide mais l'export reste
 * pour compat (consumers existants).
 */
export const PAGES_WITH_SPECIFIC_MENU = [] as const;

/**
 * Returns the bottom padding class for scrollable content when bottom nav is visible.
 * Story 14-10 AC5: pb-20 or pb-24 for content clearance.
 * When BottomMenuSpecific is also shown (join, tournaments, leagues), extra padding needed.
 *
 * @param pathname - The current route pathname
 * @returns Tailwind class for padding-bottom (e.g. "pb-20 lg:pb-4") or empty string
 */
export function getContentPaddingBottom(pathname: string): string {
  if (!shouldShowBottomMenu(pathname)) {
    return "";
  }
  // BottomTabMenu = 64px (h-16). BottomMenuSpecific ≈ 80px when stacked.
  const hasSpecificMenu = (
    PAGES_WITH_SPECIFIC_MENU as readonly string[]
  ).includes(pathname);
  return hasSpecificMenu
    ? "pb-36 lg:pb-4" // Both menus: ~144px total
    : "pb-20 lg:pb-4"; // BottomTabMenu only: 80px clearance
}

/**
 * Determines if a back button should be shown in the header
 *
 * Back Button Visibility Rules:
 * - SHOW on pages with specific menu: /join
 * - SHOW on detail pages: /event/:id, /league/:id
 * - HIDE on main navigation pages: /, /user/profile
 * - HIDE on auth and display routes
 *
 * @param pathname - The current route pathname
 * @returns true if back button should be visible, false otherwise
 */
export function shouldShowBackButton(pathname: string): boolean {
  // Hide on display routes (full-screen)
  if (pathname.includes("/display")) {
    return false;
  }

  // Show on pages with specific menu
  if ((PAGES_WITH_SPECIFIC_MENU as readonly string[]).includes(pathname)) {
    return true;
  }

  // Show on detail pages
  if (pathname.startsWith("/event/") || pathname.startsWith("/league/")) {
    return true;
  }

  // Hide on main routes and special routes
  return false;
}

/**
 * Determines if the desktop sidebar should be shown based on the current pathname.
 *
 * Sidebar Visibility Rules:
 * - SHOW on all main pages: /, /join, /events, /leagues, /user/profile
 * - SHOW on detail pages: /event/:id, /league/:id
 * - HIDE on auth routes: /auth/*
 * - HIDE on display routes (full-screen): /display/*
 *
 * @param pathname - The current route pathname
 * @returns true if sidebar should be visible, false otherwise
 */
export function shouldShowSidebar(pathname: string): boolean {
  // Hide on auth routes
  if (pathname.includes("/auth")) {
    return false;
  }

  // Hide on display routes (full-screen views)
  if (pathname.includes("/display")) {
    return false;
  }

  // Show on all other routes (main pages, detail pages)
  return true;
}
