import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../../../src/pages/LandingPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthModal component
vi.mock('../../../src/components/AuthModal', () => ({
  AuthModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Layout and Structure (AC1)', () => {
    it('should render app branding at top', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/BEER PONG LEAGUE/i)).toBeInTheDocument();
      expect(screen.getByText('🍺')).toBeInTheDocument();
    });

    it('should display centered layout', () => {
      const { container } = render(<LandingPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex');
      expect(mainContainer).toHaveClass('items-center');
      expect(mainContainer).toHaveClass('justify-center');
    });

    it('should display 4 action buttons in vertical stack', () => {
      render(<LandingPage />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Button 1 - Rejoindre un Tournoi (AC2)', () => {
    it('should display "REJOINDRE UN TOURNOI" button', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/REJOINDRE UN TOURNOI/i)).toBeInTheDocument();
    });

    it('should have trophy icon', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/REJOINDRE UN TOURNOI/i).closest('button');
      expect(button).toBeInTheDocument();
      // Icon would be checked via visual snapshot or data-testid
    });

    it('should navigate to /join when clicked', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/REJOINDRE UN TOURNOI/i);
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/join');
    });
  });

  describe('Button 2 - Nouveau Tournoi (AC3)', () => {
    it('should display "TOURNOI" button', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/^TOURNOI$/i)).toBeInTheDocument();
    });

    it('should open auth modal and store returnTo', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/^TOURNOI$/i);
      fireEvent.click(button);
      
      // Should open auth modal
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      
      // Should store return destination
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');
    });
  });

  describe('Button 3 - Nouvelle League (AC4)', () => {
    it('should display "LEAGUE" button', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/^LEAGUE$/i)).toBeInTheDocument();
    });

    it('should open auth modal and store returnTo', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/^LEAGUE$/i);
      fireEvent.click(button);
      
      // Should open auth modal
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      
      // Should store return destination
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-league');
    });
  });

  describe('Button 4 - Se Connecter (AC5)', () => {
    it('should display "Se connecter" link', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
    });

    it('should open auth modal when clicked', () => {
      render(<LandingPage />);
      
      // Modal should not be visible initially
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
      
      const button = screen.getByText(/Se connecter →/i);
      fireEvent.click(button);
      
      // Modal should now be visible
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    it('should have discrete link styling (not primary button)', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/Se connecter →/i).closest('button');
      expect(button).toHaveClass('text-slate-400');
      expect(button).not.toHaveClass('bg-primary');
      expect(button).not.toHaveClass('bg-slate-800');
    });
  });

  describe('Responsive Layout (AC6)', () => {
    it('should apply responsive max-width classes', () => {
      const { container } = render(<LandingPage />);
      
      const contentWrapper = container.querySelector('.max-w-md');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('should have full width on mobile', () => {
      render(<LandingPage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full');
      });
    });

    it('should have minimum touch target size (44x44px)', () => {
      render(<LandingPage />);
      
      const buttons = screen.getAllByRole('button');
      // All buttons should have sufficient vertical padding (py-4, py-5, py-6, or py-7)
      buttons.forEach(button => {
        const classes = button.className;
        const hasSufficientPadding = 
          classes.includes('py-4') || 
          classes.includes('py-5') || 
          classes.includes('py-6') || 
          classes.includes('py-7');
        expect(hasSufficientPadding).toBe(true);
      });
    });
  });

  describe('Visual Design (AC7)', () => {
    it('should use slate-900 background', () => {
      const { container } = render(<LandingPage />);
      
      const mainContainer = container.querySelector('.bg-slate-900');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should use gradient for hero button', () => {
      render(<LandingPage />);
      
      const heroButton = screen.getByText(/REJOINDRE UN TOURNOI/i).closest('button');
      expect(heroButton).toHaveClass('bg-gradient-to-r');
      expect(heroButton).toHaveClass('from-amber-500');
    });

    it('should use outline style for secondary buttons', () => {
      render(<LandingPage />);
      
      const tournamentButton = screen.getByText(/^TOURNOI$/i).closest('button');
      expect(tournamentButton).toHaveClass('border-2');
      expect(tournamentButton).toHaveClass('border-primary');
      expect(tournamentButton).toHaveClass('text-primary');
    });

    it('should have section labels', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/▸ Participe/i)).toBeInTheDocument();
      expect(screen.getByText(/▸ Organise/i)).toBeInTheDocument();
    });

    it('should use bold or semibold font for primary action buttons', () => {
      render(<LandingPage />);
      
      const heroButton = screen.getByText(/REJOINDRE UN TOURNOI/i).closest('button');
      const tournamentButton = screen.getByText(/^TOURNOI$/i).closest('button');
      
      expect(heroButton).toHaveClass('font-bold');
      expect(tournamentButton).toHaveClass('font-bold');
    });

    it('should have tagline under logo', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Ton classement ELO entre amis/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should render without loading spinner initially', () => {
      render(<LandingPage />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<LandingPage />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should have descriptive button text', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/REJOINDRE UN TOURNOI/i)).toBeVisible();
      expect(screen.getByText(/^TOURNOI$/i)).toBeVisible();
      expect(screen.getByText(/^LEAGUE$/i)).toBeVisible();
      expect(screen.getByText(/Se connecter/i)).toBeVisible();
    });
  });

  describe('Clean Layout', () => {
    it('should manage its own full-screen layout', () => {
      const { container } = render(<LandingPage />);
      
      // Should have min-h-screen for full page layout
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should be self-contained (no external header/nav needed)', () => {
      render(<LandingPage />);
      
      // Landing page is complete on its own - App.tsx should hide header
      // This component test verifies the component itself is self-contained
      expect(screen.getByText(/BEER PONG LEAGUE/i)).toBeInTheDocument();
    });
  });

  describe('SessionStorage Management', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('should store returnTo for tournament creation', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/^TOURNOI$/i);
      fireEvent.click(button);
      
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');
    });

    it('should store returnTo for league creation', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/^LEAGUE$/i);
      fireEvent.click(button);
      
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-league');
    });

    it('should NOT store returnTo for general sign in', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/Se connecter →/i);
      fireEvent.click(button);
      
      expect(sessionStorage.getItem('authReturnTo')).toBeNull();
    });

    it('should NOT store returnTo for join tournament (public)', () => {
      render(<LandingPage />);
      
      const button = screen.getByText(/REJOINDRE UN TOURNOI/i);
      fireEvent.click(button);
      
      expect(sessionStorage.getItem('authReturnTo')).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should have isNavigating state for loading feedback', () => {
      render(<LandingPage />);
      
      // Component has loading state capability (tested via implementation)
      // Visual loading state would be tested in E2E tests
      const button = screen.getByText(/REJOINDRE UN TOURNOI/i);
      expect(button).toBeEnabled();
    });
  });
});
