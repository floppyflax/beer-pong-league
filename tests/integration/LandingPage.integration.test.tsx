import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/LandingPage';

// Mock AuthModal to simulate auth flow
vi.mock('../../src/components/AuthModal', () => ({
  AuthModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close Modal</button>
        <button 
          onClick={() => {
            // Simulate successful auth
            const returnTo = sessionStorage.getItem('authReturnTo');
            if (returnTo) {
              window.location.href = returnTo;
            } else {
              window.location.href = '/';
            }
            onClose();
          }}
        >
          Complete Auth
        </button>
      </div>
    ) : null,
}));

describe('LandingPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Full Auth Flow (AC3)', () => {
    it('should complete full auth flow for tournament creation', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click "TOURNOI" button
      const tournamentButton = screen.getByText(/^TOURNOI$/i);
      fireEvent.click(tournamentButton);

      // Verify auth modal opened
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

      // Verify returnTo was stored
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');

      // Simulate auth completion
      const completeAuthButton = screen.getByText('Complete Auth');
      fireEvent.click(completeAuthButton);

      // Verify redirect would happen to /create-tournament
      await waitFor(() => {
        expect(window.location.href).toContain('/create-tournament');
      });
    });

    it('should complete full auth flow for league creation', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click "LEAGUE" button
      const leagueButton = screen.getByText(/^LEAGUE$/i);
      fireEvent.click(leagueButton);

      // Verify auth modal opened
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

      // Verify returnTo was stored
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-league');
    });
  });

  describe('ReturnTo Parameter Preservation (AC3, AC4)', () => {
    it('should preserve returnTo in sessionStorage until auth completes', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click tournament button
      const tournamentButton = screen.getByText(/^TOURNOI$/i);
      fireEvent.click(tournamentButton);

      // Verify stored immediately
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');

      // Close modal without completing auth
      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      // ReturnTo should still be in sessionStorage (not cleaned until auth completes)
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');
    });

    it('should overwrite returnTo if user clicks different action before auth', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click tournament
      fireEvent.click(screen.getByText(/^TOURNOI$/i));
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');

      // Close modal
      fireEvent.click(screen.getByText('Close Modal'));

      // Click league (different action)
      fireEvent.click(screen.getByText(/^LEAGUE$/i));
      
      // Should overwrite with new destination
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-league');
    });
  });

  describe('Public Access to Join (AC2)', () => {
    it('should allow joining tournament without authentication', () => {
      const { container } = render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click join button
      const joinButton = screen.getByText(/REJOINDRE UN TOURNOI/i);
      fireEvent.click(joinButton);

      // Should NOT open auth modal
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();

      // Should NOT store returnTo (public access)
      expect(sessionStorage.getItem('authReturnTo')).toBeNull();
    });
  });

  describe('Sign In Flow (AC5)', () => {
    it('should open auth modal without specific returnTo', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Click sign in
      const signInButton = screen.getByText(/Se connecter →/i);
      fireEvent.click(signInButton);

      // Modal should open
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

      // Should NOT set returnTo (general sign-in defaults to home)
      expect(sessionStorage.getItem('authReturnTo')).toBeNull();
    });
  });

  describe('Multi-Action Flow', () => {
    it('should handle user changing mind between actions', async () => {
      render(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // 1. User clicks tournament
      fireEvent.click(screen.getByText(/^TOURNOI$/i));
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-tournament');
      
      // 2. User closes modal (changes mind)
      fireEvent.click(screen.getByText('Close Modal'));
      
      // 3. User clicks league instead
      fireEvent.click(screen.getByText(/^LEAGUE$/i));
      expect(sessionStorage.getItem('authReturnTo')).toBe('/create-league');
      
      // 4. User completes auth
      fireEvent.click(screen.getByText('Complete Auth'));
      
      // Should go to league, not tournament
      await waitFor(() => {
        expect(window.location.href).toContain('/create-league');
      });
    });
  });
});
