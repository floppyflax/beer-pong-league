/**
 * Service for managing local (anonymous) user identity
 * Stores user data in localStorage for offline-first approach
 */

export interface LocalUser {
  anonymousUserId: string; // UUID v4
  pseudo: string;
  createdAt: string;
  deviceFingerprint?: string;
}

const STORAGE_KEY = 'bpl_local_user';

class LocalUserService {
  /**
   * Get the current local user from localStorage
   */
  getLocalUser(): LocalUser | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as LocalUser;
    } catch {
      return null;
    }
  }

  /**
   * Create a new local user
   */
  createLocalUser(pseudo: string, deviceFingerprint?: string): LocalUser {
    const user: LocalUser = {
      anonymousUserId: crypto.randomUUID(),
      pseudo,
      createdAt: new Date().toISOString(),
      deviceFingerprint,
    };
    
    this.saveLocalUser(user);
    return user;
  }

  /**
   * Update local user data
   */
  updateLocalUser(updates: Partial<LocalUser>): LocalUser | null {
    const current = this.getLocalUser();
    if (!current) return null;
    
    const updated: LocalUser = {
      ...current,
      ...updates,
    };
    
    this.saveLocalUser(updated);
    return updated;
  }

  /**
   * Clear local user data
   */
  clearLocalUser(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Save local user to localStorage
   */
  private saveLocalUser(user: LocalUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Check if a local user exists
   */
  hasLocalUser(): boolean {
    return this.getLocalUser() !== null;
  }
}

export const localUserService = new LocalUserService();



