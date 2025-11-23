/**
 * MigrationService - Service de migration des données localStorage vers Supabase
 */

import { databaseService } from './DatabaseService';
import type { League, Tournament } from '../types';

const MIGRATION_FLAG_KEY = 'bpl_data_migrated_to_supabase';

class MigrationService {
  /**
   * Vérifie si la migration a déjà été effectuée
   */
  isMigrationDone(): boolean {
    return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
  }

  /**
   * Marque la migration comme effectuée
   */
  markMigrationDone(): void {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  }

  /**
   * Migre les données localStorage vers Supabase
   */
  async migrateLocalStorageToSupabase(): Promise<{
    leaguesMigrated: number;
    tournamentsMigrated: number;
    error?: string;
  }> {
    // Vérifier si déjà migré
    if (this.isMigrationDone()) {
      return { leaguesMigrated: 0, tournamentsMigrated: 0 };
    }

    try {
      // Charger les données depuis localStorage
      const leaguesJson = localStorage.getItem('bpl_leagues');
      const tournamentsJson = localStorage.getItem('bpl_tournaments');

      const leagues: League[] = leaguesJson ? JSON.parse(leaguesJson) : [];
      const tournaments: Tournament[] = tournamentsJson ? JSON.parse(tournamentsJson) : [];

      // Migrer les leagues
      let leaguesMigrated = 0;
      for (const league of leagues) {
        try {
          await databaseService.saveLeague(league);
          leaguesMigrated++;
        } catch (error) {
          console.error(`Error migrating league ${league.id}:`, error);
        }
      }

      // Migrer les tournaments
      let tournamentsMigrated = 0;
      for (const tournament of tournaments) {
        try {
          await databaseService.saveTournament(tournament);
          tournamentsMigrated++;
        } catch (error) {
          console.error(`Error migrating tournament ${tournament.id}:`, error);
        }
      }

      // Marquer comme migré seulement si au moins une donnée a été migrée
      if (leaguesMigrated > 0 || tournamentsMigrated > 0) {
        this.markMigrationDone();
      }

      return {
        leaguesMigrated,
        tournamentsMigrated,
      };
    } catch (error) {
      console.error('Error during migration:', error);
      return {
        leaguesMigrated: 0,
        tournamentsMigrated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Réinitialise le flag de migration (pour forcer une nouvelle migration)
   */
  resetMigrationFlag(): void {
    localStorage.removeItem(MIGRATION_FLAG_KEY);
  }
}

export const migrationService = new MigrationService();

