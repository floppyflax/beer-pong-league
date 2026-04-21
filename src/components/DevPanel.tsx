import { useState } from "react";
import { Link } from "react-router-dom";
import { useIdentityContext } from "../context/IdentityContext";
import { useAuthContext } from "../context/AuthContext";
import { authService } from "../services/AuthService";
import toast from "react-hot-toast";

/**
 * Development-only panel for quick actions and debugging.
 * Only visible when import.meta.env.DEV === true
 *
 * Features:
 * - Quick dev admin login (no Magic Link needed)
 * - Identity state display
 * - Quick logout
 */
export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { localUser } = useIdentityContext();
  const { user, isAuthenticated, signOut } = useAuthContext();

  // Only show in dev mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleTestAccountLogin = async (email: string) => {
    const loadingToast = toast.loading(`Connexion avec ${email}...`);

    try {
      const { error, usedOTP } = await authService.signInWithOTP(email);

      if (error) {
        toast.error(`Erreur: ${error.message}`, { id: loadingToast });
        console.error("Test account login failed:", error);
        return;
      }

      // If password auth succeeded (usedOTP === false)
      if (usedOTP === false) {
        toast.success("✨ Connecté avec mot de passe! Redirection...", {
          id: loadingToast,
        });
        // Wait a moment for auth state to update
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }

      // If OTP fallback was used (usedOTP === true)
      if (usedOTP === true) {
        toast.success("✉️ Email envoyé! Vérifiez votre boîte de réception", {
          id: loadingToast,
          duration: 5000,
        });
        console.log("⚠️ Password auth not enabled - OTP fallback used");
        console.log(
          "💡 To enable instant login, follow: ENABLE_PASSWORD_AUTH.md",
        );
        return;
      }

      // Default success (shouldn't reach here normally)
      toast.success("Connecté! Redirection...", { id: loadingToast });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      toast.error("Erreur de connexion", { id: loadingToast });
      console.error("Test account login exception:", error);
    }
  };

  const handleAuthLogout = async () => {
    try {
      await signOut();
      toast.success("Déconnecté");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const handleClearLocalIdentity = () => {
    localStorage.removeItem("local_user");
    toast.success("Identité locale supprimée");
    window.location.reload();
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 hover:bg-purple-700 text-ink p-3 rounded-full shadow-lg transition-all"
        title="Dev Panel"
      >
        <span className="text-lg">🧪</span>
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9999] bg-paper border-2 border-purple-500 rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-purple-400 font-bold flex items-center gap-2">
              <span>🧪</span> Dev Panel
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-soft hover:text-ink"
            >
              ✕
            </button>
          </div>

          {/* Identity Status */}
          <div className="mb-4 p-3 bg-cream rounded border border-card">
            <div className="text-xs font-semibold text-ink-soft mb-2">
              IDENTITY STATUS
            </div>

            {isAuthenticated && user ? (
              <div className="space-y-1">
                <div className="text-green-400 font-semibold">
                  ✅ Authenticated (Supabase)
                </div>
                <div className="text-xs text-ink-soft">
                  Email: {user.email}
                </div>
                <div className="text-xs text-ink-soft">
                  ID: {user.id.slice(0, 8)}...
                </div>
                <button
                  onClick={handleAuthLogout}
                  className="mt-2 w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-ink text-xs rounded transition-colors"
                >
                  Sign Out (Supabase)
                </button>
              </div>
            ) : localUser ? (
              <div className="space-y-1">
                <div className="text-yellow-400 font-semibold">
                  ⚠️ Anonymous (localStorage)
                </div>
                <div className="text-xs text-ink-soft">
                  Pseudo: {localUser.pseudo}
                </div>
                <div className="text-xs text-ink-soft">
                  ID: {localUser.id.slice(0, 8)}...
                </div>
                <button
                  onClick={handleClearLocalIdentity}
                  className="mt-2 w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-ink text-xs rounded transition-colors"
                >
                  Clear Local Identity
                </button>
              </div>
            ) : (
              <div className="text-ink-soft">❌ No Identity</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-ink-soft mb-2">
              QUICK ACTIONS
            </div>

            {/* Test Account Logins (only if not authenticated) */}
            {!isAuthenticated && (
              <div className="space-y-2">
                <div className="text-xs text-ink-mute mb-1">
                  Test Accounts (no email required):
                </div>
                <button
                  onClick={() => handleTestAccountLogin("devadmin@test.com")}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-ink text-sm rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>👨‍💻</span> Login as Dev Admin
                </button>
                <button
                  onClick={() => handleTestAccountLogin("devtest@test.com")}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-ink text-sm rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>🧪</span> Login as Dev Test
                </button>
              </div>
            )}

            {/* Utility Actions */}
            <div className="pt-2 mt-2 border-t border-card">
              <Link
                to="/design-system"
                className="w-full block px-3 py-1 bg-cream-deep hover:bg-paper text-ink text-xs rounded transition-colors mb-2 text-center"
              >
                Design System
              </Link>
              <button
                onClick={() => {
                  console.log("localStorage:", {
                    localUser: localStorage.getItem("local_user"),
                    supabaseAuth: Object.keys(localStorage).filter((k) =>
                      k.startsWith("sb-"),
                    ),
                  });
                  toast.success("Check console for localStorage data");
                }}
                className="w-full px-3 py-1 bg-cream-deep hover:bg-paper text-ink text-xs rounded transition-colors mb-2"
              >
                Log localStorage
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-3 py-1 bg-cream-deep hover:bg-paper text-ink text-xs rounded transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3 pt-3 border-t border-card">
            <div className="text-xs text-ink-mute">
              Dev mode: <span className="text-green-400">Active</span>
            </div>
            <div className="text-xs text-ink-mute">
              Environment: {import.meta.env.MODE}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
