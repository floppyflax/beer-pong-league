/**
 * Navigation Helper Functions
 *
 * These functions help determine the visibility and behavior of navigation components
 * across different routes and breakpoints.
 */

/**
 * Core routes where bottom nav should always be visible (design system 2.1)
 */
const CORE_ROUTES = [
  "/",
  "/join",
  "/tournaments",
  "/leagues",
  "/user/profile",
] as const;

/**
 * Route patterns for detail pages (bottom nav visible)
 * Story 14-14: /tournament/:id/invite and /tournament/:id/join show bottom nav (design-system 5.5)
 */
const CORE_ROUTE_PATTERNS = [
  /^\/tournament\/[^/]+$/, // /tournament/:id (exclude /tournament/:id/display)
  /^\/tournament\/[^/]+\/invite$/, // /tournament/:id/invite
  /^\/tournament\/[^/]+\/join$/, // /tournament/:id/join
  /^\/league\/[^/]+$/, // /league/:id (exclude /league/:id/display)
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
 * Determines if the bottom menu should be visible for a given route
 *
 * Bottom Menu Visibility Rules (Story 14-10, design system 2.1):
 * - SHOW on core routes: /, /join, /tournaments, /leagues, /user/profile
 * - SHOW on detail pages: /tournament/:id, /league/:id, /player/:id
 * - HIDE on exclusions: Display views (/display/*), Auth (/auth/*), payment, modals
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

/** Routes that use BottomMenuSpecific (action bar) - need extra padding when visible */
/** Story 14-12: /tournaments uses FAB instead of BottomMenuSpecific */
/** Story 14-16: /leagues uses FAB instead of BottomMenuSpecific */
export const PAGES_WITH_SPECIFIC_MENU = ["/join"] as const;

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
 * - SHOW on detail pages: /tournament/:id, /league/:id
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
  if (pathname.startsWith("/tournament/") || pathname.startsWith("/league/")) {
    return true;
  }

  // Hide on main routes and special routes
  return false;
}

/**
 * Determines if the desktop sidebar should be shown based on the current pathname.
 *
 * Sidebar Visibility Rules:
 * - SHOW on all main pages: /, /join, /tournaments, /leagues, /user/profile
 * - SHOW on detail pages: /tournament/:id, /league/:id
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
