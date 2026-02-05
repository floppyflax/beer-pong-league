import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TournamentCard } from '../../../../src/components/tournaments/TournamentCard';
import type { Tournament } from '../../../../src/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TournamentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveTournament: Tournament = {
    id: 'tournament-1',
    name: 'Beer Pong Championship 2024',
    date: '2024-06-15',
    format: '2v2',
    leagueId: null,
    createdAt: '2024-01-10T10:00:00Z',
    playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    matches: [],
    isFinished: false,
  };

  const mockFinishedTournament: Tournament = {
    ...mockActiveTournament,
    id: 'tournament-2',
    name: 'Summer Tournament',
    isFinished: true,
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should render tournament name', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText('Beer Pong Championship 2024')).toBeInTheDocument();
  });

  it('should show "En cours" badge for active tournaments', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('should show "Terminé" badge for finished tournaments', () => {
    renderWithRouter(<TournamentCard tournament={mockFinishedTournament} />);
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('should display player count', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText('5 joueurs')).toBeInTheDocument();
  });

  it('should display player count with singular form for 1 player', () => {
    const singlePlayerTournament = {
      ...mockActiveTournament,
      playerIds: ['p1'],
    };
    renderWithRouter(<TournamentCard tournament={singlePlayerTournament} />);
    expect(screen.getByText('1 joueur')).toBeInTheDocument();
  });

  it('should display tournament date formatted', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    // Date format: "15 juin 2024" in French locale
    expect(screen.getByText(/juin 2024/i)).toBeInTheDocument();
  });

  it('should display last activity time', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText(/Dernière activité/i)).toBeInTheDocument();
  });

  it('should navigate to tournament detail on click', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    
    const card = screen.getByText('Beer Pong Championship 2024').closest('div');
    fireEvent.click(card!);

    expect(mockNavigate).toHaveBeenCalledWith('/tournament/tournament-1');
  });

  it('should show ranking preview for active tournaments with players', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText(/Cliquez pour voir le classement/i)).toBeInTheDocument();
  });

  it('should not show ranking preview for finished tournaments', () => {
    renderWithRouter(<TournamentCard tournament={mockFinishedTournament} />);
    expect(screen.queryByText(/Cliquez pour voir le classement/i)).not.toBeInTheDocument();
  });

  it('should not show ranking preview for tournaments with no players', () => {
    const emptyTournament = {
      ...mockActiveTournament,
      playerIds: [],
    };
    renderWithRouter(<TournamentCard tournament={emptyTournament} />);
    expect(screen.queryByText(/Cliquez pour voir le classement/i)).not.toBeInTheDocument();
  });

  it('should have hover and active styles', () => {
    const { container } = renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('hover:border-primary');
    expect(card).toHaveClass('active:scale-98');
  });

  it('should handle tournaments with 0 players', () => {
    const noPlayersTournament = {
      ...mockActiveTournament,
      playerIds: undefined,
    };
    renderWithRouter(<TournamentCard tournament={noPlayersTournament} />);
    expect(screen.getByText('0 joueur')).toBeInTheDocument();
  });
});
