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

// Mock Supabase
const mockGetSession = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();

vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (table: string) => ({
      select: () => ({ eq: () => ({ single: () => mockSingle() }) }),
      insert: () => mockInsert(),
    }),
  },
}));

// Mock IdentityContext
vi.mock('../../../src/context/IdentityContext', () => ({
  useIdentityContext: () => ({
    localUser: null,
  }),
}));

// Mock IdentityMergeService
vi.mock('../../../src/services/IdentityMergeService', () => ({
  identityMergeService: {
    mergeAnonymousToUser: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('AuthCallback - returnTo Handling (Story 9.1 Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockNavigate.mockClear();
  });

  describe('SessionStorage returnTo', () => {
    it('should redirect to returnTo destination from sessionStorage', async () => {
      // Setup: Store returnTo
      sessionStorage.setItem('authReturnTo', '/create-tournament');

      // Mock successful auth
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

      // Wait for redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/create-tournament');
      }, { timeout: 3000 });
    });

    it('should clean up sessionStorage after reading returnTo', async () => {
      // Setup
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

      // Wait a bit for cleanup to happen
      await waitFor(() => {
        expect(sessionStorage.getItem('authReturnTo')).toBeNull();
      }, { timeout: 3000 });
    });

    it('should redirect to home when no returnTo is set', async () => {
      // No returnTo in sessionStorage

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

      render(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText(/Connexion en cours/i)).toBeInTheDocument();
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
});
