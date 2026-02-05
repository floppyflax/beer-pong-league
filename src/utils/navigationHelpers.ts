/**
 * Navigation Helper Functions
 * 
 * These functions help determine the visibility and behavior of navigation components
 * across different routes and breakpoints.
 */

/**
 * Determines if the bottom menu should be visible for a given route
 * 
 * Bottom Menu Visibility Rules (Updated):
 * - SHOW on main routes: /, /profile
 * - HIDE on pages with specific menu: /join, /tournaments, /leagues
 * - HIDE on detail pages: /tournament/:id, /league/:id
 * - HIDE on auth routes: /auth/*
 * - HIDE on display routes: /display/*
 * - HIDE on unknown routes
 * 
 * @param pathname - The current route pathname
 * @returns true if bottom menu should be visible, false otherwise
 */
export function shouldShowBottomMenu(pathname: string): boolean {
  // Pages with context-specific menu - hide bottom tab menu to avoid overlap
  const specificMenuRoutes = ['/join', '/tournaments', '/leagues'];
  if (specificMenuRoutes.includes(pathname)) {
    return false;
  }
  
  // Main routes where bottom tab menu should be visible
  const mainRoutes = ['/', '/profile'];
  
  // Exact match for main routes
  if (mainRoutes.includes(pathname)) {
    return true;
  }
  
  // Hide on all other routes:
  // - Detail pages (/tournament/*, /league/*)
  // - Auth routes (/auth/*)
  // - Display routes (/display/*)
  // - Unknown routes
  return false;
}

/**
 * Determines if a back button should be shown in the header
 * 
 * Back Button Visibility Rules:
 * - SHOW on pages with specific menu: /join, /tournaments, /leagues
 * - SHOW on detail pages: /tournament/:id, /league/:id
 * - HIDE on main navigation pages: /, /profile
 * - HIDE on auth and display routes
 * 
 * @param pathname - The current route pathname
 * @returns true if back button should be visible, false otherwise
 */
export function shouldShowBackButton(pathname: string): boolean {
  // Show on pages with specific menu (they don't have bottom tab menu)
  const specificMenuRoutes = ['/join', '/tournaments', '/leagues'];
  if (specificMenuRoutes.includes(pathname)) {
    return true;
  }
  
  // Show on detail pages
  if (pathname.startsWith('/tournament/') || pathname.startsWith('/league/')) {
    return true;
  }
  
  // Hide on main routes and special routes
  return false;
}

/**
 * Determines if the desktop sidebar should be shown based on the current pathname.
 * 
 * Sidebar Visibility Rules:
 * - SHOW on all main pages: /, /join, /tournaments, /leagues, /profile
 * - SHOW on detail pages: /tournament/:id, /league/:id
 * - HIDE on auth routes: /auth/*
 * - HIDE on display routes (full-screen): /display/*
 * 
 * @param pathname - The current route pathname
 * @returns true if sidebar should be visible, false otherwise
 */
export function shouldShowSidebar(pathname: string): boolean {
  // Hide on auth routes
  if (pathname.includes('/auth')) {
    return false;
  }
  
  // Hide on display routes (full-screen views)
  if (pathname.includes('/display')) {
    return false;
  }
  
  // Show on all other routes (main pages, detail pages)
  return true;
}
