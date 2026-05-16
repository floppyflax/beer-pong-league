/**
 * Authentication service — Supabase Auth with OTP (magic link).
 * Platform-specific env vars are accessed via getEnv() injected by initShared().
 */

import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { getEnv } from '../runtime/env';

class AuthService {
  private readonly TEST_ACCOUNTS = [
    { email: 'admin@admin.com', password: 'admin123' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'devadmin@test.com', password: 'admin123' },
    { email: 'devtest@test.com', password: 'test123' },
  ];

  private isTestAccount(email: string): boolean {
    if (!getEnv().isDev) return false;
    return this.TEST_ACCOUNTS.some((acc) => acc.email === email);
  }

  private getTestAccountPassword(email: string): string | null {
    if (!getEnv().isDev) return null;
    const account = this.TEST_ACCOUNTS.find((acc) => acc.email === email);
    return account?.password ?? null;
  }

  private async signInWithTestAccount(
    email: string,
  ): Promise<{ error: Error | null; usedOTP?: boolean }> {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };

    const password = this.getTestAccountPassword(email);
    if (!password) return { error: new Error('Test account password not found') };

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.warn('⚠️ Password auth failed for test account:', error.message);
        console.log('🔄 Falling back to OTP for test account...');

        const otpResult = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: getEnv().urls.authCallback },
        });

        if (otpResult.error) {
          console.error('❌ OTP fallback also failed:', otpResult.error.message);
          return {
            error: new Error('Password auth not enabled. Please check your email for OTP link.'),
            usedOTP: true,
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

  async signInWithOTP(email: string): Promise<{ error: Error | null; usedOTP?: boolean }> {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };

    if (this.isTestAccount(email)) {
      console.log('🧪 Dev mode: Using test account login for', email);
      return this.signInWithTestAccount(email);
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getEnv().urls.authCallback },
      });

      if (error) return { error };
      return { error: null, usedOTP: true };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
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

  async getSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
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

  async signOut(): Promise<{ error: Error | null }> {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }

  async createUserProfile(userId: string, pseudo: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').insert({ id: userId, pseudo });
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

  async updateUserProfile(
    userId: string,
    updates: { pseudo?: string; avatar_url?: string },
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;

      // Propagate the pseudo to the user's players row so every league /
      // event they joined reflects the rename. Display reads
      // `pseudo_override || players.pseudo` — overriding admin-set values
      // is deliberately left out (RPC only updates players.pseudo).
      if (updates.pseudo !== undefined) {
        const { error: rpcError } = await supabase.rpc('propagate_user_pseudo');
        if (rpcError) {
          // Non-fatal: the users row is already updated, only the
          // snapshots stay stale — log and continue.
          console.warn('propagate_user_pseudo failed:', rpcError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  async getUserProfile(userId: string) {
    const supabase = getSupabase();
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
