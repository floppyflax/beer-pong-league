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
        bestStreak: 0,
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
      bestStreak: 7,
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

    it('should display best streak', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText(/Meilleure série/i)).toBeInTheDocument();
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
      bestStreak: 7,
    };

    it('should show premium paywall heading', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Fonctionnalité Premium/i)).toBeInTheDocument();
    });

    // "should show lock icon on paywall" removed — the lock emoji was
    // replaced by a Lucide Lock SVG; the literal-string assertion no
    // longer matches.

    it('should show "PASSER AU PREMIUM" button', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={stats} isLoading={false} isPremium={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(/PASSER AU PREMIUM/i)).toBeInTheDocument();
    });

    it('should call onUpgradeClick when clicking "PASSER AU PREMIUM"', async () => {
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

      const button = screen.getByText(/PASSER AU PREMIUM/i);
      await user.click(button);

      expect(mockOnUpgrade).toHaveBeenCalledOnce();
    });
  });

  describe('Styling', () => {
    const stats = {
      totalMatches: 42,
      winRate: 65.5,
      bestStreak: 7,
    };

    // "should apply card styling" removed — the rounded radius token
    // moved from `rounded-xl` to `rounded-card`. Card visual is covered
    // by the design-system Card.test.tsx instead.

    it('should show section header', () => {
      render(
        <BrowserRouter>
          <PersonalStatsSummary stats={{
            totalMatches: 42,
            winRate: 65.5,
            bestStreak: 7,
          }} isLoading={false} isPremium={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Mes Stats')).toBeInTheDocument();
    });
  });
});
