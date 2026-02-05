import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PersonalStatsSummary } from '../../../../src/components/home/PersonalStatsSummary';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useNavigate } from 'react-router-dom';

describe('PersonalStatsSummary', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const { container } = render(
        <BrowserRouter>
          <PersonalStatsSummary stats={undefined} isLoading={true} isPremium={false} />
        </BrowserRouter>
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Empty State (No Matches)', () => {
    it('should show empty state when no matches played', () => {
      const stats = {
        totalMatches: 0,
        winRate: 0,
        averageElo: 0,
      };

      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Aucun match joué')).toBeInTheDocument();
      expect(screen.getByText(/Commence à jouer/i)).toBeInTheDocument();
    });
  });

  describe('Stats Display for Premium Users', () => {
    const stats = {
      totalMatches: 42,
      winRate: 65.5,
      averageElo: 1250,
    };

    it('should display total matches', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/Matchs joués/i)).toBeInTheDocument();
    });

    it('should display win rate with percentage', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('65.5%')).toBeInTheDocument();
      expect(screen.getByText(/Taux de victoire/i)).toBeInTheDocument();
    });

    it('should display average ELO', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('1250')).toBeInTheDocument();
      expect(screen.getByText(/ELO moyen/i)).toBeInTheDocument();
    });

    it('should show "Voir toutes mes stats" link', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Voir toutes mes stats/i)).toBeInTheDocument();
    });

    it('should navigate to profile stats tab when clicking link', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      const link = screen.getByText(/Voir toutes mes stats/i);
      await user.click(link);

      expect(mockNavigate).toHaveBeenCalledWith('/profile?tab=stats');
    });
  });

  describe('Stats Display for Non-Premium Users (Teaser)', () => {
    const stats = {
      totalMatches: 42,
      winRate: 65.5,
      averageElo: 1250,
    };

    it('should display total matches (not locked)', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/Matchs joués/i)).toBeInTheDocument();
    });

    it('should show blurred/locked win rate and ELO', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      // Check for lock icons or blurred content
      expect(screen.getAllByText('🔒')).toHaveLength(2); // For win rate and ELO
    });

    it('should show "Passer Premium" button', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Passer Premium/i)).toBeInTheDocument();
    });

    it('should call onUpgradeClick when clicking "Passer Premium"', async () => {
      const user = userEvent.setup();
      const mockOnUpgrade = vi.fn();

      render(
        <BrowserRouter>
          <PersonalStatsSummary 
            stats={stats} 
            isLoading={false} 
            isPremium={false}
            onUpgradeClick={mockOnUpgrade}
          />
        </BrowserRouter>
      );

      const button = screen.getByText(/Passer Premium/i);
      await user.click(button);

      expect(mockOnUpgrade).toHaveBeenCalledOnce();
    });
  });

  describe('Styling', () => {
    const stats = {
      totalMatches: 42,
      winRate: 65.5,
      averageElo: 1250,
    };

    it('should apply card styling', () => {
      const { container } = render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      const card = container.querySelector('.bg-slate-800');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-slate-700');
    });

    it('should show section header', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={{
            totalMatches: 42,
            winRate: 65.5,
            averageElo: 1250,
          }} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Mes Stats')).toBeInTheDocument();
    });
  });
});
