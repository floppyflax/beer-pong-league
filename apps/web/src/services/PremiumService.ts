/**
 * PremiumService - Service de gestion du statut premium et des limites freemium
 * 
 * Gère les vérifications de statut premium et l'application des limites pour les utilisateurs gratuits:
 * - Free users: max 2 tournaments, max 6 players per tournament, no leagues
 * - Premium users: unlimited tournaments, unlimited players, unlimited leagues
 */

import { supabase } from '../lib/supabase';

/**
 * Résultat de la vérification de création de tournoi
 */
export interface CanCreateTournamentResult {
  allowed: boolean;
  remaining?: number;
  reason?: string;
  message?: string;
}

class PremiumService {
  /**
   * Vérifie si Supabase est disponible
   */
  private isSupabaseAvailable(): boolean {
    return supabase !== null;
  }

  /**
   * Vérifie si un utilisateur est premium
   * 
   * @param userId - ID de l'utilisateur authentifié (null si anonyme)
   * @param anonymousUserId - ID de l'utilisateur anonyme (null si authentifié)
   * @returns true si l'utilisateur est premium, false sinon
   */
  async isPremium(userId: string | null, anonymousUserId: string | null): Promise<boolean> {
    // Si aucun ID fourni, considérer comme utilisateur gratuit
    if (!userId && !anonymousUserId) {
      return false;
    }

    // Vérifier Supabase d'abord
    if (this.isSupabaseAvailable()) {
      try {
        // Requête pour utilisateur authentifié
        if (userId) {
          const { data, error } = await supabase!
            .from('users')
            .select('is_premium')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('Error checking premium status for user:', error);
            return this.isPremiumFromLocalStorage();
          }

          return data?.is_premium ?? false;
        }

        // Requête pour utilisateur anonyme
        if (anonymousUserId) {
          const { data, error } = await supabase!
            .from('anonymous_users')
            .select('is_premium')
            .eq('id', anonymousUserId)
            .single();

          if (error) {
            console.error('Error checking premium status for anonymous user:', error);
            return this.isPremiumFromLocalStorage();
          }

          return data?.is_premium ?? false;
        }
      } catch (error) {
        console.error('Error in isPremium:', error);
        return this.isPremiumFromLocalStorage();
      }
    }

    // Fallback localStorage si Supabase indisponible
    return this.isPremiumFromLocalStorage();
  }

  /**
   * Compte le nombre de tournois créés par un utilisateur
   * 
   * @param userId - ID de l'utilisateur authentifié (null si anonyme)
   * @param anonymousUserId - ID de l'utilisateur anonyme (null si authentifié)
   * @returns Nombre de tournois créés par l'utilisateur
   */
  async getTournamentCount(userId: string | null, anonymousUserId: string | null): Promise<number> {
    // Si aucun ID fourni, retourner 0
    if (!userId && !anonymousUserId) {
      return 0;
    }

    // Vérifier Supabase d'abord
    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase!
          .from('tournaments')
          .select('*', { count: 'exact', head: true });

        // Filtrer par créateur
        if (userId) {
          query = query.eq('creator_user_id', userId);
        } else if (anonymousUserId) {
          query = query.eq('creator_anonymous_user_id', anonymousUserId);
        }

        const { count, error } = await query;

        if (error) {
          console.error('Error counting tournaments:', error);
          return this.getTournamentCountFromLocalStorage();
        }

        return count ?? 0;
      } catch (error) {
        console.error('Error in getTournamentCount:', error);
        return this.getTournamentCountFromLocalStorage();
      }
    }

    // Fallback localStorage si Supabase indisponible
    return this.getTournamentCountFromLocalStorage();
  }

  /**
   * Vérifie si un utilisateur peut créer un tournoi
   * 
   * @param userId - ID de l'utilisateur authentifié (null si anonyme)
   * @param anonymousUserId - ID de l'utilisateur anonyme (null si authentifié)
   * @returns Objet avec allowed (boolean), remaining (number optionnel), reason et message
   */
  async canCreateTournament(
    userId: string | null,
    anonymousUserId: string | null
  ): Promise<CanCreateTournamentResult> {
    // Vérifier si l'utilisateur est premium
    const isPremium = await this.isPremium(userId, anonymousUserId);

    // Premium users ont accès illimité
    if (isPremium) {
      return { allowed: true };
    }

    // Pour les utilisateurs gratuits, vérifier la limite de 2 tournois
    const tournamentCount = await this.getTournamentCount(userId, anonymousUserId);

    if (tournamentCount >= 2) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: 'Limite de 2 tournois atteinte. Passez Premium pour créer des tournois illimités !',
      };
    }

    return {
      allowed: true,
      remaining: 2 - tournamentCount,
    };
  }

  /**
   * Vérifie si un utilisateur peut créer une league
   * Les leagues sont réservées aux utilisateurs premium
   * 
   * @param userId - ID de l'utilisateur authentifié (null si anonyme)
   * @param anonymousUserId - ID de l'utilisateur anonyme (null si authentifié)
   * @returns true si l'utilisateur peut créer une league (premium), false sinon
   */
  async canCreateLeague(userId: string | null, anonymousUserId: string | null): Promise<boolean> {
    // Les leagues sont une fonctionnalité premium uniquement
    return await this.isPremium(userId, anonymousUserId);
  }

  /**
   * Obtient la limite de joueurs par tournoi pour un utilisateur
   * 
   * @param userId - ID de l'utilisateur authentifié (null si anonyme)
   * @param anonymousUserId - ID de l'utilisateur anonyme (null si authentifié)
   * @returns null (illimité) pour premium, 6 pour utilisateurs gratuits
   */
  async getTournamentPlayerLimit(
    userId: string | null,
    anonymousUserId: string | null
  ): Promise<number | null> {
    const isPremium = await this.isPremium(userId, anonymousUserId);

    // Premium users: pas de limite
    if (isPremium) {
      return null;
    }

    // Free users: limite de 6 joueurs par tournoi
    return 6;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES - FALLBACK LOCALSTORAGE
  // ============================================================================

  /**
   * Vérifie le statut premium depuis localStorage
   * @private
   */
  private isPremiumFromLocalStorage(): boolean {
    try {
      const premiumStatus = localStorage.getItem('bpl_premium_status');
      return premiumStatus === 'true';
    } catch (error) {
      console.error('Error reading premium status from localStorage:', error);
      return false;
    }
  }

  /**
   * Compte les tournois depuis localStorage
   * @private
   */
  private getTournamentCountFromLocalStorage(): number {
    try {
      const tournamentsJson = localStorage.getItem('bpl_tournaments');
      if (!tournamentsJson) return 0;

      const tournaments = JSON.parse(tournamentsJson);
      return Array.isArray(tournaments) ? tournaments.length : 0;
    } catch (error) {
      console.error('Error reading tournaments from localStorage:', error);
      return 0;
    }
  }

  /**
   * Met à jour le statut premium dans localStorage (utilisé après un achat)
   * @param isPremium - Nouveau statut premium
   */
  updatePremiumStatusInLocalStorage(isPremium: boolean): void {
    try {
      localStorage.setItem('bpl_premium_status', isPremium.toString());
    } catch (error) {
      console.error('Error updating premium status in localStorage:', error);
    }
  }
}

// Export du singleton
export const premiumService = new PremiumService();
