import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
// import { getDeviceFingerprint } from '../utils/deviceFingerprint'; // Unused

interface IdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdentity: (user: LocalUser) => void;
  onCreateNew: () => void;
}

export const IdentityModal = ({
  isOpen,
  onClose,
  onSelectIdentity,
  onCreateNew,
}: IdentityModalProps) => {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      const user = localUserService.getLocalUser();
      setLocalUser(user);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResume = () => {
    if (localUser) {
      onSelectIdentity(localUser);
      onClose();
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-sm rounded-2xl p-6 border border-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Reprendre ton profil ?</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} className="text-ink-soft" />
          </button>
        </div>

        {localUser ? (
          <div className="space-y-4">
            <div className="bg-paper p-4 rounded-xl">
              <div className="text-sm text-ink-soft mb-1">Ton pseudo</div>
              <div className="text-lg font-bold text-ink">
                {localUser.pseudo}
              </div>
              <div className="text-xs text-ink-mute mt-1">
                Créé le{" "}
                {new Date(localUser.createdAt).toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="flex-1 bg-cup-red hover:brightness-110 text-ink font-bold py-3 rounded-xl transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 bg-cream-deep hover:bg-paper text-ink font-bold py-3 rounded-xl transition-colors"
              >
                Nouveau profil
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-ink-soft">
              Aucun profil local trouvé. Crée un nouveau profil pour commencer.
            </p>
            <button
              onClick={handleCreateNew}
              className="w-full bg-cup-red hover:brightness-110 text-ink font-bold py-3 rounded-xl transition-colors"
            >
              Créer un profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
