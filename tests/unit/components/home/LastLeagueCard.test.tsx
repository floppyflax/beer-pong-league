import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LastLeagueCard } from '../../../../src/components/home/LastLeagueCard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useNavigate } from 'react-router-dom';

describe('LastLeagueCard', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const { container } = render(
        <BrowserRouter>
          <LastLeagueCard league={undefined} isLoading={true} />
        </BrowserRouter>
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no league', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={undefined} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Aucune league')).toBeInTheDocument();
      expect(screen.getByText(/Créez une league/i)).toBeInTheDocument();
      expect(screen.getByText(/Créer une league/i)).toBeInTheDocument();
    });

    it('should navigate to /create-league when clicking empty state CTA (no onEmptyAction)', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastLeagueCard league={undefined} isLoading={false} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByText(/Créer une league/i);
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/create-league');
    });

    it('should call onEmptyAction when provided instead of navigate', async () => {
      const user = userEvent.setup();
      const onEmptyAction = vi.fn();

      render(
        <BrowserRouter>
          <LastLeagueCard
            league={undefined}
            isLoading={false}
            onEmptyAction={onEmptyAction}
          />
        </BrowserRouter>
      );

      const ctaButton = screen.getByText(/Créer une league/i);
      await user.click(ctaButton);

      expect(onEmptyAction).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show lock icon when emptyActionLocked is true', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard
            league={undefined}
            isLoading={false}
            onEmptyAction={() => {}}
            emptyActionLocked={true}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('🔒')).toBeInTheDocument();
    });
  });

  describe('League Card Display', () => {
    const mockLeague = {
      id: 'league-1',
      name: 'Test League',
      memberCount: 12,
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      status: 'active' as const,
    };

    it('should display league name', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Test League')).toBeInTheDocument();
    });

    it('should display member count', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('12 membres')).toBeInTheDocument();
    });

    it('should display "Active" status for active league', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display "Terminée" status for finished league', () => {
      const finishedLeague = { ...mockLeague, status: 'finished' as const };

      render(
        <BrowserRouter>
          <LastLeagueCard league={finishedLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('Terminée')).toBeInTheDocument();
    });

    it('should display relative time for last activity', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Il y a 3h/i)).toBeInTheDocument();
    });

    it('should display "VOIR LE CLASSEMENT" button', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      expect(screen.getByText('VOIR LE CLASSEMENT')).toBeInTheDocument();
    });

    it('should navigate to league detail when clicking card', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      const card = screen.getByText('Test League').closest('div')!.parentElement!;
      await user.click(card);

      expect(mockNavigate).toHaveBeenCalledWith('/league/league-1');
    });

    it('should navigate when clicking "VOIR LE CLASSEMENT" button', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      const button = screen.getByText('VOIR LE CLASSEMENT');
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/league/league-1');
    });
  });

  describe('Styling', () => {
    const mockLeague = {
      id: 'league-1',
      name: 'Test League',
      memberCount: 12,
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
    };

    it('should apply hover effect on card', () => {
      const { container } = render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      const card = container.querySelector('.hover\\:border-primary\\/50');
      expect(card).toBeInTheDocument();
    });

    it('should apply primary color styling to button', () => {
      render(
        <BrowserRouter>
          <LastLeagueCard league={mockLeague} isLoading={false} />
        </BrowserRouter>
      );

      const button = screen.getByText('VOIR LE CLASSEMENT');
      expect(button).toHaveClass('bg-primary');
    });
  });
});
