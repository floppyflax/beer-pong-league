/**
 * MigrationService - Service de migration des données localStorage vers Supabase
 */

import { databaseService } from './DatabaseService';
import type { League, Event, Match } from '../types';

const MIGRATION_FLAG_KEY = 'bpl_data_migrated_to_supabase';

/** Normalize a value to ISO 8601 datetime string (handles legacy formats) */
function toIsoDateTime(val: unknown): string {
  if (val == null || val === '') return new Date().toISOString();
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val instanceof Date) return val.toISOString();
  return new Date().toISOString();
}

/** Normalize match for migration (legacy dates, null handling) */
function normalizeMatch(m: Match): Match {
  return {
    ...m,
    date: toIsoDateTime(m.date),
    confirmed_at: m.confirmed_at != null ? toIsoDateTime(m.confirmed_at) : undefined,
  };
}

/** Normalize league for migration (legacy createdAt, match dates) */
function normalizeLeague(league: League): League {
  return {
    ...league,
    createdAt: toIsoDateTime(league.createdAt ?? new Date().toISOString()),
    matches: (league.matches ?? []).map(normalizeMatch),
  };
}

/** Normalize event for migration (legacy dates, null location) */
function normalizeEvent(event: Event): Event {
  const t = { ...event };
  t.date = toIsoDateTime(t.date ?? event.createdAt);
  t.createdAt = toIsoDateTime(t.createdAt ?? t.date);
  t.location = (t.location != null && t.location !== '') ? t.location : undefined; // null/empty -> undefined
  t.matches = (t.matches ?? []).map(normalizeMatch);
  return t;
}

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
    eventsMigrated: number;
    error?: string;
  }> {
    // Vérifier si déjà migré
    if (this.isMigrationDone()) {
      return { leaguesMigrated: 0, eventsMigrated: 0 };
    }

    try {
      // Charger les données depuis localStorage
      const leaguesJson = localStorage.getItem('bpl_leagues');
      const eventsJson = localStorage.getItem('bpl_events');

      const leagues: League[] = leaguesJson ? JSON.parse(leaguesJson) : [];
      const events: Event[] = eventsJson ? JSON.parse(eventsJson) : [];

      // Migrer les leagues (normaliser les dates legacy avant sauvegarde)
      let leaguesMigrated = 0;
      for (const league of leagues) {
        try {
          const normalized = normalizeLeague(league);
          await databaseService.saveLeague(normalized);
          leaguesMigrated++;
        } catch (error) {
          console.error(`Error migrating league ${league.id}:`, error);
        }
      }

      // Migrer les events (normaliser dates et nulls legacy)
      let eventsMigrated = 0;
      for (const event of events) {
        try {
          const normalized = normalizeEvent(event);
          await databaseService.saveEvent(normalized);
          eventsMigrated++;
        } catch (error) {
          console.error(`Error migrating event ${event.id}:`, error);
        }
      }

      // Marquer comme migré seulement si au moins une donnée a été migrée
      if (leaguesMigrated > 0 || eventsMigrated > 0) {
        this.markMigrationDone();
      }

      return {
        leaguesMigrated,
        eventsMigrated,
      };
    } catch (error) {
      console.error('Error during migration:', error);
      return {
        leaguesMigrated: 0,
        eventsMigrated: 0,
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

