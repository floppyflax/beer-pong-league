import { useState, FormEvent } from "react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";
import { anonymousUserService } from "../services/AnonymousUserService";
import { Sheet } from "./design-system/Sheet";
import { PButton } from "./ponglo/PButton";

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

      const localUser = await localUserService.createLocalUser(
        pseudo.trim(),
        deviceFingerprint,
      );

      anonymousUserService.syncLocalUserToSupabase(localUser).catch(() => {
        // Silent retry happens later via background sync.
      });

      onIdentityCreated(localUser);
      setPseudo("");
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Créer ton profil"
      maxWidth="sm"
      disableClose={isCreating}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-cool-gray mb-2 block">
            Choisis un pseudo
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ton pseudo"
            className="w-full bg-navy border border-card rounded-input p-4 text-white focus:ring-2 focus:ring-electric-blue outline-none"
            autoFocus
            disabled={isCreating}
            maxLength={50}
          />
          <p className="text-xs text-cool-gray mt-2">
            Tu pourras le modifier plus tard
          </p>
        </div>

        <PButton
          type="submit"
          variant="accent"
          full
          disabled={!pseudo.trim() || isCreating}
        >
          {isCreating ? "Création..." : "Créer mon profil"}
        </PButton>
      </form>
    </Sheet>
  );
};
