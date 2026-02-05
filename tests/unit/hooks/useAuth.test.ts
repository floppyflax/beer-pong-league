import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/AuthService';

// Mock AuthService
vi.mock('@/services/AuthService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    signInWithOTP: vi.fn(),
    signOut: vi.fn(),
    getUserProfile: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load authenticated user on mount', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should load null user when not authenticated', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should provide signInWithOTP function', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(authService.signInWithOTP).mockResolvedValue({ error: null });
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.signInWithOTP('test@example.com');

    expect(authService.signInWithOTP).toHaveBeenCalledWith('test@example.com');
    expect(response.error).toBeNull();
  });

  it('should provide signOut function', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(authService.signOut).mockResolvedValue({ error: null });
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Call signOut
    await result.current.signOut();

    // Verify signOut was called
    expect(authService.signOut).toHaveBeenCalled();
    
    // State should update immediately after signOut completes
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should listen to auth state changes', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockUnsubscribe = vi.fn();
    let authCallback: ((user: any) => void) | null = null;

    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(authService.getUserProfile).mockResolvedValue(null);
    vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      } as any;
    });

    const { result, unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate auth state change (user signs in)
    if (authCallback) {
      authCallback(mockUser);
    }

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Cleanup should unsubscribe
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should create user profile if not exists on sign in', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    let authCallback: ((user: any) => void) | null = null;

    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    vi.mocked(authService.getUserProfile).mockResolvedValue(null);
    vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any;
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate user sign in
    if (authCallback) {
      authCallback(mockUser);
    }

    await waitFor(() => {
      expect(authService.getUserProfile).toHaveBeenCalledWith('user-123');
    });
  });
});
