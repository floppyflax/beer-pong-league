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
      expect(aside).toHaveClass('bg-navy-soft');
      expect(aside).toHaveClass('border-r');
      expect(aside).toHaveClass('border-card');
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
    it('should render 4 navigation items (Accueil · Jouer · Classement · Profil)', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Jouer')).toBeInTheDocument();
      expect(screen.getByText('Stats')).toBeInTheDocument();
      expect(screen.getByText('Profil')).toBeInTheDocument();
    });

    it('should NOT render a "Rejoindre" nav item (it is a page, not a menu entry)', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(screen.queryByText('Rejoindre')).not.toBeInTheDocument();
    });

    it('should render icons for each navigation item', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Check that there are SVG icons (lucide-react renders as SVG)
      const navButtons = container.querySelectorAll('nav button');
      expect(navButtons).toHaveLength(4);

      navButtons.forEach((button) => {
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

      const homeSpan = screen.getByText('Accueil');
      expect(homeSpan).toHaveClass('text-sm');
    });
  });

  describe('Active State (AC3)', () => {
    it('should highlight Accueil when on / route (electric-blue)', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Accueil').closest('button');
      expect(homeButton).toHaveClass('bg-navy-deep');
      expect(homeButton).toHaveClass('text-electric-blue');
      expect(homeButton).toHaveClass('border-electric-blue');
      expect(homeButton).toHaveClass('font-bold');
    });

    it('should highlight Jouer when on /join route (Rejoindre sits inside Jouer)', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/join' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('bg-navy-deep');
      expect(playButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Jouer when on /events route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/events' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('bg-navy-deep');
      expect(playButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Jouer when on legacy /leagues route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/leagues' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('bg-navy-deep');
      expect(playButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Jouer when on /competitions route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/competitions' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Stats when on /stats route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/stats' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const statsButton = screen.getByText('Stats').closest('button');
      expect(statsButton).toHaveClass('bg-navy-deep');
      expect(statsButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Profil when on /user/profile route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/user/profile' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const profileButton = screen.getByText('Profil').closest('button');
      expect(profileButton).toHaveClass('bg-navy-deep');
      expect(profileButton).toHaveClass('text-electric-blue');
    });

    it('should highlight Profil on legacy /profile route', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/profile' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const profileButton = screen.getByText('Profil').closest('button');
      expect(profileButton).toHaveClass('text-electric-blue');
    });

    it('should show inactive styling for non-active items', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('text-cool-gray');
      expect(playButton).not.toHaveClass('bg-navy-deep');
      expect(playButton).not.toHaveClass('font-bold');
    });

    it('should highlight Jouer on event detail pages (nested)', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/event/123' } as any);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('text-electric-blue');
    });
  });

  describe('Navigation Behavior (AC4)', () => {
    it('should navigate to / when clicking Accueil', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Accueil');
      await user.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to /competitions when clicking Jouer', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer');
      await user.click(playButton);

      expect(mockNavigate).toHaveBeenCalledWith('/competitions');
    });

    it('should navigate to /stats when clicking Stats', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const statsButton = screen.getByText('Stats');
      await user.click(statsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/stats');
    });

    it('should navigate to /user/profile when clicking Profil', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const profileButton = screen.getByText('Profil');
      await user.click(profileButton);

      expect(mockNavigate).toHaveBeenCalledWith('/user/profile');
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
        localUser: { anonymousUserId: 'anon-123', pseudo: 'Player 1' },
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
          email: 'verylongemailaddress123456789@example.com',
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

      const homeButton = screen.getByText('Accueil').closest('button');
      expect(homeButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should have hover states for navigation items', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const playButton = screen.getByText('Jouer').closest('button');
      expect(playButton).toHaveClass('hover:text-white');
      expect(playButton).toHaveClass('hover:bg-navy-deep/50');
    });

    it('should have transition animations', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const homeButton = screen.getByText('Accueil').closest('button');
      expect(homeButton).toHaveClass('transition-all');
    });
  });
});
