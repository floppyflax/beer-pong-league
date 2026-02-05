import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TournamentDashboard } from '../../../src/pages/TournamentDashboard';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-tournament-id' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockTournament = {
  id: 'test-tournament-id',
  name: 'Test Tournament',
  joinCode: 'ABC123',
  date: '2026-02-03',
  format: 'libre' as const,
  formatType: 'fixed' as const,
  team1Size: 2,
  team2Size: 2,
  status: 'active' as const,
  isFinished: false,
  matches: [],
  playerIds: [],
  creator_user_id: 'creator-id',
  creator_anonymous_user_id: null,
  maxPlayers: 16,
  anti_cheat_enabled: false,
  leagueId: null
};

const mockLeagueContextValue = {
  tournaments: [mockTournament],
  leagues: [],
  recordTournamentMatch: vi.fn(),
  deleteTournament: vi.fn(),
  toggleTournamentStatus: vi.fn(),
  updateTournament: vi.fn(),
  getTournamentLocalRanking: vi.fn(() => []),
  getLeagueGlobalRanking: vi.fn(() => []),
  addPlayer: vi.fn(),
  addPlayerToTournament: vi.fn(),
  associateTournamentToLeague: vi.fn(),
  isLoadingInitialData: false,
  reloadData: vi.fn()
};

vi.mock('../../../src/context/AuthContext', () => ({
  useAuthContext: () => ({
    user: null,
    isAuthenticated: false,
    signInWithOTP: vi.fn(),
    signOut: vi.fn()
  })
}));

vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: () => mockLeagueContextValue
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: () => ({ localUser: null })
}));

describe('TournamentDashboard - Floating Action Button (Task 4)', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <TournamentDashboard />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC5: Contextual Floating Button', () => {
    it('should show UserPlus button on Classement tab', () => {
      renderDashboard();
      
      // Should be on Classement tab by default
      const addPlayerButton = screen.getByTitle('Ajouter un joueur');
      expect(addPlayerButton).toBeInTheDocument();
      expect(addPlayerButton).toHaveClass('rounded-full'); // Rounded button
      expect(addPlayerButton).toHaveClass('bg-primary'); // Orange color
    });

    it('should show NOUVEAU MATCH button on Matchs tab when tournament not finished', () => {
      renderDashboard();
      
      // Switch to Matchs tab
      const allButtons = screen.getAllByRole('button');
      const matchsTab = allButtons.find(btn => btn.textContent === 'Matchs' && btn.className.includes('uppercase tracking-wide'));
      fireEvent.click(matchsTab!);
      
      // Should show match button
      const matchButton = screen.getByText(/NOUVEAU MATCH/);
      expect(matchButton).toBeInTheDocument();
      expect(matchButton.closest('button')).toHaveClass('w-full'); // Full width
      expect(matchButton.closest('button')).toHaveClass('bg-primary');
    });

    it('should NOT show any button on Paramètres tab', () => {
      renderDashboard();
      
      // Switch to Paramètres tab
      const allButtons = screen.getAllByRole('button');
      const parametresTab = allButtons.find(btn => btn.textContent?.includes('Paramètres'));
      fireEvent.click(parametresTab!);
      
      // Should NOT find the add player button or match button
      expect(screen.queryByTitle('Ajouter un joueur')).not.toBeInTheDocument();
      expect(screen.queryByText(/NOUVEAU MATCH/)).not.toBeInTheDocument();
    });

    it('should NOT show NOUVEAU MATCH button when tournament is finished', () => {
      // Update mock tournament to be finished
      const finishedTournament = { ...mockTournament, isFinished: true };
      vi.mocked(mockLeagueContextValue.tournaments).splice(0, 1, finishedTournament);
      
      renderDashboard();
      
      // Switch to Matchs tab
      const allButtons = screen.getAllByRole('button');
      const matchsTab = allButtons.find(btn => btn.textContent === 'Matchs' && btn.className.includes('uppercase tracking-wide'));
      fireEvent.click(matchsTab!);
      
      // Should NOT show match button
      expect(screen.queryByText(/NOUVEAU MATCH/)).not.toBeInTheDocument();
    });

    it('should open add player modal when UserPlus button is clicked', () => {
      renderDashboard();
      
      const addPlayerButton = screen.getByTitle('Ajouter un joueur');
      fireEvent.click(addPlayerButton);
      
      // Modal should open
      expect(screen.getByText('Ajouter un joueur')).toBeInTheDocument();
    });
  });
});
