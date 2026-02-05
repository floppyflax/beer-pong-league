import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/AuthService';
import { supabase } from '@/lib/supabase';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithOTP', () => {
    it('should call supabase.auth.signInWithOtp with email', async () => {
      vi.mocked(supabase!.auth.signInWithOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await authService.signInWithOTP('test@example.com');

      expect(supabase!.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      });
      expect(result.error).toBeNull();
    });

    it('should return error when supabase call fails', async () => {
      const mockError = new Error('Supabase error');
      vi.mocked(supabase!.auth.signInWithOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const result = await authService.signInWithOTP('test@example.com');

      expect(result.error).toBe(mockError);
    });

    it('should handle exception', async () => {
      const mockError = new Error('Network error');
      vi.mocked(supabase!.auth.signInWithOtp).mockRejectedValue(mockError);

      const result = await authService.signInWithOTP('test@example.com');

      expect(result.error).toBe(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      vi.mocked(supabase!.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(supabase!.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(supabase!.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error') as any,
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session when exists', async () => {
      const mockSession = { user: { id: 'user-123' }, access_token: 'token' };
      vi.mocked(supabase!.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      vi.mocked(supabase!.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      vi.mocked(supabase!.auth.signOut).mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(supabase!.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('should return error when signOut fails', async () => {
      const mockError = new Error('SignOut failed');
      vi.mocked(supabase!.auth.signOut).mockResolvedValue({ error: mockError as any });

      const result = await authService.signOut();

      expect(result.error).toBe(mockError);
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      vi.mocked(supabase!.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      } as any);

      authService.onAuthStateChange(mockCallback);

      expect(supabase!.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('createUserProfile', () => {
    it('should insert user profile into users table', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockInsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({ insert: mockInsert });

      const result = await authService.createUserProfile('user-123', 'TestUser');

      expect(supabase!.from).toHaveBeenCalledWith('users');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        pseudo: 'TestUser',
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Insert failed') 
      });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);
      mockFrom.mockReturnValue({ insert: mockInsert });

      const result = await authService.createUserProfile('user-123', 'TestUser');

      expect(result).toBe(false);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from users table', async () => {
      const mockProfile = { id: 'user-123', pseudo: 'TestUser' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase!.from).mockImplementation(mockFrom);

      const profile = await authService.getUserProfile('user-123');

      expect(supabase!.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(profile).toEqual(mockProfile);
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

      const profile = await authService.getUserProfile('user-123');

      expect(profile).toBeNull();
    });
  });
});
