import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ListRow } from '../../../../src/components/design-system/ListRow';

describe('ListRow (Story 14-4)', () => {
  describe('variant player (AC: 1)', () => {
    it('should display avatar or initials placeholder', () => {
      render(
        <ListRow
          variant="player"
          name="Alice"
          subtitle="12W / 5L • 71%"
          elo={1250}
        />
      );
      expect(screen.getByText('AL')).toBeInTheDocument();
    });

    it('should display rank badge with gold for rank 1', () => {
      render(
        <ListRow
          variant="player"
          name="Bob"
          rank={1}
          subtitle="10W / 2L"
          elo={1400}
        />
      );
      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-amber-500');
    });

    it('should display rank badge with silver for rank 2', () => {
      render(
        <ListRow
          variant="player"
          name="Charlie"
          rank={2}
          subtitle="8W / 4L"
          elo={1200}
        />
      );
      const badge = screen.getByText('2');
      expect(badge).toHaveClass('bg-slate-400');
    });

    it('should display rank badge with bronze for rank 3', () => {
      render(
        <ListRow
          variant="player"
          name="Dave"
          rank={3}
          subtitle="6W / 6L"
          elo={1100}
        />
      );
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-amber-700');
    });

    it('should display name and subtitle', () => {
      render(
        <ListRow
          variant="player"
          name="Eve"
          subtitle="15W / 3L • 83%"
          elo={1350}
        />
      );
      expect(screen.getByText('Eve')).toBeInTheDocument();
      expect(screen.getByText('15W / 3L • 83%')).toBeInTheDocument();
    });

    it('should display ELO and positive delta in green', () => {
      render(
        <ListRow
          variant="player"
          name="Frank"
          subtitle="5W / 5L"
          elo={1000}
          delta={25}
        />
      );
      expect(screen.getByText('1000')).toBeInTheDocument();
      const delta = screen.getByText('+25');
      expect(delta).toHaveClass('text-green-500');
    });

    it('should display ELO and negative delta in red', () => {
      render(
        <ListRow
          variant="player"
          name="Grace"
          subtitle="3W / 7L"
          elo={950}
          delta={-15}
        />
      );
      const delta = screen.getByText('-15');
      expect(delta).toHaveClass('text-red-500');
    });

    it('should display chevron', () => {
      render(
        <ListRow
          variant="player"
          name="Henry"
          subtitle="7W / 3L"
          elo={1150}
        />
      );
      expect(screen.getByTestId('listrow-chevron')).toBeInTheDocument();
    });

    it('should display recent results as 5 colored circles (green=win, red=loss)', () => {
      render(
        <ListRow
          variant="player"
          name="Ivy"
          subtitle="5W / 5L"
          elo={1000}
          recentResults={[true, false, true, true, false]}
        />
      );
      const container = screen.getByRole('img', { name: 'Derniers résultats' });
      expect(container).toBeInTheDocument();
      const circles = container.querySelectorAll('div[class*="rounded-full"]');
      expect(circles).toHaveLength(5);
      expect(circles[0]).toHaveClass('bg-green-500');
      expect(circles[1]).toHaveClass('bg-red-500');
      expect(circles[2]).toHaveClass('bg-green-500');
      expect(circles[3]).toHaveClass('bg-green-500');
      expect(circles[4]).toHaveClass('bg-red-500');
    });
  });

  describe('variant tournament (AC: 2)', () => {
    it('should display name, date, status badge', () => {
      render(
        <ListRow
          variant="tournament"
          name="Tournoi d'été"
          date="15 juin 2025"
          status="En cours"
          metrics={{ matches: 12, players: 8, format: 'Simple' }}
        />
      );
      expect(screen.getByText("Tournoi d'été")).toBeInTheDocument();
      expect(screen.getByText('15 juin 2025')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    it('should display metrics (Matchs, Joueurs, Format)', () => {
      render(
        <ListRow
          variant="tournament"
          name="Beer Pong Cup"
          date="1 mars 2025"
          status="Terminé"
          metrics={{ matches: 24, players: 16, format: 'Double' }}
        />
      );
      expect(screen.getByText(/24/)).toBeInTheDocument();
      expect(screen.getByText(/16/)).toBeInTheDocument();
      expect(screen.getByText('Double')).toBeInTheDocument();
    });

    it('should display chevron', () => {
      render(
        <ListRow
          variant="tournament"
          name="Test"
          date="1 jan"
          status="En cours"
          metrics={{ matches: 0, players: 0, format: '-' }}
        />
      );
      expect(screen.getByTestId('listrow-chevron')).toBeInTheDocument();
    });
  });

  describe('variant league (AC: 2)', () => {
    it('should display name, date, status badge and metrics', () => {
      render(
        <ListRow
          variant="league"
          name="Ligue Pro"
          date="2025"
          status="Active"
          metrics={{ matches: 50, players: 12, format: 'Round-robin' }}
        />
      );
      expect(screen.getByText('Ligue Pro')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
      expect(screen.getByText(/12/)).toBeInTheDocument();
      expect(screen.getByText('Round-robin')).toBeInTheDocument();
    });
  });

  describe('cliquability (AC: 3)', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <ListRow
          variant="player"
          name="Clickable"
          subtitle="0W / 0L"
          elo={1000}
          onClick={onClick}
        />
      );
      await user.click(screen.getByText('Clickable'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be clickable (cursor-pointer) when onClick provided', () => {
      const { container } = render(
        <ListRow
          variant="player"
          name="Test"
          subtitle="0W / 0L"
          elo={1000}
          onClick={() => {}}
        />
      );
      const row = container.firstChild as HTMLElement;
      expect(row).toHaveClass('cursor-pointer');
    });
  });
});
