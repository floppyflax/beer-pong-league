/**
 * LeagueSettings — admin lifecycle actions migrated out of LeagueDashboard (mig 029).
 *
 * LeagueDashboard no longer exposes reopen / start-new-season (cf. comment
 * LeagueDashboard.tsx:204-205); they now live only on the Settings page. This
 * suite is the sole coverage for them:
 *   - finished league: "Réouvrir la ligue" → reopenLeague(leagueId).
 *   - between_seasons season league: "Démarrer la Saison N+1" → window.confirm,
 *     then startNewLeagueSeason(leagueId) on confirm; nothing on cancel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LeagueSettings } from '../../../src/pages/LeagueSettings';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'lg-1' }),
    useNavigate: () => vi.fn(),
  };
});

// `toast` is called both bare (`toast(...)`) and via `.success`/`.error`.
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
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
  scoreValidator: 'opponent' as const,
  pausedAt: null as string | null,
  endedAt: null as string | null,
  currentSeasonNumber: 1,
  currentSeasonStartedAt: '2026-05-01T10:00:00.000Z',
  currentSeasonEndedAt: null as string | null,
  plannedStartAt: null as string | null,
  plannedEndAt: null as string | null,
  seasonDurationDays: null as number | null,
  maxPlayers: null as number | null,
  isPrivate: true,
  defaultFormat: null as '1v1' | '2v2' | '3v3' | 'libre' | null,
};

const updateLeague = vi.fn();
const deleteLeague = vi.fn();
const finishLeague = vi.fn();
const reopenLeague = vi.fn();
const finishCurrentLeagueSeason = vi.fn();
const startNewLeagueSeason = vi.fn();
const reloadData = vi.fn();

const mockCtx: {
  leagues: Array<typeof baseLeague>;
  events: never[];
  updateLeague: typeof updateLeague;
  deleteLeague: typeof deleteLeague;
  finishLeague: typeof finishLeague;
  reopenLeague: typeof reopenLeague;
  finishCurrentLeagueSeason: typeof finishCurrentLeagueSeason;
  startNewLeagueSeason: typeof startNewLeagueSeason;
  isLoadingInitialData: boolean;
  reloadData: typeof reloadData;
} = {
  leagues: [baseLeague],
  events: [],
  updateLeague,
  deleteLeague,
  finishLeague,
  reopenLeague,
  finishCurrentLeagueSeason,
  startNewLeagueSeason,
  isLoadingInitialData: false,
  reloadData,
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

const renderSettings = () =>
  render(
    <BrowserRouter>
      <LeagueSettings />
    </BrowserRouter>,
  );

describe('LeagueSettings — lifecycle actions (mig 029)', () => {
  beforeEach(() => {
    updateLeague.mockReset();
    deleteLeague.mockReset();
    finishLeague.mockReset();
    reopenLeague.mockReset();
    finishCurrentLeagueSeason.mockReset();
    startNewLeagueSeason.mockReset();
    startNewLeagueSeason.mockResolvedValue(2);
    reloadData.mockReset();
    permissionsMock.mockReturnValue({ isAdmin: true, canInvite: true });
    mockCtx.leagues = [{ ...baseLeague }];
  });

  it('finished: "Réouvrir la ligue" calls reopenLeague(leagueId)', () => {
    mockCtx.leagues = [{ ...baseLeague, endedAt: '2026-05-20T10:00:00.000Z' }];
    renderSettings();

    const reopenBtn = screen.getByTestId('settings-reopen-league');
    expect(reopenBtn).toHaveTextContent(/Réouvrir la ligue/i);

    fireEvent.click(reopenBtn);
    expect(reopenLeague).toHaveBeenCalledWith('lg-1');
  });

  it('between_seasons: "Démarrer la Saison N+1" confirms then calls startNewLeagueSeason', () => {
    const confirmStub = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmStub);
    mockCtx.leagues = [
      { ...baseLeague, currentSeasonEndedAt: '2026-05-20T10:00:00.000Z' },
    ];
    renderSettings();

    const startBtn = screen.getByTestId('settings-start-next-season');
    expect(startBtn).toHaveTextContent(/Démarrer la Saison 2/i);

    fireEvent.click(startBtn);
    expect(confirmStub).toHaveBeenCalled();
    expect(startNewLeagueSeason).toHaveBeenCalledWith('lg-1');
    vi.unstubAllGlobals();
  });

  it('between_seasons: cancelling the confirm does NOT call startNewLeagueSeason', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    mockCtx.leagues = [
      { ...baseLeague, currentSeasonEndedAt: '2026-05-20T10:00:00.000Z' },
    ];
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-start-next-season'));
    expect(startNewLeagueSeason).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
