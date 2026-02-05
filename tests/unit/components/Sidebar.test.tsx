import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../../../src/components/navigation/Sidebar';

// Mock dependencies
vi.mock('../../../src/context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

import { useAuthContext } from '../../../src/context/AuthContext';
import { useIdentity } from '../../../src/hooks/useIdentity';
import { useNavigate, useLocation } from 'react-router-dom';

describe('Sidebar', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any);
    vi.mocked(useIdentity).mockReturnValue({
      localUser: null,
    } as any);
  });

  describe('Sidebar Structure (AC1)', () => {
    it('should render sidebar with fixed left positioning', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('fixed');
      expect(aside).toHaveClass('left-0');
      expect(aside).toHaveClass('w-60'); // 240px
      expect(aside).toHaveClass('h-screen'); // Full height
      expect(aside).toHaveClass('bg-slate-800');
      expect(aside).toHaveClass('border-r');
      expect(aside).toHaveClass('border-slate-700');
    });

    it('should hide sidebar on mobile (responsive)', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('hidden');
      expect(aside).toHaveClass('lg:flex');
    });
  });

  describe('Navigation Items (AC2)', () => {
    it('should render 5 navigation items', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Rejoindre')).toBeInTheDocument();
      expect(screen.getByText('Tournois')).toBeInTheDocument();
      expect(screen.getByText('Leagues')).toBeInTheDocument();
      expect(screen.getByText('Profil')).toBeInTheDocument();
    });

    it('should render icons for each navigation item', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Check that there are SVG icons (lucide-react renders as SVG)
      const navButtons = container.querySelectorAll('nav button');
      expect(navButtons).toHaveLength(5);
      
      navButtons.forEach(button => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render items with proper text styling', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeSpan = screen.getByText('Home');
      expect(homeSpan).toHaveClass('text-sm');
    });
  });

  describe('Active State (AC3)', () => {
    it('should highlight Home when on / route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toHaveClass('bg-slate-700');
      expect(homeButton).toHaveClass('text-primary');
      expect(homeButton).toHaveClass('border-primary');
      expect(homeButton).toHaveClass('font-bold');
    });

    it('should highlight Rejoindre when on /join route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/join' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const joinButton = screen.getByText('Rejoindre').closest('button');
      expect(joinButton).toHaveClass('bg-slate-700');
      expect(joinButton).toHaveClass('text-primary');
    });

    it('should highlight Tournois when on /tournaments route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/tournaments' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const tournamentsButton = screen.getByText('Tournois').closest('button');
      expect(tournamentsButton).toHaveClass('bg-slate-700');
      expect(tournamentsButton).toHaveClass('text-primary');
    });

    it('should highlight Leagues when on /leagues route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/leagues' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const leaguesButton = screen.getByText('Leagues').closest('button');
      expect(leaguesButton).toHaveClass('bg-slate-700');
      expect(leaguesButton).toHaveClass('text-primary');
    });

    it('should highlight Profil when on /profile route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/profile' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const profileButton = screen.getByText('Profil').closest('button');
      expect(profileButton).toHaveClass('bg-slate-700');
      expect(profileButton).toHaveClass('text-primary');
    });

    it('should show inactive styling for non-active items', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const joinButton = screen.getByText('Rejoindre').closest('button');
      expect(joinButton).toHaveClass('text-slate-400');
      expect(joinButton).not.toHaveClass('bg-slate-700');
      expect(joinButton).not.toHaveClass('font-bold');
    });

    it('should have no active item on detail pages', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/tournament/123' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Home').closest('button');
      const joinButton = screen.getByText('Rejoindre').closest('button');

      expect(homeButton).toHaveClass('text-slate-400');
      expect(joinButton).toHaveClass('text-slate-400');
    });
  });

  describe('Navigation Behavior (AC4)', () => {
    it('should navigate to / when clicking Home', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Home');
      await user.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to /join when clicking Rejoindre', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const joinButton = screen.getByText('Rejoindre');
      await user.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith('/join');
    });

    it('should navigate to /tournaments when clicking Tournois', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const tournamentsButton = screen.getByText('Tournois');
      await user.click(tournamentsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/tournaments');
    });

    it('should navigate to /leagues when clicking Leagues', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const leaguesButton = screen.getByText('Leagues');
      await user.click(leaguesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/leagues');
    });

    it('should navigate to /profile when clicking Profil', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const profileButton = screen.getByText('Profil');
      await user.click(profileButton);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('User Info Section (AC5)', () => {
    it('should show user info when authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
      } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.getByText('test')).toBeInTheDocument(); // Email prefix
    });

    it('should hide user info when not authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.queryByText(/test/i)).not.toBeInTheDocument();
    });

    it('should show user info for anonymous user with local identity', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      vi.mocked(useIdentity).mockReturnValue({
        localUser: { anonymousUserId: 'anon-123', displayName: 'Player 1' },
      } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    it('should show premium badge when user is premium', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', isPremium: true } as any,
        isAuthenticated: true,
      } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.getByText('💎 Premium')).toBeInTheDocument();
    });

    it('should navigate to /profile when clicking user info', async () => {
      const user = userEvent.setup();

      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
      } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const userInfo = screen.getByText('test').closest('div');
      await user.click(userInfo!);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should truncate long email addresses', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { 
          id: 'user-1', 
          email: 'verylongemailaddress123456789@example.com'
        },
        isAuthenticated: true,
      } as any);

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const userNameDiv = container.querySelector('.truncate');
      expect(userNameDiv).toBeInTheDocument();
      expect(userNameDiv).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('should render navigation items as buttons', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should have hover states for navigation items', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const joinButton = screen.getByText('Rejoindre').closest('button');
      expect(joinButton).toHaveClass('hover:text-white');
      expect(joinButton).toHaveClass('hover:bg-slate-700/50');
    });

    it('should have transition animations', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toHaveClass('transition-all');
    });
  });
});
