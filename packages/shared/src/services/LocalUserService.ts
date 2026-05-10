import { getStorage } from '../runtime/storage';

export interface LocalUser {
  anonymousUserId: string;
  pseudo: string;
  createdAt: string;
  deviceFingerprint?: string;
}

const STORAGE_KEY = 'bpl_local_user';

class LocalUserService {
  async getLocalUser(): Promise<LocalUser | null> {
    const stored = await getStorage().getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as LocalUser;
    } catch {
      return null;
    }
  }

  async createLocalUser(pseudo: string, deviceFingerprint?: string): Promise<LocalUser> {
    const user: LocalUser = {
      anonymousUserId: crypto.randomUUID(),
      pseudo,
      createdAt: new Date().toISOString(),
      deviceFingerprint,
    };
    await this.saveLocalUser(user);
    return user;
  }

  async updateLocalUser(updates: Partial<LocalUser>): Promise<LocalUser | null> {
    const current = await this.getLocalUser();
    if (!current) return null;
    const updated: LocalUser = { ...current, ...updates };
    await this.saveLocalUser(updated);
    return updated;
  }

  async clearLocalUser(): Promise<void> {
    await getStorage().removeItem(STORAGE_KEY);
  }

  private async saveLocalUser(user: LocalUser): Promise<void> {
    await getStorage().setItem(STORAGE_KEY, JSON.stringify(user));
  }

  async hasLocalUser(): Promise<boolean> {
    return (await this.getLocalUser()) !== null;
  }

  async setLocalUser(user: LocalUser): Promise<void> {
    await this.saveLocalUser(user);
  }
}

export const localUserService = new LocalUserService();
