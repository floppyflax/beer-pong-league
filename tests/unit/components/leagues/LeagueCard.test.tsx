import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LeagueCard } from '../../../../src/components/leagues/LeagueCard';
import type { LeagueListItem } from '../../../../src/hooks/useLeaguesList';

const mockNavigate = vi.fn();

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../src/context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('../../../../src/hooks/useIdentity', () => ({
  useIdentity: vi.fn(),
}));

import { useAuthContext } from '../../../../src/context/AuthContext';
import { useIdentity } from '../../../../src/hooks/useIdentity';

describe('LeagueCard', () => {
  const mockLeague: LeagueListItem = {
    id: 'league-1',
    name: 'Test League',
    status: 'active',
    creator_user_id: 'user-1',
    creator_anonymous_user_id: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    member_count: 5,
    tournament_count: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthContext).mockReturnValue({
      user: { id: 'user-2', email: 'test@example.com', user_metadata: {} },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    });
    vi.mocked(useIdentity).mockReturnValue({
      anonymousUser: null,
      loading: false,
      createAnonymousUser: vi.fn(),
    });
  });

  it('should render league information correctly', () => {
    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test League')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5 membres')).toBeInTheDocument();
    expect(screen.getByText('3 tournois')).toBeInTheDocument();
    expect(screen.getByText(/Dernière activité/)).toBeInTheDocument();
  });

  it('should display owner badge when user is the creator', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: { id: 'user-1', email: 'owner@example.com', user_metadata: {} },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('👑 Propriétaire')).toBeInTheDocument();
  });

  it('should NOT display owner badge when user is not the creator', () => {
    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    expect(screen.queryByText('👑 Propriétaire')).not.toBeInTheDocument();
  });

  it('should display owner badge for anonymous user creator', () => {
    const anonymousLeague: LeagueListItem = {
      ...mockLeague,
      creator_user_id: null,
      creator_anonymous_user_id: 'anon-1',
    };

    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    });

    vi.mocked(useIdentity).mockReturnValue({
      anonymousUser: { id: 'anon-1', pseudo: 'Anon User' },
      loading: false,
      createAnonymousUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LeagueCard league={anonymousLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('👑 Propriétaire')).toBeInTheDocument();
  });

  it('should display "Terminée" badge for finished league', () => {
    const finishedLeague: LeagueListItem = {
      ...mockLeague,
      status: 'finished',
    };

    render(
      <BrowserRouter>
        <LeagueCard league={finishedLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('Terminée')).toBeInTheDocument();
  });

  it('should navigate to league detail page when clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    const card = screen.getByTestId('league-card');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/league/league-1');
  });

  it('should handle singular member count', () => {
    const singleMemberLeague: LeagueListItem = {
      ...mockLeague,
      member_count: 1,
    };

    render(
      <BrowserRouter>
        <LeagueCard league={singleMemberLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('1 membre')).toBeInTheDocument();
  });

  it('should handle singular tournament count', () => {
    const singleTournamentLeague: LeagueListItem = {
      ...mockLeague,
      tournament_count: 1,
    };

    render(
      <BrowserRouter>
        <LeagueCard league={singleTournamentLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('1 tournoi')).toBeInTheDocument();
  });

  it('should handle zero members and tournaments', () => {
    const emptyLeague: LeagueListItem = {
      ...mockLeague,
      member_count: 0,
      tournament_count: 0,
    };

    render(
      <BrowserRouter>
        <LeagueCard league={emptyLeague} />
      </BrowserRouter>
    );

    expect(screen.getByText('0 membres')).toBeInTheDocument();
    expect(screen.getByText('0 tournois')).toBeInTheDocument();
  });

  it('should display correct styling for active league', () => {
    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    const statusBadge = screen.getByText('Active');
    expect(statusBadge).toHaveClass('bg-green-500/20');
    expect(statusBadge).toHaveClass('text-green-400');
  });

  it('should display correct styling for finished league', () => {
    const finishedLeague: LeagueListItem = {
      ...mockLeague,
      status: 'finished',
    };

    render(
      <BrowserRouter>
        <LeagueCard league={finishedLeague} />
      </BrowserRouter>
    );

    const statusBadge = screen.getByText('Terminée');
    expect(statusBadge).toHaveClass('bg-slate-700');
    expect(statusBadge).toHaveClass('text-slate-300');
  });

  it('should apply hover and cursor styles', () => {
    render(
      <BrowserRouter>
        <LeagueCard league={mockLeague} />
      </BrowserRouter>
    );

    const card = screen.getByTestId('league-card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:border-primary');
  });
});
