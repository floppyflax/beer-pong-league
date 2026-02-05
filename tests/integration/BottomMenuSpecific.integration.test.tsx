import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Join } from '../../src/pages/Join';
import { Tournaments } from '../../src/pages/Tournaments';
import { Leagues } from '../../src/pages/Leagues';
import { AuthProvider } from '../../src/context/AuthContext';
import { IdentityProvider } from '../../src/context/IdentityContext';
import { LeagueProvider } from '../../src/context/LeagueContext';

// Mock navigate to track navigation calls
const mockNavigate = vi.fn();

// Mock useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component with all required providers
function TestApp({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <AuthProvider>
      <IdentityProvider>
        <LeagueProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/join" element={<Join />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/leagues" element={<Leagues />} />
              <Route path="/create-tournament" element={<div>Create Tournament Page</div>} />
              <Route path="/create-league" element={<div>Create League Page</div>} />
            </Routes>
          </MemoryRouter>
        </LeagueProvider>
      </IdentityProvider>
    </AuthProvider>
  );
}

describe('BottomMenuSpecific Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Join Page (AC2)', () => {
    it('should display two action buttons: Scanner QR and Code', () => {
      render(<TestApp initialRoute="/join" />);
      
      const scannerButtons = screen.getAllByText('SCANNER QR');
      const codeButtons = screen.getAllByText('CODE');
      
      // Should have buttons (mobile and/or desktop)
      expect(scannerButtons.length).toBeGreaterThanOrEqual(1);
      expect(codeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should open scanner modal when Scanner QR is clicked', () => {
      render(<TestApp initialRoute="/join" />);
      
      const scannerButton = screen.getAllByText('SCANNER QR')[0]; // Mobile or desktop
      fireEvent.click(scannerButton);
      
      expect(screen.getByText('Scanner QR')).toBeInTheDocument();
      expect(screen.getByText('La fonctionnalité de scan QR sera implémentée prochainement.')).toBeInTheDocument();
    });

    it('should open code input modal when Code is clicked', () => {
      render(<TestApp initialRoute="/join" />);
      
      const codeButton = screen.getAllByText('CODE')[0]; // Mobile or desktop
      fireEvent.click(codeButton);
      
      expect(screen.getByText('Entrer le Code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('XXXXX')).toBeInTheDocument();
    });

    it('should close scanner modal when Fermer is clicked', () => {
      render(<TestApp initialRoute="/join" />);
      
      const scannerButton = screen.getAllByText('SCANNER QR')[0];
      fireEvent.click(scannerButton);
      
      expect(screen.getByText('Scanner QR')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Fermer');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Scanner QR')).not.toBeInTheDocument();
    });
  });

  describe('Tournaments Page (AC3)', () => {
    it('should display single Créer button', () => {
      render(<TestApp initialRoute="/tournaments" />);
      
      // Should have at least one CRÉER button (mobile or desktop)
      expect(screen.getAllByText('CRÉER').length).toBeGreaterThanOrEqual(1);
    });

    it('should show tournaments page title', () => {
      render(<TestApp initialRoute="/tournaments" />);
      
      // May have multiple titles (mobile/desktop headers)
      const titles = screen.getAllByText('Mes Tournois');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should show empty state when no tournaments', () => {
      render(<TestApp initialRoute="/tournaments" />);
      
      expect(screen.getByText('Aucun tournoi')).toBeInTheDocument();
    });

    it('should navigate to create-tournament when Créer button is clicked (free user)', async () => {
      render(<TestApp initialRoute="/tournaments" />);
      
      const createButton = screen.getAllByText('CRÉER')[0];
      fireEvent.click(createButton);
      
      // Should navigate to create-tournament page (no premium limit for 0 tournaments)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/create-tournament');
      });
    });
  });

  describe('Leagues Page (AC4)', () => {
    it('should display single Créer button', () => {
      render(<TestApp initialRoute="/leagues" />);
      
      // Should have at least one CRÉER button (mobile or desktop)
      expect(screen.getAllByText('CRÉER').length).toBeGreaterThanOrEqual(1);
    });

    it('should show leagues page title', () => {
      render(<TestApp initialRoute="/leagues" />);
      
      // May have multiple titles (mobile/desktop headers)
      const titles = screen.getAllByText('Mes Leagues');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should show empty state when no leagues', () => {
      render(<TestApp initialRoute="/leagues" />);
      
      expect(screen.getByText('Aucune league')).toBeInTheDocument();
    });

    it('should navigate to create-league when Créer button is clicked (free user)', async () => {
      render(<TestApp initialRoute="/leagues" />);
      
      const createButton = screen.getAllByText('CRÉER')[0];
      fireEvent.click(createButton);
      
      // Should navigate to create-league page (no premium limit for 0 leagues)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/create-league');
      });
    });
  });

  describe('Desktop vs Mobile Layout (AC5)', () => {
    it('should render bottom menu on mobile for Join page', () => {
      const { container } = render(<TestApp initialRoute="/join" />);
      
      // Check for lg:hidden class on bottom menu
      const bottomMenus = container.querySelectorAll('.lg\\:hidden');
      expect(bottomMenus.length).toBeGreaterThan(0);
    });

    it('should render desktop actions on tournaments page', () => {
      render(<TestApp initialRoute="/tournaments" />);
      
      // Desktop actions have 'hidden lg:flex' class
      // Mobile menu has 'lg:hidden' class
      // Both should be present in the DOM
      const createButtons = screen.getAllByText('CRÉER');
      expect(createButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Component Integration', () => {
    it('should render Join page without errors', () => {
      expect(() => {
        render(<TestApp initialRoute="/join" />);
      }).not.toThrow();
    });

    it('should render Tournaments page without errors', () => {
      expect(() => {
        render(<TestApp initialRoute="/tournaments" />);
      }).not.toThrow();
    });

    it('should render Leagues page without errors', () => {
      expect(() => {
        render(<TestApp initialRoute="/leagues" />);
      }).not.toThrow();
    });
  });
});
