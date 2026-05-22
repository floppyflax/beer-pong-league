/**
 * LeagueDashboard — mig 028 lifecycle (Pause / Reprendre / Clôturer / Nouvelle saison).
 *
 * Verifies:
 *   - FAB caché en `paused` / `finished`.
 *   - Bouton "Mettre en pause" actif sur ligue `active`, "Reprendre" sur `paused`,
 *     "Réouvrir" sur `finished`.
 *   - Bouton "Nouvelle saison" appelle `startNewLeagueSeason` après confirmation.
 *   - Banner `league-lifecycle-banner` rendu en paused/finished.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LeagueDashboard } from '../../../src/pages/LeagueDashboard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'lg-1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseLeague = {
  id: 'lg-1',
  name: 'Ma Ligue',
  type: 'season' as const,
  createdAt: '2026-05-01T10:00:00.000Z',
  players: [],
  matches: [],
  events: [],
  creator_user_id: 'creator-id',
  creator_anonymous_user_id: null,
  anti_cheat_enabled: false,
  pausedAt: null as string | null,
  endedAt: null as string | null,
  currentSeasonNumber: 1,
  currentSeasonStartedAt: '2026-05-01T10:00:00.000Z',
  // Mig 029 — config champs
  plannedStartAt: null as string | null,
  plannedEndAt: null as string | null,
  seasonDurationDays: null as number | null,
  maxPlayers: null as number | null,
  isPrivate: true,
  defaultFormat: null as '1v1' | '2v2' | '3v3' | 'libre' | null,
};

const pauseLeague = vi.fn();
const resumeLeague = vi.fn();
const finishLeague = vi.fn();
const reopenLeague = vi.fn();
const startNewLeagueSeason = vi.fn();

const mockCtx: {
  leagues: Array<typeof baseLeague>;
  events: never[];
  addPlayer: ReturnType<typeof vi.fn>;
  deleteLeague: ReturnType<typeof vi.fn>;
  pauseLeague: typeof pauseLeague;
  resumeLeague: typeof resumeLeague;
  finishLeague: typeof finishLeague;
  reopenLeague: typeof reopenLeague;
  startNewLeagueSeason: typeof startNewLeagueSeason;
  isLoadingInitialData: boolean;
  reloadData: ReturnType<typeof vi.fn>;
} = {
  leagues: [baseLeague],
  events: [],
  addPlayer: vi.fn(),
  deleteLeague: vi.fn(),
  pauseLeague,
  resumeLeague,
  finishLeague,
  reopenLeague,
  startNewLeagueSeason,
  isLoadingInitialData: false,
  reloadData: vi.fn(),
};

vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: () => mockCtx,
}));

const permissionsMock = vi.fn(() => ({ isAdmin: true, canInvite: true }));
vi.mock('../../../src/hooks/useDetailPagePermissions', () => ({
  useDetailPagePermissions: () => permissionsMock(),
}));

vi.mock('../../../src/hooks/useUnclaimedGuests', () => ({
  useUnclaimedGuests: () => ({ guests: [], refresh: vi.fn() }),
}));

// Mig 032 — usePendingMatches reads auth context + queries Supabase; mock it
// so these lifecycle tests don't need an AuthProvider wrapper.
vi.mock('../../../src/hooks/usePendingMatches', () => ({
  usePendingMatches: () => ({
    pendingMatches: [],
    count: 0,
    isLoading: false,
    refresh: vi.fn(),
    confirmMatch: vi.fn(),
    rejectMatch: vi.fn(),
  }),
}));

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <LeagueDashboard />
    </BrowserRouter>,
  );

describe('LeagueDashboard — lifecycle (mig 028)', () => {
  beforeEach(() => {
    pauseLeague.mockReset();
    resumeLeague.mockReset();
    finishLeague.mockReset();
    reopenLeague.mockReset();
    startNewLeagueSeason.mockReset();
    startNewLeagueSeason.mockResolvedValue(2);
    permissionsMock.mockReturnValue({ isAdmin: true, canInvite: true });
    mockCtx.leagues = [{ ...baseLeague }];
  });

  it('active: shows FAB, "Mettre en pause", "Nouvelle saison" + no banner', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: 'Nouveau match' })).toBeInTheDocument();
    expect(screen.queryByTestId('league-lifecycle-banner')).not.toBeInTheDocument();

    const pauseBtn = screen.getByRole('button', { name: /Mettre en pause/i });
    fireEvent.click(pauseBtn);
    expect(pauseLeague).toHaveBeenCalledWith('lg-1');
  });

  it('paused: hides FAB, shows banner, exposes "Reprendre"', () => {
    mockCtx.leagues = [{ ...baseLeague, pausedAt: '2026-05-20T10:00:00.000Z' }];
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Nouveau match' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('league-lifecycle-banner')).toHaveTextContent(
      /Ligue en pause/i,
    );

    fireEvent.click(screen.getByRole('button', { name: /Reprendre la ligue/i }));
    expect(resumeLeague).toHaveBeenCalledWith('lg-1');
  });

  it('finished: hides FAB, shows banner, no inline "Réouvrir" (moved to Paramètres, mig 029)', () => {
    mockCtx.leagues = [{ ...baseLeague, endedAt: '2026-05-20T10:00:00.000Z' }];
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Nouveau match' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('league-lifecycle-banner')).toHaveTextContent(
      /Ligue terminée/i,
    );

    // mig 029 — Clôturer/Réouvrir a migré vers la page Paramètres : plus
    // d'action lifecycle inline dans le dashboard.
    expect(
      screen.queryByRole('button', { name: /Réouvrir/i }),
    ).not.toBeInTheDocument();
  });

  it('"Nouvelle saison" a migré vers Paramètres — aucun bouton inline (mig 029)', () => {
    renderDashboard();

    // Le cycle de saison (clôture → nouvelle saison) se gère désormais depuis
    // les Paramètres ; le dashboard n'expose plus l'action directement.
    expect(
      screen.queryByRole('button', { name: /Démarrer la Saison/i }),
    ).not.toBeInTheDocument();
    expect(startNewLeagueSeason).not.toHaveBeenCalled();
  });

  it('non-admin: pas de bouton lifecycle, banner visible pour info', () => {
    permissionsMock.mockReturnValue({ isAdmin: false, canInvite: true });
    mockCtx.leagues = [{ ...baseLeague, pausedAt: '2026-05-20T10:00:00.000Z' }];
    renderDashboard();

    expect(screen.getByTestId('league-lifecycle-banner')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Reprendre/i }),
    ).not.toBeInTheDocument();
  });

  describe('mig 029 — not_started + reminders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T12:00:00.000Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('not_started: hides FAB, shows lifecycle banner, no admin lifecycle action', () => {
      mockCtx.leagues = [
        {
          ...baseLeague,
          plannedStartAt: '2026-06-01T00:00:00.000Z',
          currentSeasonStartedAt: '2026-06-01T00:00:00.000Z',
        },
      ];
      renderDashboard();

      expect(
        screen.queryByRole('button', { name: 'Nouveau match' }),
      ).not.toBeInTheDocument();
      const banner = screen.getByTestId('league-lifecycle-banner');
      expect(banner).toHaveTextContent(/Ligue non démarrée/i);
      // Pas d'action "Mettre en pause" ni "Nouvelle saison" en not_started.
      expect(
        screen.queryByRole('button', { name: /Mettre en pause/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Démarrer la Saison/i }),
      ).not.toBeInTheDocument();
    });

    it('active + season overdue: shows reminder banner pointing to nouvelle saison', () => {
      mockCtx.leagues = [
        {
          ...baseLeague,
          currentSeasonStartedAt: '2026-01-01T00:00:00.000Z',
          seasonDurationDays: 30, // expired since Feb
        },
      ];
      renderDashboard();

      // FAB toujours visible (lifecycle = active)
      expect(
        screen.getByRole('button', { name: 'Nouveau match' }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('league-lifecycle-banner')).not.toBeInTheDocument();
      const reminder = screen.getByTestId('league-reminder-banner');
      expect(reminder).toHaveTextContent(/Saison 1 échue/i);
    });

    it('active + league overdue: shows reminder banner for end_date', () => {
      mockCtx.leagues = [
        {
          ...baseLeague,
          plannedEndAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      renderDashboard();

      const reminder = screen.getByTestId('league-reminder-banner');
      expect(reminder).toHaveTextContent(/Date de fin dépassée/i);
    });

    it('lifecycle banner has priority over reminder banner', () => {
      mockCtx.leagues = [
        {
          ...baseLeague,
          pausedAt: '2026-05-20T10:00:00.000Z',
          currentSeasonStartedAt: '2026-01-01T00:00:00.000Z',
          seasonDurationDays: 30, // overdue, mais on est en pause
        },
      ];
      renderDashboard();

      expect(screen.getByTestId('league-lifecycle-banner')).toBeInTheDocument();
      expect(
        screen.queryByTestId('league-reminder-banner'),
      ).not.toBeInTheDocument();
    });
  });
});
