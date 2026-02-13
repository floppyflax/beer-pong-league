import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabMenu } from '../../../src/components/navigation/BottomTabMenu';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('BottomTabMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/';
  });

  describe('Component Structure (AC1)', () => {
    it('should render fixed bottom navigation', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('bottom-0');
      expect(nav).toHaveClass('left-0');
      expect(nav).toHaveClass('right-0');
    });

    it('should render 5 tabs', () => {
      render(<BottomTabMenu />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should display all tab labels', () => {
      render(<BottomTabMenu />);
      
      expect(screen.getByText('ACCUEIL')).toBeInTheDocument();
      expect(screen.getByText('REJOINDRE')).toBeInTheDocument();
      expect(screen.getByText('TOURNOIS')).toBeInTheDocument();
      expect(screen.getByText('LEAGUES')).toBeInTheDocument();
      expect(screen.getByText('PROFIL')).toBeInTheDocument();
    });

    it('should have proper navigation role', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('role', 'navigation');
    });
  });

  describe('Active Tab Highlight (AC2)', () => {
    it('should highlight home tab when on home route', () => {
      mockLocation.pathname = '/';
      render(<BottomTabMenu />);
      
      const homeButton = screen.getByLabelText('Home');
      expect(homeButton).toHaveClass('border-primary');
      expect(homeButton).toHaveClass('text-white');
    });

    it('should highlight join tab when on join route', () => {
      mockLocation.pathname = '/join';
      render(<BottomTabMenu />);
      
      const joinButton = screen.getByLabelText('Join');
      expect(joinButton).toHaveClass('border-primary');
      expect(joinButton).toHaveClass('text-white');
    });

    it('should highlight tournaments tab when on tournaments route', () => {
      mockLocation.pathname = '/tournaments';
      render(<BottomTabMenu />);
      
      const tournamentsButton = screen.getByLabelText('Tournaments');
      expect(tournamentsButton).toHaveClass('border-primary');
      expect(tournamentsButton).toHaveClass('text-white');
    });

    it('should highlight leagues tab when on leagues route', () => {
      mockLocation.pathname = '/leagues';
      render(<BottomTabMenu />);
      
      const leaguesButton = screen.getByLabelText('Leagues');
      expect(leaguesButton).toHaveClass('border-primary');
      expect(leaguesButton).toHaveClass('text-white');
    });

    it('should highlight profile tab when on profile route', () => {
      mockLocation.pathname = '/user/profile';
      render(<BottomTabMenu />);
      
      const profileButton = screen.getByLabelText('Profile');
      expect(profileButton).toHaveClass('border-primary');
      expect(profileButton).toHaveClass('text-white');
    });

    it('should show inactive style for non-active tabs', () => {
      mockLocation.pathname = '/';
      render(<BottomTabMenu />);
      
      const joinButton = screen.getByLabelText('Join');
      expect(joinButton).toHaveClass('border-transparent');
      expect(joinButton).toHaveClass('text-slate-400');
    });

    it('should have orange top border for active tab', () => {
      mockLocation.pathname = '/';
      render(<BottomTabMenu />);
      
      const homeButton = screen.getByLabelText('Home');
      expect(homeButton).toHaveClass('border-t-2');
      expect(homeButton).toHaveClass('border-primary');
    });
  });

  describe('Tab Navigation (AC3)', () => {
    it('should have 200ms transition duration for smooth navigation', () => {
      render(<BottomTabMenu />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('duration-200');
      });
    });

    it('should navigate to home when home tab clicked', () => {
      render(<BottomTabMenu />);
      
      const homeButton = screen.getByLabelText('Home');
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to join when join tab clicked', () => {
      render(<BottomTabMenu />);
      
      const joinButton = screen.getByLabelText('Join');
      fireEvent.click(joinButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/join');
    });

    it('should navigate to tournaments when tournaments tab clicked', () => {
      render(<BottomTabMenu />);
      
      const tournamentsButton = screen.getByLabelText('Tournaments');
      fireEvent.click(tournamentsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/tournaments');
    });

    it('should navigate to leagues when leagues tab clicked', () => {
      render(<BottomTabMenu />);
      
      const leaguesButton = screen.getByLabelText('Leagues');
      fireEvent.click(leaguesButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/leagues');
    });

    it('should navigate to profile when profile tab clicked', () => {
      render(<BottomTabMenu />);
      
      const profileButton = screen.getByLabelText('Profile');
      fireEvent.click(profileButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/user/profile');
    });
  });

  describe('Responsive Behavior (AC5)', () => {
    it('should be hidden on desktop (lg:hidden)', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('lg:hidden');
    });

    it('should be visible on mobile (no hidden class)', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      // Should not have md:hidden, sm:hidden, or standalone hidden classes
      // but lg:hidden is expected (hidden on desktop)
      const classList = Array.from(nav?.classList || []);
      expect(classList).not.toContain('hidden');
      expect(classList).not.toContain('md:hidden');
      expect(classList).not.toContain('sm:hidden');
      expect(classList).toContain('lg:hidden');
    });
  });

  describe('Touch Targets & Accessibility (AC6)', () => {
    it('should have aria-label for each tab', () => {
      render(<BottomTabMenu />);
      
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
      expect(screen.getByLabelText('Join')).toBeInTheDocument();
      expect(screen.getByLabelText('Tournaments')).toBeInTheDocument();
      expect(screen.getByLabelText('Leagues')).toBeInTheDocument();
      expect(screen.getByLabelText('Profile')).toBeInTheDocument();
    });

    it('should have aria-current="page" for active tab', () => {
      mockLocation.pathname = '/';
      render(<BottomTabMenu />);
      
      const homeButton = screen.getByLabelText('Home');
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not have aria-current for inactive tabs', () => {
      mockLocation.pathname = '/';
      render(<BottomTabMenu />);
      
      const joinButton = screen.getByLabelText('Join');
      expect(joinButton).not.toHaveAttribute('aria-current');
    });

    it('should have minimum height for touch targets', () => {
      render(<BottomTabMenu />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[48px]');
      });
    });

    it('should have tap feedback (scale down on active)', () => {
      render(<BottomTabMenu />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('active:scale-95');
      });
    });
  });

  describe('Visual Design', () => {
    it('should have proper z-index for overlay', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('z-40');
    });

    it('should have dark background', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('bg-slate-800');
    });

    it('should have top border', () => {
      const { container } = render(<BottomTabMenu />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-t');
      expect(nav).toHaveClass('border-slate-700');
    });

    it('should use uppercase labels', () => {
      render(<BottomTabMenu />);
      
      // All labels should be in uppercase
      expect(screen.getByText('ACCUEIL')).toBeInTheDocument();
      expect(screen.getByText('REJOINDRE')).toBeInTheDocument();
      expect(screen.getByText('TOURNOIS')).toBeInTheDocument();
      expect(screen.getByText('LEAGUES')).toBeInTheDocument();
      expect(screen.getByText('PROFIL')).toBeInTheDocument();
    });
  });
});
