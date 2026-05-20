/**
 * EventDashboard — mig 027 lifecycle (Démarrer / Pause / Reprendre).
 *
 * Verifies:
 *   - FAB is hidden when lifecycle disallows match logging (not_started/paused).
 *   - The contextual admin action ("Démarrer" / "Mettre en pause" / "Reprendre")
 *     shows based on lifecycle and calls the matching context method.
 *   - The lifecycle banner is rendered for non-admin players too.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EventDashboard } from '../../../src/pages/EventDashboard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'evt-1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  default: { success: vi.fn(), error: vi.fn() },
}));

const TODAY = '2026-05-20';
const TOMORROW = '2026-05-21';

const baseEvent = {
  id: 'evt-1',
  name: 'Lifecycle Cup',
  joinCode: 'XYZ123',
  date: TOMORROW,
  format: 'libre' as const,
  formatType: 'fixed' as const,
  team1Size: 2,
  team2Size: 2,
  status: 'active' as const,
  isFinished: false,
  startedAt: null,
  pausedAt: null,
  matches: [],
  playerIds: [],
  creator_user_id: 'creator-id',
  creator_anonymous_user_id: null,
  maxPlayers: 16,
  anti_cheat_enabled: false,
  leagueId: null,
};

const startEvent = vi.fn();
const pauseEvent = vi.fn();
const resumeEvent = vi.fn();

const mockCtx: {
  events: Array<typeof baseEvent>;
  leagues: never[];
  recordEventMatch: ReturnType<typeof vi.fn>;
  deleteEvent: ReturnType<typeof vi.fn>;
  toggleEventStatus: ReturnType<typeof vi.fn>;
  startEvent: typeof startEvent;
  pauseEvent: typeof pauseEvent;
  resumeEvent: typeof resumeEvent;
  updateEvent: ReturnType<typeof vi.fn>;
  getEventLocalRanking: ReturnType<typeof vi.fn>;
  getLeagueGlobalRanking: ReturnType<typeof vi.fn>;
  addPlayer: ReturnType<typeof vi.fn>;
  addPlayerToEvent: ReturnType<typeof vi.fn>;
  addGuestPlayerToEvent: ReturnType<typeof vi.fn>;
  associateEventToLeague: ReturnType<typeof vi.fn>;
  isLoadingInitialData: boolean;
  reloadData: ReturnType<typeof vi.fn>;
} = {
  events: [baseEvent],
  leagues: [],
  recordEventMatch: vi.fn(),
  deleteEvent: vi.fn(),
  toggleEventStatus: vi.fn(),
  startEvent,
  pauseEvent,
  resumeEvent,
  updateEvent: vi.fn(),
  getEventLocalRanking: vi.fn(() => []),
  getLeagueGlobalRanking: vi.fn(() => []),
  addPlayer: vi.fn(),
  addPlayerToEvent: vi.fn(),
  addGuestPlayerToEvent: vi.fn(),
  associateEventToLeague: vi.fn(),
  isLoadingInitialData: false,
  reloadData: vi.fn(),
};

vi.mock('../../../src/context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'creator-id', email: 'a@b.c' },
    isAuthenticated: true,
    signInWithOTP: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../../src/context/LeagueContext', () => ({
  useLeague: () => mockCtx,
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: () => ({ localUser: null }),
}));

const permissionsMock = vi.fn(() => ({ isAdmin: true, canInvite: true }));
vi.mock('../../../src/hooks/useDetailPagePermissions', () => ({
  useDetailPagePermissions: () => permissionsMock(),
}));

vi.mock('../../../src/services/DatabaseService', () => ({
  databaseService: {
    loadEventParticipants: vi.fn().mockResolvedValue([]),
    addLeaguePlayerToEvent: vi.fn().mockResolvedValue('new-tp-id'),
    leaveEvent: vi.fn(),
  },
}));

vi.mock('../../../src/hooks/useUnclaimedGuests', () => ({
  useUnclaimedGuests: () => ({ guests: [], refresh: vi.fn() }),
}));

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <EventDashboard />
    </BrowserRouter>,
  );

describe('EventDashboard — lifecycle (mig 027)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
    startEvent.mockReset();
    pauseEvent.mockReset();
    resumeEvent.mockReset();
    permissionsMock.mockReturnValue({ isAdmin: true, canInvite: true });
    mockCtx.events = [{ ...baseEvent }];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('not_started: hides FAB, shows banner, exposes "Démarrer" for admin', () => {
    mockCtx.events = [{ ...baseEvent, date: TOMORROW }];
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Nouveau match' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('lifecycle-banner')).toHaveTextContent(
      /Événement non démarré/i,
    );
    const startBtn = screen.getByRole('button', { name: /Démarrer/i });
    fireEvent.click(startBtn);
    expect(startEvent).toHaveBeenCalledWith('evt-1');
  });

  it('in_progress: shows FAB and "Mettre en pause" admin action, no banner', () => {
    mockCtx.events = [{ ...baseEvent, date: TODAY }];
    renderDashboard();

    expect(
      screen.getByRole('button', { name: 'Nouveau match' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('lifecycle-banner')).not.toBeInTheDocument();
    const pauseBtn = screen.getByRole('button', { name: /Mettre en pause/i });
    fireEvent.click(pauseBtn);
    expect(pauseEvent).toHaveBeenCalledWith('evt-1');
  });

  it('paused: hides FAB, shows banner, exposes "Reprendre"', () => {
    mockCtx.events = [
      { ...baseEvent, date: TODAY, pausedAt: `${TODAY}T10:00:00.000Z` },
    ];
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Nouveau match' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('lifecycle-banner')).toHaveTextContent(
      /Événement en pause/i,
    );
    const resumeBtn = screen.getByRole('button', { name: /Reprendre/i });
    fireEvent.click(resumeBtn);
    expect(resumeEvent).toHaveBeenCalledWith('evt-1');
  });

  it('not_started: non-admin sees banner but no lifecycle action button', () => {
    permissionsMock.mockReturnValue({ isAdmin: false, canInvite: true });
    mockCtx.events = [{ ...baseEvent, date: TOMORROW }];
    renderDashboard();

    expect(screen.getByTestId('lifecycle-banner')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Démarrer/i }),
    ).not.toBeInTheDocument();
  });
});
