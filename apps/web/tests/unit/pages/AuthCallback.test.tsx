import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthCallback } from '../../../src/pages/AuthCallback';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase — supports both .single() and .maybeSingle() for the two
// different queries AuthCallback performs (users profile + players lookup).
const mockGetSession = vi.fn();
const mockSingle = vi.fn();       // users profile check
const mockMaybeSingle = vi.fn();  // players row lookup
const mockInsert = vi.fn();

vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => mockSingle(),
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
      insert: () => mockInsert(),
    }),
  },
}));

// These three are referenced DIRECTLY (not via arrow fn) inside vi.mock
// factories, so they must be hoisted — otherwise the mock factory runs before
// the const initializer and throws "Cannot access before initialization".
const { mockClearIdentity, mockClaimAnonymousPlayer, mockGetLocalUser } =
  vi.hoisted(() => ({
    mockClearIdentity: vi.fn().mockResolvedValue(undefined),
    mockClaimAnonymousPlayer: vi.fn().mockResolvedValue({ success: true }),
    mockGetLocalUser: vi.fn(),
  }));

// Mock IdentityContext — only clearIdentity is used now (localUser read from storage).
vi.mock('../../../src/context/IdentityContext', () => ({
  useIdentityContext: () => ({
    clearIdentity: mockClearIdentity,
  }),
}));

// Mock localUserService — AuthCallback reads local identity from storage
// directly (not from context) to survive the magic-link new-tab race.
vi.mock('../../../src/services/LocalUserService', () => ({
  localUserService: { getLocalUser: mockGetLocalUser },
}));

// Mock IdentityMergeService
vi.mock('../../../src/services/IdentityMergeService', () => ({
  identityMergeService: {
    mergeAnonymousToUser: vi.fn().mockResolvedValue({ success: true }),
    claimAnonymousPlayer: mockClaimAnonymousPlayer,
  },
}));

describe('AuthCallback - returnTo Handling (Story 9.1 Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    mockNavigate.mockClear();
    // Default: no stored local user (covers existing tests unchanged)
    mockGetLocalUser.mockResolvedValue(null);
    mockMaybeSingle.mockResolvedValue({ data: null });
  });

  describe('SessionStorage returnTo', () => {
    it('should redirect to returnTo destination from sessionStorage', async () => {
      sessionStorage.setItem('authReturnTo', '/create-event');

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user123', email: 'test@test.com' },
          },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/create-event');
      }, { timeout: 3000 });
    });

    it('should clean up sessionStorage after reading returnTo', async () => {
      sessionStorage.setItem('authReturnTo', '/create-league');

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user123', email: 'test@test.com' },
          },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(sessionStorage.getItem('authReturnTo')).toBeNull();
      }, { timeout: 3000 });
    });

    it('should redirect to home when no returnTo is set', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user123', email: 'test@test.com' },
          },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      mockGetSession.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should show success state before redirect', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user123', email: 'test@test.com' },
          },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Connexion réussie/i)).toBeInTheDocument();
      });
    });
  });

  describe('With stored local user — magic-link new-tab scenario (parcours 12)', () => {
    it('calls claimAnonymousPlayer and clears identity when anon player exists', async () => {
      // Simulates: user joined as anon, magic link opens new tab.
      // IdentityContext may be null but localStorage has the identity.
      mockGetLocalUser.mockResolvedValue({
        anonymousUserId: 'anon-1',
        pseudo: 'Alice',
      });
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'auth-1', email: 'alice@test.com' } },
        },
        error: null,
      });
      // users profile doesn't exist → will be inserted
      mockSingle.mockResolvedValue({ data: null });
      // anonymous player found in players table
      mockMaybeSingle.mockResolvedValue({ data: { id: 'player-123' } });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(mockClaimAnonymousPlayer).toHaveBeenCalledWith(
          'event',
          'player-123',
          'auth-1',
        ),
      );
      // clearIdentity called after successful transfer
      expect(mockClearIdentity).toHaveBeenCalled();
    });

    it('does NOT call claimAnonymousPlayer when no anon player row found', async () => {
      mockGetLocalUser.mockResolvedValue({
        anonymousUserId: 'anon-2',
        pseudo: 'Bob',
      });
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'auth-2', email: 'bob@test.com' } },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      // No player row for this anonId
      mockMaybeSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText(/Connexion réussie/i)).toBeInTheDocument(),
      );
      expect(mockClaimAnonymousPlayer).not.toHaveBeenCalled();
      expect(mockClearIdentity).not.toHaveBeenCalled();
    });

    it('does NOT call claimAnonymousPlayer when no stored local identity (parcours 13)', async () => {
      // Already authenticated user clicks magic link again — no local identity
      mockGetLocalUser.mockResolvedValue(null);
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'auth-3', email: 'charlie@test.com' } },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText(/Connexion réussie/i)).toBeInTheDocument(),
      );
      expect(mockClaimAnonymousPlayer).not.toHaveBeenCalled();
    });

    it('localStorage returnTo is preserved and cleared after auth with local user', async () => {
      localStorage.setItem('authReturnTo', '/event/evt-1');
      mockGetLocalUser.mockResolvedValue({
        anonymousUserId: 'anon-3',
        pseudo: 'Dan',
      });
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'auth-4', email: 'dan@test.com' } },
        },
        error: null,
      });
      mockSingle.mockResolvedValue({ data: null });
      mockMaybeSingle.mockResolvedValue({ data: null }); // no player → skip claim
      mockInsert.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/event/evt-1'),
        { timeout: 3000 },
      );
      expect(localStorage.getItem('authReturnTo')).toBeNull();
    });
  });
});
