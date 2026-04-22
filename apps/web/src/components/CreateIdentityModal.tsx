import { useState, FormEvent } from "react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";
import { anonymousUserService } from "../services/AnonymousUserService";
import { Modal } from "./Modal";

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!pseudo.trim()) return;

    setIsCreating(true);

    try {
      const deviceFingerprint = getDeviceFingerprint();

      const localUser = localUserService.createLocalUser(
        pseudo.trim(),
        deviceFingerprint,
      );

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer ton profil"
      maxWidth="max-w-sm"
      disableClose={isCreating}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-text-tertiary mb-2 block">
            Choisis un pseudo
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ton pseudo"
            className="w-full bg-background-tertiary border border-card rounded-input p-4 text-white focus:ring-2 focus:ring-primary outline-none"
            autoFocus
            disabled={isCreating}
            maxLength={50}
          />
          <p className="text-xs text-text-muted mt-2">
            Tu pourras le modifier plus tard
          </p>
        </div>

        <button
          type="submit"
          disabled={!pseudo.trim() || isCreating}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-input transition-colors"
        >
          {isCreating ? "Création..." : "Créer mon profil"}
        </button>
      </form>
    </Modal>
  );
};
