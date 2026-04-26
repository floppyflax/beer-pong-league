/**
 * AnonymousUserService — kept under the legacy name; post-mig 022 it just
 * manages the `public.users` row for anonymous identities (no separate
 * anonymous_users table any more).
 *
 * An anonymous user = `users` row with `is_anonymous = TRUE` and
 * `auth_user_id IS NULL`. Identified by `device_fingerprint`.
 */

import { supabase } from '../lib/supabase';
import type { LocalUser } from './LocalUserService';

export interface AnonymousUserRow {
  id: string;
  pseudo: string;
  device_fingerprint: string | null;
  is_anonymous: boolean;
  auth_user_id: string | null;
  created_at: string | null;
}

class AnonymousUserService {
  async createAnonymousUser(localUser: LocalUser): Promise<AnonymousUserRow | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: localUser.anonymousUserId,
            pseudo: localUser.pseudo,
            device_fingerprint: localUser.deviceFingerprint || null,
            is_anonymous: true,
          } as never,
          { onConflict: 'id', ignoreDuplicates: false }
        )
        .select()
        .single();
      if (error) {
        console.error('Error creating anonymous user:', error);
        return null;
      }
      return data as unknown as AnonymousUserRow;
    } catch (error) {
      console.error('Exception creating anonymous user:', error);
      return null;
    }
  }

  async getAnonymousUser(id: string): Promise<AnonymousUserRow | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        return null;
      }
      return data as unknown as AnonymousUserRow;
    } catch (error) {
      console.error('Exception fetching user:', error);
      return null;
    }
  }

  /**
   * Find an anonymous (unclaimed) user by device fingerprint.
   * "Unclaimed" = `is_anonymous = true` AND `auth_user_id IS NULL`.
   */
  async findAnonymousUserByFingerprint(fingerprint: string): Promise<AnonymousUserRow | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('device_fingerprint', fingerprint)
        .eq('is_anonymous', true)
        .is('auth_user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        return null;
      }
      return data as unknown as AnonymousUserRow;
    } catch (error) {
      console.error('Exception finding user by fingerprint:', error);
      return null;
    }
  }

  async updateAnonymousUser(
    id: string,
    updates: { pseudo?: string; device_fingerprint?: string | null }
  ): Promise<AnonymousUserRow | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error updating user:', error);
        return null;
      }
      return data as unknown as AnonymousUserRow;
    } catch (error) {
      console.error('Exception updating user:', error);
      return null;
    }
  }

  async syncLocalUserToSupabase(localUser: LocalUser): Promise<AnonymousUserRow | null> {
    const existing = await this.getAnonymousUser(localUser.anonymousUserId);
    if (existing) {
      return await this.updateAnonymousUser(localUser.anonymousUserId, {
        pseudo: localUser.pseudo,
        device_fingerprint: localUser.deviceFingerprint || null,
      });
    }
    return await this.createAnonymousUser(localUser);
  }
}

export const anonymousUserService = new AnonymousUserService();
