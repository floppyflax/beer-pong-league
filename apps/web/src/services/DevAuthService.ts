import { localUserService, type LocalUser } from "./LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

/**
 * Dev-only authentication service for local testing without Supabase Magic Links.
 * ONLY works in development mode (import.meta.env.DEV === true).
 */
export class DevAuthService {
  private static readonly DEV_ADMIN_ID = "dev-admin-local";
  private static readonly DEV_ADMIN_PSEUDO = "👨‍💻 Admin Dev";

  static isDevMode(): boolean {
    return (
      import.meta.env.DEV ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }

  static async devLogin(): Promise<LocalUser> {
    if (!this.isDevMode()) {
      throw new Error("DevAuthService is only available in development mode");
    }

    const existingUser = await localUserService.getLocalUser();
    if (existingUser && existingUser.anonymousUserId === this.DEV_ADMIN_ID) {
      console.log("🧪 Dev Admin already logged in:", existingUser);
      return existingUser;
    }

    const deviceFingerprint = getDeviceFingerprint();
    const devAdmin: LocalUser = {
      anonymousUserId: this.DEV_ADMIN_ID,
      pseudo: this.DEV_ADMIN_PSEUDO,
      createdAt: new Date().toISOString(),
      deviceFingerprint,
    };

    await localUserService.setLocalUser(devAdmin);
    console.log("🧪 Dev Admin created and logged in:", devAdmin);
    return devAdmin;
  }

  static isDevAdmin(user: LocalUser | null): boolean {
    return user?.anonymousUserId === this.DEV_ADMIN_ID;
  }

  static async devLogout(): Promise<void> {
    if (!this.isDevMode()) {
      throw new Error("DevAuthService is only available in development mode");
    }
    await localUserService.clearLocalUser();
    console.log("🧪 Dev Admin logged out");
  }

  static getDevAdminInfo(): { id: string; pseudo: string } {
    return {
      id: this.DEV_ADMIN_ID,
      pseudo: this.DEV_ADMIN_PSEUDO,
    };
  }
}

export const devAuthService = DevAuthService;
