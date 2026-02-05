import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { 
  NavigationProvider, 
  useNavigation 
} from '../../../src/context/NavigationContext';
import { ReactNode } from 'react';

// Mock the useBreakpoint hook
vi.mock('../../../src/hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(() => 'mobile'),
  useIsMobile: vi.fn(() => true),
  useIsDesktop: vi.fn(() => false),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useBreakpoint, useIsMobile, useIsDesktop } from '../../../src/hooks/useBreakpoint';

describe('NavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NavigationProvider', () => {
    it('should render children', () => {
      render(
        <NavigationProvider>
          <div data-testid="child">Test Child</div>
        </NavigationProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default navigation context values', () => {
      vi.mocked(useBreakpoint).mockReturnValue('mobile');
      vi.mocked(useIsMobile).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(false);

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.activeTab).toBe('home');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.showBackButton).toBe(false);
      expect(typeof result.current.setActiveTab).toBe('function');
      expect(typeof result.current.onBack).toBe('function');
    });
  });

  describe('useNavigation hook', () => {
    it('should throw error when used outside of NavigationProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useNavigation());
      }).toThrow('useNavigation must be used within a NavigationProvider');

      console.error = originalError;
    });

    it('should return navigation context when used inside provider', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(false);

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.activeTab).toBe('home');
    });
  });

  describe('Active Tab Management', () => {
    it('should allow changing active tab', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.activeTab).toBe('home');

      act(() => {
        result.current.setActiveTab('tournaments');
      });

      expect(result.current.activeTab).toBe('tournaments');
    });

    it('should support all valid tab values', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      const validTabs = ['home', 'join', 'tournaments', 'leagues', 'profile'];

      validTabs.forEach(tab => {
        act(() => {
          result.current.setActiveTab(tab);
        });
        expect(result.current.activeTab).toBe(tab);
      });
    });
  });

  describe('Back Button Management', () => {
    it('should have showBackButton false by default', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.showBackButton).toBe(false);
    });

    it('should provide onBack callback', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(typeof result.current.onBack).toBe('function');
      
      // Should not throw when called
      expect(() => {
        act(() => {
          result.current.onBack();
        });
      }).not.toThrow();
    });
  });

  describe('Breakpoint Integration', () => {
    it('should track mobile breakpoint', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(false);

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should track desktop breakpoint', () => {
      vi.mocked(useIsMobile).mockReturnValue(false);
      vi.mocked(useIsDesktop).mockReturnValue(true);

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('should update when breakpoint changes', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(false);

      const { result, rerender } = renderHook(() => useNavigation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);

      // Simulate breakpoint change
      vi.mocked(useIsMobile).mockReturnValue(false);
      vi.mocked(useIsDesktop).mockReturnValue(true);

      rerender();

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });
});
