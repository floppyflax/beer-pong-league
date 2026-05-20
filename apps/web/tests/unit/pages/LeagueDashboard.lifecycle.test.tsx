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

  it('finished: hides FAB, shows banner, exposes "Réouvrir"', () => {
    mockCtx.leagues = [{ ...baseLeague, endedAt: '2026-05-20T10:00:00.000Z' }];
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Nouveau match' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('league-lifecycle-banner')).toHaveTextContent(
      /Ligue terminée/i,
    );

    fireEvent.click(screen.getByRole('button', { name: /Réouvrir la ligue/i }));
    expect(reopenLeague).toHaveBeenCalledWith('lg-1');
  });

  it('"Nouvelle saison" appelle startNewLeagueSeason après confirmation', () => {
    const confirmStub = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmStub);
    renderDashboard();

    const newSeasonBtn = screen.getByRole('button', { name: /Démarrer la Saison 2/i });
    fireEvent.click(newSeasonBtn);

    expect(confirmStub).toHaveBeenCalled();
    expect(startNewLeagueSeason).toHaveBeenCalledWith('lg-1');
    vi.unstubAllGlobals();
  });

  it('"Nouvelle saison" ne fait rien si l\'admin annule la confirm', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /Démarrer la Saison 2/i }));
    expect(startNewLeagueSeason).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
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
});
