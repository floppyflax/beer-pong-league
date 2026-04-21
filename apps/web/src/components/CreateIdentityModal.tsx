import { useState, useEffect, FormEvent } from "react";
import { X } from "lucide-react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";
import { anonymousUserService } from "../services/AnonymousUserService";

interface CreateIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentityCreated: (user: LocalUser) => void;
}

export const CreateIdentityModal = ({
  isOpen,
  onClose,
  onIdentityCreated,
}: CreateIdentityModalProps) => {
  const [pseudo, setPseudo] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!pseudo.trim()) return;

    setIsCreating(true);

    try {
      // Generate device fingerprint
      const deviceFingerprint = getDeviceFingerprint();

      // Create local user
      const localUser = localUserService.createLocalUser(
        pseudo.trim(),
        deviceFingerprint,
      );

      // Try to sync to Supabase (non-blocking)
      anonymousUserService.syncLocalUserToSupabase(localUser).catch((error) => {
        console.warn("Failed to sync to Supabase (will retry later):", error);
      });

      onIdentityCreated(localUser);
      setPseudo("");
      onClose();
    } catch (error) {
      console.error("Error creating identity:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-sm rounded-2xl p-6 border border-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Créer ton profil</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper rounded-lg transition-colors"
            disabled={isCreating}
            aria-label="Fermer"
          >
            <X size={20} className="text-ink-soft" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-ink-soft mb-2 block">
              Choisis un pseudo
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ton pseudo"
              className="w-full bg-paper border border-card rounded-xl p-4 text-ink focus:ring-2 focus:ring-primary outline-none"
              autoFocus
              disabled={isCreating}
              maxLength={50}
            />
            <p className="text-xs text-ink-mute mt-2">
              Tu pourras le modifier plus tard
            </p>
          </div>

          <button
            type="submit"
            disabled={!pseudo.trim() || isCreating}
            className="w-full bg-cup-red disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 text-ink font-bold py-4 rounded-xl transition-colors"
          >
            {isCreating ? "Création..." : "Créer mon profil"}
          </button>
        </form>
      </div>
    </div>
  );
};
