import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LastTournamentCard } from '../../../../src/components/home/LastTournamentCard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useNavigate } from 'react-router-dom';

describe('LastTournamentCard', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const { container } = render(
        <BrowserRouter>
          <LastTournamentCard tournament={undefined} isLoading={true} />
        </BrowserRouter>
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no tournament', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={undefined} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Aucun tournoi')).toBeInTheDocument();
      expect(screen.getByText(/Rejoignez un tournoi/i)).toBeInTheDocument();
      expect(screen.getByText(/Rejoindre un tournoi/i)).toBeInTheDocument();
    });

    it('should navigate to /join when clicking empty state CTA', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastTournamentCard tournament={undefined} isLoading={false} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByText(/Rejoindre un tournoi/i);
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/join');
    });
  });

  describe('Tournament Card Display', () => {
    const mockTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      isFinished: false,
      playerCount: 8,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    it('should display tournament name', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });

    it('should display player count', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('8 joueurs')).toBeInTheDocument();
    });

    it('should display "En cours" status badge for active tournament', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    it('should display "Terminé" status badge for finished tournament', () => {
      const finishedTournament = { ...mockTournament, isFinished: true };

      render(
        <BrowserRouter>
          <LastTournamentCard tournament={finishedTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Terminé')).toBeInTheDocument();
    });

    it('should display relative time for last activity', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Il y a 2h/i)).toBeInTheDocument();
    });

    it('should display "VOIR LE CLASSEMENT" button', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('VOIR LE CLASSEMENT')).toBeInTheDocument();
    });

    it('should navigate to tournament detail when clicking card', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      const card = screen.getByText('Test Tournament').closest('div')!.parentElement!;
      await user.click(card);

      expect(mockNavigate).toHaveBeenCalledWith('/tournament/tournament-1');
    });

    it('should navigate when clicking "VOIR LE CLASSEMENT" button', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      const button = screen.getByText('VOIR LE CLASSEMENT');
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/tournament/tournament-1');
    });
  });

  describe('Styling', () => {
    const mockTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      isFinished: false,
      playerCount: 8,
      updatedAt: new Date().toISOString(),
    };

    it('should apply hover effect on card', () => {
      const { container } = render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      const card = container.querySelector('.hover\\:border-primary\\/50');
      expect(card).toBeInTheDocument();
    });

    it('should apply primary color styling', () => {
      render(
        <BrowserRouter>
          <LastTournamentCard tournament={mockTournament} isLoading={false} />
        </BrowserRouter>
      );

      const button = screen.getByText('VOIR LE CLASSEMENT');
      expect(button).toHaveClass('bg-primary');
    });
  });
});
