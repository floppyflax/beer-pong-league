/**
 * Service for managing anonymous users in Supabase
 * Handles creation and sync of anonymous user identities
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { LocalUser } from './LocalUserService';

type AnonymousUser = Database['public']['Tables']['anonymous_users']['Row'];
type AnonymousUserInsert = Database['public']['Tables']['anonymous_users']['Insert'];

class AnonymousUserService {
  /**
   * Create an anonymous user in Supabase
   * Returns the created user or null if offline/error
   */
  async createAnonymousUser(
    localUser: LocalUser
  ): Promise<AnonymousUser | null> {
    if (!supabase) return null; // Offline mode
    
    try {
      const insert: AnonymousUserInsert = {
        id: localUser.anonymousUserId,
        pseudo: localUser.pseudo,
        device_fingerprint: localUser.deviceFingerprint || null,
      };

      const { data, error } = await supabase
        .from('anonymous_users')
        .upsert(insert, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating anonymous user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception creating anonymous user:', error);
      return null;
    }
  }

  /**
   * Get anonymous user by ID
   */
  async getAnonymousUser(id: string): Promise<AnonymousUser | null> {
    if (!supabase) return null; // Offline mode
    
    try {
      const { data, error } = await supabase
        .from('anonymous_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching anonymous user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching anonymous user:', error);
      return null;
    }
  }

  /**
   * Find anonymous user by device fingerprint
   */
  async findAnonymousUserByFingerprint(
    fingerprint: string
  ): Promise<AnonymousUser | null> {
    if (!supabase) return null; // Offline mode
    
    try {
      const { data, error } = await supabase
        .from('anonymous_users')
        .select('*')
        .eq('device_fingerprint', fingerprint)
        .is('merged_to_user_id', null) // Not merged yet
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Not found is OK
        if (error.code === 'PGRST116') return null;
        console.error('Error finding anonymous user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception finding anonymous user:', error);
      return null;
    }
  }

  /**
   * Update anonymous user
   */
  async updateAnonymousUser(
    id: string,
    updates: Partial<AnonymousUserInsert>
  ): Promise<AnonymousUser | null> {
    if (!supabase) return null; // Offline mode
    
    try {
      const { data, error } = await supabase
        .from('anonymous_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating anonymous user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception updating anonymous user:', error);
      return null;
    }
  }

  /**
   * Sync local user to Supabase
   * Creates if doesn't exist, updates if exists
   */
  async syncLocalUserToSupabase(
    localUser: LocalUser
  ): Promise<AnonymousUser | null> {
    // Try to find existing user
    const existing = await this.getAnonymousUser(localUser.anonymousUserId);
    
    if (existing) {
      // Update if needed
      return await this.updateAnonymousUser(localUser.anonymousUserId, {
        pseudo: localUser.pseudo,
        device_fingerprint: localUser.deviceFingerprint || null,
      });
    }

    // Create new
    return await this.createAnonymousUser(localUser);
  }
}

export const anonymousUserService = new AnonymousUserService();


