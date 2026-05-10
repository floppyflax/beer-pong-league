/**
 * PremiumService — freemium gating and premium status checks.
 * Free users: max 2 events, max 6 players per event, no leagues.
 * Premium users: unlimited everything.
 */

import { getSupabase } from '../lib/supabase';
import { getStorage } from '../runtime/storage';

export interface CanCreateEventResult {
  allowed: boolean;
  remaining?: number;
  reason?: string;
  message?: string;
}

const PREMIUM_STORAGE_KEY = 'bpl_premium_status';
const EVENTS_STORAGE_KEY = 'bpl_events';

class PremiumService {
  private isSupabaseAvailable(): boolean {
    return getSupabase() !== null;
  }

  async isPremium(userId: string | null, anonymousUserId: string | null): Promise<boolean> {
    if (!userId && !anonymousUserId) return false;

    const supabase = getSupabase();
    if (this.isSupabaseAvailable() && supabase) {
      try {
        const id = userId || anonymousUserId;
        if (id) {
          const { data, error } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error checking premium status:', error);
            return this.isPremiumFromStorage();
          }

          return data?.is_premium ?? false;
        }
      } catch (error) {
        console.error('Error in isPremium:', error);
        return this.isPremiumFromStorage();
      }
    }

    return this.isPremiumFromStorage();
  }

  async getEventCount(userId: string | null, anonymousUserId: string | null): Promise<number> {
    if (!userId && !anonymousUserId) return 0;

    const supabase = getSupabase();
    if (this.isSupabaseAvailable() && supabase) {
      try {
        const creatorId = userId || anonymousUserId;
        const { count, error } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('creator_user_id', creatorId!);

        if (error) {
          console.error('Error counting events:', error);
          return this.getEventCountFromStorage();
        }

        return count ?? 0;
      } catch (error) {
        console.error('Error in getEventCount:', error);
        return this.getEventCountFromStorage();
      }
    }

    return this.getEventCountFromStorage();
  }

  async canCreateEvent(
    userId: string | null,
    anonymousUserId: string | null,
  ): Promise<CanCreateEventResult> {
    const isPremium = await this.isPremium(userId, anonymousUserId);
    if (isPremium) return { allowed: true };

    const eventCount = await this.getEventCount(userId, anonymousUserId);
    if (eventCount >= 2) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: 'Limite de 2 tournois atteinte. Passez Premium pour créer des tournois illimités !',
      };
    }

    return { allowed: true, remaining: 2 - eventCount };
  }

  async canCreateLeague(userId: string | null, anonymousUserId: string | null): Promise<boolean> {
    return this.isPremium(userId, anonymousUserId);
  }

  async getEventPlayerLimit(
    userId: string | null,
    anonymousUserId: string | null,
  ): Promise<number | null> {
    const isPremium = await this.isPremium(userId, anonymousUserId);
    return isPremium ? null : 6;
  }

  private async isPremiumFromStorage(): Promise<boolean> {
    try {
      const status = await getStorage().getItem(PREMIUM_STORAGE_KEY);
      return status === 'true';
    } catch {
      return false;
    }
  }

  private async getEventCountFromStorage(): Promise<number> {
    try {
      const eventsJson = await getStorage().getItem(EVENTS_STORAGE_KEY);
      if (!eventsJson) return 0;
      const events = JSON.parse(eventsJson);
      return Array.isArray(events) ? events.length : 0;
    } catch {
      return 0;
    }
  }

  async updatePremiumStatusInStorage(isPremium: boolean): Promise<void> {
    try {
      await getStorage().setItem(PREMIUM_STORAGE_KEY, isPremium.toString());
    } catch (error) {
      console.error('Error updating premium status in storage:', error);
    }
  }

  /** @deprecated Use updatePremiumStatusInStorage instead */
  updatePremiumStatusInLocalStorage(isPremium: boolean): void {
    void this.updatePremiumStatusInStorage(isPremium);
  }
}

export const premiumService = new PremiumService();
