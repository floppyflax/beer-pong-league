import { describe, it, expect } from 'vitest';
import {
  shouldShowBottomMenu,
  shouldShowBackButton,
  shouldShowSidebar,
} from '../../../src/utils/navigationHelpers';

describe('navigationHelpers', () => {
  describe('shouldShowBottomMenu', () => {
    it('should return true for home route', () => {
      expect(shouldShowBottomMenu('/')).toBe(true);
    });

    it('should return true for profile route', () => {
      expect(shouldShowBottomMenu('/profile')).toBe(true);
    });

    it('should return false for join route', () => {
      expect(shouldShowBottomMenu('/join')).toBe(false);
    });

    it('should return false for tournaments route', () => {
      expect(shouldShowBottomMenu('/tournaments')).toBe(false);
    });

    it('should return false for leagues route', () => {
      expect(shouldShowBottomMenu('/leagues')).toBe(false);
    });

    it('should return false for tournament detail pages', () => {
      expect(shouldShowBottomMenu('/tournament/123')).toBe(false);
      expect(shouldShowBottomMenu('/tournament/abc/display')).toBe(false);
    });

    it('should return false for league detail pages', () => {
      expect(shouldShowBottomMenu('/league/456')).toBe(false);
    });

    it('should return false for auth routes', () => {
      expect(shouldShowBottomMenu('/auth/callback')).toBe(false);
    });

    it('should return false for display routes', () => {
      expect(shouldShowBottomMenu('/tournament/123/display')).toBe(false);
    });

    it('should return false for unknown routes', () => {
      expect(shouldShowBottomMenu('/unknown')).toBe(false);
    });
  });

  describe('shouldShowBackButton', () => {
    it('should return false for home route', () => {
      expect(shouldShowBackButton('/')).toBe(false);
    });

    it('should return false for profile route', () => {
      expect(shouldShowBackButton('/profile')).toBe(false);
    });

    it('should return true for join route', () => {
      expect(shouldShowBackButton('/join')).toBe(true);
    });

    it('should return true for tournaments route', () => {
      expect(shouldShowBackButton('/tournaments')).toBe(true);
    });

    it('should return true for leagues route', () => {
      expect(shouldShowBackButton('/leagues')).toBe(true);
    });

    it('should return true for tournament detail pages', () => {
      expect(shouldShowBackButton('/tournament/123')).toBe(true);
      expect(shouldShowBackButton('/tournament/abc/invite')).toBe(true);
    });

    it('should return true for league detail pages', () => {
      expect(shouldShowBackButton('/league/456')).toBe(true);
    });

    it('should return false for auth routes', () => {
      expect(shouldShowBackButton('/auth/callback')).toBe(false);
    });

    it('should return false for display routes', () => {
      expect(shouldShowBackButton('/tournament/123/display')).toBe(false);
    });
  });

  describe('shouldShowSidebar', () => {
    it('should return true for home route', () => {
      expect(shouldShowSidebar('/')).toBe(true);
    });

    it('should return true for join route', () => {
      expect(shouldShowSidebar('/join')).toBe(true);
    });

    it('should return true for tournaments route', () => {
      expect(shouldShowSidebar('/tournaments')).toBe(true);
    });

    it('should return true for leagues route', () => {
      expect(shouldShowSidebar('/leagues')).toBe(true);
    });

    it('should return true for profile route', () => {
      expect(shouldShowSidebar('/profile')).toBe(true);
    });

    it('should return true for tournament detail pages', () => {
      expect(shouldShowSidebar('/tournament/123')).toBe(true);
      expect(shouldShowSidebar('/tournament/abc/invite')).toBe(true);
    });

    it('should return true for league detail pages', () => {
      expect(shouldShowSidebar('/league/456')).toBe(true);
    });

    it('should return false for auth routes', () => {
      expect(shouldShowSidebar('/auth/callback')).toBe(false);
      expect(shouldShowSidebar('/auth/something')).toBe(false);
    });

    it('should return false for display routes', () => {
      expect(shouldShowSidebar('/tournament/123/display')).toBe(false);
      expect(shouldShowSidebar('/league/456/display')).toBe(false);
    });

    it('should return true for unknown routes', () => {
      expect(shouldShowSidebar('/unknown')).toBe(true);
    });
  });
});
