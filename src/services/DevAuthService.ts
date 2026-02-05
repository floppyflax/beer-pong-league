import { localUserService, type LocalUser } from './LocalUserService';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

/**
 * Dev-only authentication service for local testing without Supabase Magic Links.
 * ONLY works in development mode (import.meta.env.DEV === true).
 */
export class DevAuthService {
  private static readonly DEV_ADMIN_ID = 'dev-admin-local';
  private static readonly DEV_ADMIN_PSEUDO = '👨‍💻 Admin Dev';

  /**
   * Check if we're running in dev mode
   */
  static isDevMode(): boolean {
    return (
      import.meta.env.DEV ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  /**
   * Create or get the dev admin identity
   * This creates a local user with a special dev admin ID
   * 
   * @throws Error if not in dev mode
   */
  static async devLogin(): Promise<LocalUser> {
    if (!this.isDevMode()) {
      throw new Error('DevAuthService is only available in development mode');
    }

    // Check if dev admin already exists in localStorage
    const existingUser = localUserService.getLocalUser();
    if (existingUser && existingUser.id === this.DEV_ADMIN_ID) {
      console.log('🧪 Dev Admin already logged in:', existingUser);
      return existingUser;
    }

    // Create new dev admin user
    const deviceFingerprint = getDeviceFingerprint();
    const devAdmin: LocalUser = {
      id: this.DEV_ADMIN_ID,
      pseudo: this.DEV_ADMIN_PSEUDO,
      deviceFingerprint,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    // Save to localStorage
    localUserService.saveLocalUser(devAdmin);

    console.log('🧪 Dev Admin created and logged in:', devAdmin);
    return devAdmin;
  }

  /**
   * Check if current user is the dev admin
   */
  static isDevAdmin(user: LocalUser | null): boolean {
    return user?.id === this.DEV_ADMIN_ID;
  }

  /**
   * Logout dev admin (clear localStorage)
   */
  static devLogout(): void {
    if (!this.isDevMode()) {
      throw new Error('DevAuthService is only available in development mode');
    }

    localUserService.clearLocalUser();
    console.log('🧪 Dev Admin logged out');
  }

  /**
   * Get dev admin info (for display in DevPanel)
   */
  static getDevAdminInfo(): { id: string; pseudo: string } {
    return {
      id: this.DEV_ADMIN_ID,
      pseudo: this.DEV_ADMIN_PSEUDO,
    };
  }
}

export const devAuthService = DevAuthService;
