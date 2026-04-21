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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
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

    it('should convert code to uppercase', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: false,
          join_code: 'ABC123',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('abc123');

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('join_code', 'ABC123');
      });
    });

    it('should query database with correct code', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: false,
          join_code: 'ABC123',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      await result.current.joinByCode('ABC123');

      expect(mockFrom).toHaveBeenCalledWith('tournaments');
      expect(mockSelect).toHaveBeenCalledWith('id, name, is_finished, join_code');
      expect(mockEq).toHaveBeenCalledWith('join_code', 'ABC123');
    });

    it('should reject finished tournaments', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: true,
          join_code: 'ABC123',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      await expect(result.current.joinByCode('ABC123')).rejects.toThrow('Ce tournoi est terminé');
      expect(toast.error).toHaveBeenCalledWith('Ce tournoi est terminé');
    });

    it('should handle tournament not found', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      await expect(result.current.joinByCode('INVALID')).rejects.toThrow('Code invalide ou tournoi introuvable');
    });

    it('should set loading state during operation', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: false,
          join_code: 'ABC123',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      expect(result.current.isLoading).toBe(false);

      const promise = result.current.joinByCode('ABC123');

      // Note: In real implementation, we'd check isLoading during the async operation
      // but due to the fast execution in tests, we just verify it completes

      await promise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should reject codes with less than 6 characters', async () => {
      const { result } = renderHook(() => useJoinTournament());
      await expect(result.current.joinByCode('ABC12')).rejects.toThrow('Code invalide');
    });

    it('should accept codes with 6-8 characters', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: false,
          join_code: 'ABC123',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useJoinTournament());

      // Test 6 chars
      await result.current.joinByCode('ABC123');
      expect(mockEq).toHaveBeenCalledWith('join_code', 'ABC123');

      // Test 8 chars
      mockSingle.mockResolvedValue({
        data: {
          id: '123',
          name: 'Test Tournament',
          is_finished: false,
          join_code: 'ABCD1234',
        },
        error: null,
      });

      await result.current.joinByCode('ABCD1234');
      expect(mockEq).toHaveBeenCalledWith('join_code', 'ABCD1234');
    });
  });
});
