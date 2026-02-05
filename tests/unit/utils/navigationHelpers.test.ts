import { describe, it, expect } from 'vitest';
import { shouldShowBottomMenu, shouldShowBackButton, shouldShowSidebar } from '../../../src/utils/navigationHelpers';

describe('shouldShowBottomMenu (Updated: Visibility Rules)', () => {
  describe('Should SHOW on main routes without specific menu', () => {
    it('should return true for home route', () => {
      expect(shouldShowBottomMenu('/')).toBe(true);
    });

    it('should return true for profile route', () => {
      expect(shouldShowBottomMenu('/profile')).toBe(true);
    });
  });

  describe('Should HIDE on pages with specific menu', () => {
    it('should return false for join route', () => {
      expect(shouldShowBottomMenu('/join')).toBe(false);
    });

    it('should return false for tournaments list route', () => {
      expect(shouldShowBottomMenu('/tournaments')).toBe(false);
    });

    it('should return false for leagues list route', () => {
      expect(shouldShowBottomMenu('/leagues')).toBe(false);
    });
  });

  describe('Should HIDE on detail pages', () => {
    it('should return false for tournament detail page', () => {
      expect(shouldShowBottomMenu('/tournament/123')).toBe(false);
    });

    it('should return false for league detail page', () => {
      expect(shouldShowBottomMenu('/league/456')).toBe(false);
    });

    it('should return false for tournament detail with subroutes', () => {
      expect(shouldShowBottomMenu('/tournament/123/participants')).toBe(false);
    });

    it('should return false for league detail with subroutes', () => {
      expect(shouldShowBottomMenu('/league/456/leaderboard')).toBe(false);
    });
  });

  describe('Should HIDE on auth routes', () => {
    it('should return false for auth callback', () => {
      expect(shouldShowBottomMenu('/auth/callback')).toBe(false);
    });

    it('should return false for auth routes', () => {
      expect(shouldShowBottomMenu('/auth')).toBe(false);
    });

    it('should return false for auth login', () => {
      expect(shouldShowBottomMenu('/auth/login')).toBe(false);
    });
  });

  describe('Should HIDE on display routes', () => {
    it('should return false for display view', () => {
      expect(shouldShowBottomMenu('/display/123')).toBe(false);
    });

    it('should return false for any display route', () => {
      expect(shouldShowBottomMenu('/display')).toBe(false);
    });
  });

  describe('Should HIDE on unknown routes', () => {
    it('should return false for unknown routes', () => {
      expect(shouldShowBottomMenu('/unknown')).toBe(false);
    });

    it('should return false for random paths', () => {
      expect(shouldShowBottomMenu('/something/else')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(shouldShowBottomMenu('')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle trailing slashes', () => {
      expect(shouldShowBottomMenu('/join/')).toBe(false);
      expect(shouldShowBottomMenu('/tournaments/')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(shouldShowBottomMenu('/Join')).toBe(false);
      expect(shouldShowBottomMenu('/TOURNAMENTS')).toBe(false);
    });
  });
});

describe('shouldShowBackButton (Back Button Visibility Rules)', () => {
  describe('Should SHOW on pages with specific menu', () => {
    it('should return true for join route', () => {
      expect(shouldShowBackButton('/join')).toBe(true);
    });

    it('should return true for tournaments route', () => {
      expect(shouldShowBackButton('/tournaments')).toBe(true);
    });

    it('should return true for leagues route', () => {
      expect(shouldShowBackButton('/leagues')).toBe(true);
    });
  });

  describe('Should SHOW on detail pages', () => {
    it('should return true for tournament detail page', () => {
      expect(shouldShowBackButton('/tournament/123')).toBe(true);
    });

    it('should return true for league detail page', () => {
      expect(shouldShowBackButton('/league/456')).toBe(true);
    });

    it('should return true for tournament detail subroutes', () => {
      expect(shouldShowBackButton('/tournament/123/participants')).toBe(true);
    });

    it('should return true for league detail subroutes', () => {
      expect(shouldShowBackButton('/league/456/leaderboard')).toBe(true);
    });
  });

  describe('Should HIDE on main navigation pages', () => {
    it('should return false for home route', () => {
      expect(shouldShowBackButton('/')).toBe(false);
    });

    it('should return false for profile route', () => {
      expect(shouldShowBackButton('/profile')).toBe(false);
    });
  });

  describe('Should HIDE on special routes', () => {
    it('should return false for auth routes', () => {
      expect(shouldShowBackButton('/auth')).toBe(false);
      expect(shouldShowBackButton('/auth/callback')).toBe(false);
    });

    it('should return false for display routes', () => {
      expect(shouldShowBackButton('/display')).toBe(false);
      expect(shouldShowBackButton('/display/123')).toBe(false);
    });

    it('should return false for unknown routes', () => {
      expect(shouldShowBackButton('/unknown')).toBe(false);
    });
  });

  describe('shouldShowSidebar', () => {
    it('should return true for main routes', () => {
      expect(shouldShowSidebar('/')).toBe(true);
      expect(shouldShowSidebar('/profile')).toBe(true);
    });

    it('should return true for join, tournaments, leagues routes', () => {
      expect(shouldShowSidebar('/join')).toBe(true);
      expect(shouldShowSidebar('/tournaments')).toBe(true);
      expect(shouldShowSidebar('/leagues')).toBe(true);
    });

    it('should return true for detail pages', () => {
      expect(shouldShowSidebar('/tournament/123')).toBe(true);
      expect(shouldShowSidebar('/league/456')).toBe(true);
    });

    it('should return false for auth routes', () => {
      expect(shouldShowSidebar('/auth')).toBe(false);
      expect(shouldShowSidebar('/auth/callback')).toBe(false);
      expect(shouldShowSidebar('/auth/login')).toBe(false);
    });

    it('should return false for display routes', () => {
      expect(shouldShowSidebar('/display')).toBe(false);
      expect(shouldShowSidebar('/display/123')).toBe(false);
      expect(shouldShowSidebar('/tournament/123/display')).toBe(false);
    });

    it('should return true for unknown routes (default show)', () => {
      expect(shouldShowSidebar('/unknown')).toBe(true);
      expect(shouldShowSidebar('/random-page')).toBe(true);
    });
  });
});
