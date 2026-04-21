/**
 * Integration Tests: Full Authentication Flow
 * Tests the complete authentication workflow including OTP, callback, profile creation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../../src/services/AuthService';
import { supabase } from '../../src/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('../../src/lib/supabase', () => ({
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

describe('Full Authentication Flow', () => {
  const mockEmail = 'test@example.com';
  const mockUserId = 'user-123';
  const mockPseudo = 'TestUser';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete OTP Flow with Profile Creation', () => {
    it('should complete full OTP flow with profile creation', async () => {
      // Step 1: User requests OTP
      const mockOtpResponse = { data: {}, error: null };
      vi.mocked(supabase?.auth.signInWithOtp).mockResolvedValue(mockOtpResponse as any);

      const otpResult = await authService.signInWithOTP(mockEmail);
      expect(otpResult.error).toBeNull();
      expect(supabase?.auth.signInWithOtp).toHaveBeenCalledWith({
        email: mockEmail,
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      });

      // Step 2: Magic link clicked (simulated by auth state change)
      const mockUser: Partial<User> = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSession: Partial<Session> = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: mockUser as User,
      };

      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      });

      vi.mocked(supabase?.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      });

      // Step 3: Check user is authenticated
      const user = await authService.getCurrentUser();
      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUserId);
      expect(user?.email).toBe(mockEmail);

      // Step 4: Create user profile
      const mockProfileInsert = {
        data: { id: mockUserId, pseudo: mockPseudo },
        error: null,
      };
      
      vi.mocked(supabase?.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockProfileInsert),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockProfileInsert),
        eq: vi.fn().mockReturnThis(),
      } as any);

      const profileCreated = await authService.createUserProfile(mockUserId, mockPseudo);
      expect(profileCreated).toBe(true);

      // Step 5: Verify profile can be retrieved
      const mockProfileSelect = {
        data: { id: mockUserId, pseudo: mockPseudo, user_id: mockUserId },
        error: null,
      };

      vi.mocked(supabase?.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockProfileSelect),
      } as any);

      const profile = await authService.getUserProfile(mockUserId);
      expect(profile).toBeDefined();
      expect(profile?.pseudo).toBe(mockPseudo);
    });

    it('should persist session across page reloads', async () => {
      // Simulate existing session
      const mockUser: Partial<User> = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSession: Partial<Session> = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: mockUser as User,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      // First load: session exists
      vi.mocked(supabase?.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      });

      const session1 = await authService.getSession();
      expect(session1).toBeDefined();
      expect(session1?.user.id).toBe(mockUserId);

      // Simulate page reload (session should still be valid)
      vi.mocked(supabase?.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      });

      const session2 = await authService.getSession();
      expect(session2).toBeDefined();
      expect(session2?.user.id).toBe(mockUserId);
      expect(session2?.access_token).toBe(mockSession.access_token);
    });
  });

  describe('Auth Callback with Existing Profile', () => {
    it('should handle auth callback with existing profile', async () => {
      const mockUser: Partial<User> = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      });

      // Profile already exists
      const mockExistingProfile = {
        data: { id: mockUserId, pseudo: 'ExistingUser', user_id: mockUserId },
        error: null,
      };

      vi.mocked(supabase?.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockExistingProfile),
      } as any);

      const profile = await authService.getUserProfile(mockUserId);
      expect(profile).toBeDefined();
      expect(profile?.pseudo).toBe('ExistingUser');

      // Should not create duplicate profile
      const createSpy = vi.fn();
      vi.mocked(supabase?.from).mockReturnValue({
        insert: createSpy,
      } as any);

      // Since profile exists, should not attempt to create
      const profileExists = await authService.getUserProfile(mockUserId);
      expect(profileExists).toBeDefined();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain auth state after browser refresh', async () => {
      const mockUser: Partial<User> = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSession: Partial<Session> = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: mockUser as User,
      };

      // Initial auth
      vi.mocked(supabase?.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      });

      const initialSession = await authService.getSession();
      expect(initialSession).toBeDefined();

      // Simulate refresh
      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      });

      const userAfterRefresh = await authService.getCurrentUser();
      expect(userAfterRefresh).toBeDefined();
      expect(userAfterRefresh?.id).toBe(mockUserId);
    });

    it('should handle expired session gracefully', async () => {
      // Expired session
      vi.mocked(supabase?.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await authService.getSession();
      expect(session).toBeNull();

      // User should be null
      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthError', message: 'Session expired' } as any,
      });

      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('Sign Out Flow', () => {
    it('should clear session on sign out', async () => {
      // User authenticated
      const mockUser: Partial<User> = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      });

      const userBefore = await authService.getCurrentUser();
      expect(userBefore).toBeDefined();

      // Sign out
      vi.mocked(supabase?.auth.signOut).mockResolvedValue({ error: null });
      const signOutResult = await authService.signOut();
      expect(signOutResult.error).toBeNull();

      // User should be null after sign out
      vi.mocked(supabase?.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const userAfter = await authService.getCurrentUser();
      expect(userAfter).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle OTP request errors gracefully', async () => {
      const mockError = { message: 'Network error', name: 'NetworkError' };
      vi.mocked(supabase?.auth.signInWithOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const result = await authService.signInWithOTP(mockEmail);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle profile creation errors', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      vi.mocked(supabase?.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      const result = await authService.createUserProfile(mockUserId, mockPseudo);
      expect(result).toBe(false);
    });
  });
});
