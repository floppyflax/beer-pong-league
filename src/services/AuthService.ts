/**
 * Service for managing authentication with Supabase Auth
 * Handles email + OTP (magic link) authentication
 */

import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

class AuthService {
  // Test account configuration (dev mode only)
  private readonly TEST_ACCOUNTS = [
    { email: 'admin@admin.com', password: 'admin123' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'devadmin@test.com', password: 'admin123' },
    { email: 'devtest@test.com', password: 'test123' },
  ];

  /**
   * Check if email is a test account (dev mode only)
   */
  private isTestAccount(email: string): boolean {
    if (!import.meta.env.DEV) return false;
    return this.TEST_ACCOUNTS.some(acc => acc.email === email);
  }

  /**
   * Get test account password (dev mode only)
   */
  private getTestAccountPassword(email: string): string | null {
    if (!import.meta.env.DEV) return null;
    const account = this.TEST_ACCOUNTS.find(acc => acc.email === email);
    return account?.password ?? null;
  }

  /**
   * Sign in with test account using password (dev mode only)
   * This bypasses the OTP email for testing purposes
   * If password auth fails, falls back to OTP
   */
  private async signInWithTestAccount(email: string): Promise<{ error: Error | null; usedOTP?: boolean }> {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    const password = this.getTestAccountPassword(email);
    if (!password) {
      return { error: new Error('Test account password not found') };
    }

    try {
      // Try password authentication first
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn('⚠️ Password auth failed for test account:', error.message);
        console.log('🔄 Falling back to OTP for test account...');
        
        // Fall back to OTP if password auth is not enabled
        const otpResult = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (otpResult.error) {
          console.error('❌ OTP fallback also failed:', otpResult.error.message);
          return { 
            error: new Error('Password auth not enabled. Please check your email for OTP link.'),
            usedOTP: true
          };
        }

        console.log('✉️ OTP sent to test account email');
        return { error: null, usedOTP: true };
      }

      console.log('🧪 Test account logged in successfully with password:', email);
      return { error: null, usedOTP: false };
    } catch (error) {
      return { error: error as Error, usedOTP: false };
    }
  }

  /**
   * Send OTP to email (magic link)
   * In dev mode, test accounts try password auth first, then fall back to OTP
   */
  async signInWithOTP(email: string): Promise<{ error: Error | null; usedOTP?: boolean }> {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    // Dev mode: Check if this is a test account
    if (this.isTestAccount(email)) {
      console.log('🧪 Dev mode: Using test account login for', email);
      return this.signInWithTestAccount(email);
    }
    
    // Production flow: Send OTP
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null, usedOTP: true };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting user:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Exception getting user:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    if (!supabase) return null;
    
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Exception getting session:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!supabase) {
      // Return a mock subscription if Supabase is not available
      return {
        data: { subscription: { unsubscribe: () => {} } },
      };
    }
    
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }

  /**
   * Create user profile in public.users table after auth
   */
  async createUserProfile(userId: string, pseudo: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase.from('users').insert({
        id: userId,
        pseudo,
      });

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception creating user profile:', error);
      return false;
    }
  }

  /**
   * Get user profile from public.users
   */
  async getUserProfile(userId: string) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }
}

export const authService = new AuthService();


