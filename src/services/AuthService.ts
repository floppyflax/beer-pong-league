/**
 * Service for managing authentication with Supabase Auth
 * Handles email + OTP (magic link) authentication
 */

import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

class AuthService {
  /**
   * Send OTP to email (magic link)
   */
  async signInWithOTP(email: string): Promise<{ error: Error | null }> {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    
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

      return { error: null };
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


