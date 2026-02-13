import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NewUserWelcome } from '../../../../src/components/home/NewUserWelcome';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useNavigate } from 'react-router-dom';

describe('NewUserWelcome', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('Content Display', () => {
    it('should display welcome message', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText('Bienvenue sur Beer Pong League! 🍺')).toBeInTheDocument();
    });

    it('should display onboarding description', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText(/Commencez par rejoindre un tournoi ou créer votre propre league/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display "Rejoindre un tournoi" action', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText('Rejoindre un tournoi')).toBeInTheDocument();
      expect(screen.getByText(/Scannez un QR code/i)).toBeInTheDocument();
    });

    it('should display "Créer un tournoi" action', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText('Créer un tournoi')).toBeInTheDocument();
      expect(screen.getByText(/Lancez votre premier tournoi/i)).toBeInTheDocument();
    });

    it('should display "Créer une league" action', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText('Créer une league')).toBeInTheDocument();
      expect(screen.getByText(/Créez votre propre league/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to /join when clicking "Rejoindre un tournoi"', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      const joinButton = screen.getByText('Rejoindre un tournoi').closest('button')!;
      await user.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith('/join');
    });

    it('should navigate to /create-tournament when clicking "Créer un tournoi"', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      const createButton = screen.getByText('Créer un tournoi').closest('button')!;
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/create-tournament');
    });

    it('should navigate to /create-league when clicking "Créer une league"', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      const leagueButton = screen.getByText('Créer une league').closest('button')!;
      await user.click(leagueButton);

      expect(mockNavigate).toHaveBeenCalledWith('/create-league');
    });
  });

  describe('Styling', () => {
    it('should apply gradient background styling', () => {
      const { container } = render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      const card = container.querySelector('.bg-gradient-to-br');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('from-slate-800');
      expect(card).toHaveClass('to-slate-900');
    });

    it('should display action cards with proper styling', () => {
      const { container } = render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      const actionCards = container.querySelectorAll('.bg-slate-800\\/50');
      expect(actionCards.length).toBe(3);
    });

    it('should show trophy emoji in welcome message', () => {
      render(
        <BrowserRouter>
          <NewUserWelcome />
        </BrowserRouter>
      );

      expect(screen.getByText(/🍺/)).toBeInTheDocument();
    });
  });
});
