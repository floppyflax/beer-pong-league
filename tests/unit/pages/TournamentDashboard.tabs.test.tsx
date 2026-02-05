import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TournamentDashboard } from '../../../src/pages/TournamentDashboard';

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-tournament-id' }),
    useNavigate: () => vi.fn()
  };
});

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock hooks
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

describe('TournamentDashboard - Tab Navigation (Task 1)', () => {
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

  describe('AC1: Tab Navigation Structure', () => {
    it('should display 3 tabs: Classement, Matchs, Paramètres', () => {
      renderDashboard();
      
      const tabs = screen.getAllByRole('button');
      const tabTexts = tabs.map(tab => tab.textContent);
      
      expect(tabTexts).toContain('Classement');
      expect(tabTexts).toContain('Matchs');
      expect(tabTexts.some(text => text?.includes('Paramètres'))).toBe(true);
    });

    it('should have Classement tab active by default', () => {
      renderDashboard();
      
      const classementTab = screen.getByText('Classement').closest('button');
      expect(classementTab).toHaveClass('border-primary', 'text-white');
    });

    it('should highlight active tab with orange underline', () => {
      renderDashboard();
      
      const classementTab = screen.getByText('Classement').closest('button');
      expect(classementTab).toHaveClass('border-primary');
      expect(classementTab).toHaveClass('border-b-2');
    });

    it('should switch to Matchs tab when clicked', () => {
      renderDashboard();
      
      const allButtons = screen.getAllByRole('button');
      const matchsTab = allButtons.find(btn => btn.textContent === 'Matchs' && btn.className.includes('uppercase tracking-wide'));
      
      fireEvent.click(matchsTab!);
      
      expect(matchsTab).toHaveClass('border-primary', 'text-white');
    });

    it('should switch to Paramètres tab when clicked', () => {
      renderDashboard();
      
      const parametresTab = screen.getByText(/Paramètres/).closest('button');
      fireEvent.click(parametresTab!);
      
      expect(parametresTab).toHaveClass('border-primary', 'text-white');
    });

    it('should only have one active tab at a time', () => {
      renderDashboard();
      
      const allButtons = screen.getAllByRole('button');
      const matchsTab = allButtons.find(btn => btn.textContent === 'Matchs' && btn.className.includes('uppercase tracking-wide'));
      const classementTab = allButtons.find(btn => btn.textContent === 'Classement');
      
      fireEvent.click(matchsTab!);
      
      // Verify only Matchs is active
      expect(classementTab).not.toHaveClass('border-primary');
      expect(matchsTab).toHaveClass('border-primary');
    });
  });

  describe('Tab Content Display', () => {
    it('should show Classement content when on Classement tab', () => {
      renderDashboard();
      
      // Should show empty state for players
      expect(screen.getByText(/Aucun joueur/)).toBeInTheDocument();
    });

    it('should show Matchs content when on Matchs tab', () => {
      renderDashboard();
      
      const allButtons = screen.getAllByRole('button');
      const matchsTab = allButtons.find(btn => btn.textContent === 'Matchs' && btn.className.includes('uppercase tracking-wide'));
      fireEvent.click(matchsTab!);
      
      // Should show empty state for matches
      expect(screen.getByText(/Aucun match/)).toBeInTheDocument();
    });

    it('should show Paramètres content when on Paramètres tab', () => {
      renderDashboard();
      
      const parametresTab = screen.getByText(/Paramètres/).closest('button');
      fireEvent.click(parametresTab!);
      
      // Should show settings sections
      expect(screen.getByText('Informations')).toBeInTheDocument();
      expect(screen.getByText(/Association à une League/)).toBeInTheDocument();
    });
  });
});
