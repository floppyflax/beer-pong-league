import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJoinTournament } from '../../../src/hooks/useJoinTournament';
import { supabase } from '../../../src/lib/supabase';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseAvailable: () => true,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../src/context/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
  }),
}));

vi.mock('../../../src/hooks/useIdentity', () => ({
  useIdentity: () => ({
    localUser: null,
    initializeAnonymousUser: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * Helper — wires up a fresh chain of mocks for the supabase query builder.
 *
 * The hook (post mig 016) probes BOTH `tournaments` then `leagues` using
 * `.maybeSingle()`. We provide one mock response per `from(table)` call so the
 * tests can simulate "tournament hit", "league hit" or "neither" without
 * interfering with each other.
 */
type ProbeResult = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

function mockSupabaseProbes(...responses: ProbeResult[]) {
  const eqMocks: ReturnType<typeof vi.fn>[] = [];
  let callIndex = 0;

  vi.mocked(supabase.from).mockImplementation(() => {
    const response = responses[callIndex] ?? { data: null, error: null };
    callIndex += 1;
    const maybeSingle = vi.fn().mockResolvedValue(response);
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    eqMocks.push(eq);
    const select = vi.fn().mockReturnValue({ eq });
    return { select } as unknown as ReturnType<typeof supabase.from>;
  });

  return { eqMocks };
}

describe('useJoinTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('joinByCode', () => {
    it('should validate code format and reject invalid codes', async () => {
      const { result } = renderHook(() => useJoinTournament());

      // Test invalid codes
      await expect(result.current.joinByCode('ABC')).rejects.toThrow('Code invalide');
      await expect(result.current.joinByCode('ABC123456789')).rejects.toThrow('Code invalide');
      await expect(result.current.joinByCode('abc@#$')).rejects.toThrow('Code invalide');
    });

    it('should convert code to uppercase before probing', async () => {
      const { eqMocks } = mockSupabaseProbes({
        data: { id: '123', name: 'Test Tournament', is_finished: false, join_code: 'ABC123' },
        error: null,
      });

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('abc123');

      await waitFor(() => {
        expect(eqMocks[0]).toHaveBeenCalledWith('join_code', 'ABC123');
      });
    });

    it('should query the tournaments table first with the right shape', async () => {
      mockSupabaseProbes({
        data: { id: '123', name: 'Test Tournament', is_finished: false, join_code: 'ABC123' },
        error: null,
      });

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('ABC123');

      expect(supabase.from).toHaveBeenNthCalledWith(1, 'tournaments');
      expect(mockNavigate).toHaveBeenCalledWith('/tournament/123/join');
    });

    it('should reject finished tournaments', async () => {
      mockSupabaseProbes({
        data: { id: '123', name: 'Test Tournament', is_finished: true, join_code: 'ABC123' },
        error: null,
      });

      const { result } = renderHook(() => useJoinTournament());

      await expect(result.current.joinByCode('ABC123')).rejects.toThrow('Ce tournoi est terminé');
      expect(toast.error).toHaveBeenCalledWith('Ce tournoi est terminé');
    });

    it('should fall through to leagues when tournament misses, and route accordingly', async () => {
      mockSupabaseProbes(
        { data: null, error: null },
        { data: { id: 'lg-1', name: 'Beer Pong Spring', join_code: 'LEAG12' }, error: null },
      );

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('LEAG12');

      expect(supabase.from).toHaveBeenNthCalledWith(1, 'tournaments');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'leagues');
      expect(mockNavigate).toHaveBeenCalledWith('/league/lg-1/join');
    });

    it('should throw a generic "neither found" error when both probes miss', async () => {
      mockSupabaseProbes(
        { data: null, error: null },
        { data: null, error: null },
      );

      const { result } = renderHook(() => useJoinTournament());

      await expect(result.current.joinByCode('NOPE12')).rejects.toThrow(
        'Code invalide — aucun tournoi ni ligue trouvé',
      );
    });

    it('should reset loading state after a successful tournament join', async () => {
      mockSupabaseProbes({
        data: { id: '123', name: 'Test Tournament', is_finished: false, join_code: 'ABC123' },
        error: null,
      });

      const { result } = renderHook(() => useJoinTournament());

      expect(result.current.isLoading).toBe(false);
      await result.current.joinByCode('ABC123');
      expect(result.current.isLoading).toBe(false);
    });

    it('should reject codes with less than 6 characters', async () => {
      const { result } = renderHook(() => useJoinTournament());
      await expect(result.current.joinByCode('ABC12')).rejects.toThrow('Code invalide');
    });

    it('should accept codes with 6-8 characters', async () => {
      mockSupabaseProbes(
        { data: { id: '123', name: 'Test Tournament', is_finished: false, join_code: 'ABC123' }, error: null },
        { data: { id: '456', name: 'Test 8', is_finished: false, join_code: 'ABCD1234' }, error: null },
      );

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('ABC123');
      await result.current.joinByCode('ABCD1234');

      expect(supabase.from).toHaveBeenNthCalledWith(1, 'tournaments');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'tournaments');
    });
  });
});
