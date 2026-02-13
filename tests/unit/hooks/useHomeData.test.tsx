import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useHomeData } from '../../../src/hooks/useHomeData';

// Type-safe mock interfaces
interface MockSupabaseQuery {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
}

// Mock supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../../src/lib/supabase';

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useHomeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should return loading state initially', () => {
      // Create type-safe mock chain
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as MockSupabaseQuery);

      const { result } = renderHook(() => useHomeData('user-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Data Fetching', () => {
    it('should complete data fetching without error', async () => {
      // Create type-safe mock chain
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as MockSupabaseQuery);

      const { result } = renderHook(() => useHomeData('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle zero matches correctly in stats', async () => {
      // Mock chain with maybeSingle for tournament/league queries
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // elo_history has different chain (select->eq only, no order/limit)
      const mockEloEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEloSelect = vi.fn().mockReturnValue({ eq: mockEloEq });

      vi.mocked(supabase.from).mockImplementation((table: string) => ({
        select: table === 'elo_history' ? mockEloSelect : mockSelect,
        eq: table === 'elo_history' ? mockEloEq : mockEq,
      } as unknown as MockSupabaseQuery));

      const { result } = renderHook(() => useHomeData('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When there are no matches, stats exist but with zeros
      expect(result.current.personalStats).toBeDefined();
      expect(result.current.personalStats?.totalMatches).toBe(0);
      expect(result.current.personalStats?.winRate).toBe(0);
    });
  });

  describe('User ID Handling', () => {
    it('should not fetch when userId is null', () => {
      const { result } = renderHook(() => useHomeData(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastTournament).toBeUndefined();
    });

    it('should fetch when userId is provided', () => {
      // Create type-safe mock chain
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as MockSupabaseQuery);

      const { result } = renderHook(() => useHomeData('user-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
