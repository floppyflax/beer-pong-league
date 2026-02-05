import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../../../src/pages/Home';

// Mock hooks
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: vi.fn(),
}));

vi.mock('../../../src/hooks/useHomeData', () => ({
  useHomeData: vi.fn(),
}));

vi.mock('../../../src/services/PremiumService', () => ({
  premiumService: {
    isPremium: vi.fn(),
  },
}));

// Mock child components
vi.mock('../../../src/components/home/LastTournamentCard', () => ({
  LastTournamentCard: ({ tournament, isLoading }: any) => (
    <div data-testid="last-tournament-card">
      {isLoading ? 'Loading tournament...' : tournament ? `Tournament: ${tournament.name}` : 'No tournament'}
    </div>
  ),
}));

vi.mock('../../../src/components/home/LastLeagueCard', () => ({
  LastLeagueCard: ({ league, isLoading }: any) => (
    <div data-testid="last-league-card">
      {isLoading ? 'Loading league...' : league ? `League: ${league.name}` : 'No league'}
    </div>
  ),
}));

vi.mock('../../../src/components/home/PersonalStatsSummary', () => ({
  PersonalStatsSummary: ({ stats, isLoading, isPremium }: any) => (
    <div data-testid="personal-stats-summary">
      {isLoading ? 'Loading stats...' : `Stats: ${stats?.totalMatches || 0} matches (Premium: ${isPremium})`}
    </div>
  ),
}));

vi.mock('../../../src/components/home/NewUserWelcome', () => ({
  NewUserWelcome: () => (
    <div data-testid="new-user-welcome">Welcome new user!</div>
  ),
}));

vi.mock('../../../src/components/PaymentModal', () => ({
  PaymentModal: ({ isOpen, onClose }: any) => (
    isOpen ? <div data-testid="payment-modal">Payment Modal <button onClick={onClose}>Close</button></div> : null
  ),
}));

import { useAuth } from '../../../src/hooks/useAuth';
import { useIdentity } from '../../../src/hooks/useIdentity';
import { useHomeData } from '../../../src/hooks/useHomeData';
import { premiumService } from '../../../src/services/PremiumService';

describe('Home (Refactored)', () => {
  const mockUseAuth = vi.mocked(useAuth);
  const mockUseIdentity = vi.mocked(useIdentity);
  const mockUseHomeData = vi.mocked(useHomeData);
  const mockIsPremium = vi.mocked(premiumService.isPremium);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
    } as any);

    mockUseIdentity.mockReturnValue({
      hasIdentity: true,
      anonymousId: null,
      userId: 'user-123',
    } as any);

    mockIsPremium.mockResolvedValue(false);
  });

  describe('Loading State', () => {
    it('should show loading state when data is loading', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: undefined,
        isLoading: true,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading tournament...')).toBeInTheDocument();
      expect(screen.getByText('Loading league...')).toBeInTheDocument();
      expect(screen.getByText('Loading stats...')).toBeInTheDocument();
    });
  });

  describe('New User State', () => {
    it('should show welcome message for new users with no data', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 0, winRate: 0, averageElo: 0 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByTestId('new-user-welcome')).toBeInTheDocument();
    });
  });

  describe('Returning User State', () => {
    it('should display last tournament card', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: {
          id: 'tournament-1',
          name: 'Test Tournament',
          isFinished: false,
          playerCount: 8,
          updatedAt: new Date().toISOString(),
        },
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText('Tournament: Test Tournament')).toBeInTheDocument();
    });

    it('should display last league card', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: {
          id: 'league-1',
          name: 'Test League',
          memberCount: 12,
          status: 'active' as const,
          updatedAt: new Date().toISOString(),
        },
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText('League: Test League')).toBeInTheDocument();
    });

    it('should display personal stats summary', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText(/Stats: 10 matches/)).toBeInTheDocument();
    });
  });

  describe('Premium Status', () => {
    it('should pass isPremium=true to stats when user is premium', async () => {
      mockIsPremium.mockResolvedValue(true);
      
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      await screen.findByText(/Premium: true/);
    });

    it('should pass isPremium=false to stats when user is not premium', () => {
      mockIsPremium.mockResolvedValue(false);
      
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText(/Premium: false/)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should apply mobile-first layout classes', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      const { container } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      // Check for responsive container classes
      const mainContainer = container.querySelector('.max-w-7xl');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should display welcome header', () => {
      mockUseHomeData.mockReturnValue({
        lastTournament: undefined,
        lastLeague: undefined,
        personalStats: { totalMatches: 10, winRate: 60, averageElo: 1200 },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    });
  });
});
