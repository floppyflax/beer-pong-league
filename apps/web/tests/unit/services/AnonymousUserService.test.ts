import { describe, it, expect, vi, beforeEach } from 'vitest';
import { anonymousUserService } from '@/services/AnonymousUserService';
import { supabase } from '@/lib/supabase';
import type { LocalUser } from '@/services/LocalUserService';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('AnonymousUserService', () => {
  const mockLocalUser: LocalUser = {
    anonymousUserId: 'test-anon-123',
    pseudo: 'TestUser',
    createdAt: '2026-01-27T00:00:00.000Z',
    deviceFingerprint: 'test-fingerprint-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnonymousUser', () => {
    it('should create anonymous user in Supabase', async () => {
      const mockData = { id: 'test-anon-123', pseudo: 'TestUser' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.createAnonymousUser(mockLocalUser);

      expect(supabase!.from).toHaveBeenCalledWith('anonymous_users');
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockLocalUser.anonymousUserId,
        pseudo: mockLocalUser.pseudo,
        device_fingerprint: mockLocalUser.deviceFingerprint,
      });
      expect(result).toEqual(mockData);
    });

    it('should return null on error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Insert failed') 
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.createAnonymousUser(mockLocalUser);

      expect(result).toBeNull();
    });
  });

  describe('getAnonymousUser', () => {
    it('should fetch anonymous user by ID', async () => {
      const mockData = { id: 'test-anon-123', pseudo: 'TestUser' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.getAnonymousUser('test-anon-123');

      expect(supabase!.from).toHaveBeenCalledWith('anonymous_users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'test-anon-123');
      expect(result).toEqual(mockData);
    });

    it('should return null on error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Not found') 
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.getAnonymousUser('test-anon-123');

      expect(result).toBeNull();
    });
  });

  describe('findAnonymousUserByFingerprint', () => {
    it('should find anonymous user by device fingerprint', async () => {
      const mockData = { id: 'test-anon-123', device_fingerprint: 'test-fp-123' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.findAnonymousUserByFingerprint('test-fp-123');

      expect(mockEq).toHaveBeenCalledWith('device_fingerprint', 'test-fp-123');
      expect(mockIs).toHaveBeenCalledWith('merged_to_user_id', null);
      expect(result).toEqual(mockData);
    });

    it('should return null when not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } // Not found
      });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.findAnonymousUserByFingerprint('unknown-fp');

      expect(result).toBeNull();
    });
  });

  describe('updateAnonymousUser', () => {
    it('should update anonymous user', async () => {
      const mockData = { id: 'test-anon-123', pseudo: 'UpdatedUser' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.updateAnonymousUser('test-anon-123', {
        pseudo: 'UpdatedUser',
      });

      expect(mockUpdate).toHaveBeenCalledWith({ pseudo: 'UpdatedUser' });
      expect(mockEq).toHaveBeenCalledWith('id', 'test-anon-123');
      expect(result).toEqual(mockData);
    });
  });

  describe('syncLocalUserToSupabase', () => {
    it('should create new user when not exists', async () => {
      // Mock getAnonymousUser to return null (user doesn't exist)
      const mockGetSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockGetEq = vi.fn().mockReturnValue({ single: mockGetSingle });
      const mockGetSelect = vi.fn().mockReturnValue({ eq: mockGetEq });

      // Mock createAnonymousUser
      const mockCreateData = { id: 'test-anon-123', pseudo: 'TestUser' };
      const mockCreateSingle = vi.fn().mockResolvedValue({ data: mockCreateData, error: null });
      const mockCreateSelect = vi.fn().mockReturnValue({ single: mockCreateSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockCreateSelect });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockGetSelect })  // First call for getAnonymousUser
        .mockReturnValueOnce({ insert: mockInsert });    // Second call for createAnonymousUser
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.syncLocalUserToSupabase(mockLocalUser);

      expect(result).toEqual(mockCreateData);
    });

    it('should update existing user', async () => {
      // Mock getAnonymousUser to return existing user
      const mockGetData = { id: 'test-anon-123', pseudo: 'OldUser' };
      const mockGetSingle = vi.fn().mockResolvedValue({ data: mockGetData, error: null });
      const mockGetEq = vi.fn().mockReturnValue({ single: mockGetSingle });
      const mockGetSelect = vi.fn().mockReturnValue({ eq: mockGetEq });

      // Mock updateAnonymousUser
      const mockUpdateData = { id: 'test-anon-123', pseudo: 'TestUser' };
      const mockUpdateSingle = vi.fn().mockResolvedValue({ data: mockUpdateData, error: null });
      const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
      const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockGetSelect })  // First call for getAnonymousUser
        .mockReturnValueOnce({ update: mockUpdate });    // Second call for updateAnonymousUser
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const result = await anonymousUserService.syncLocalUserToSupabase(mockLocalUser);

      expect(result).toEqual(mockUpdateData);
    });
  });
});
