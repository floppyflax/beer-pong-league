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
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Reprendre ton profil ?</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {localUser ? (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Ton pseudo</div>
              <div className="text-lg font-bold text-white">
                {localUser.pseudo}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Créé le{" "}
                {new Date(localUser.createdAt).toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="flex-1 bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Nouveau profil
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400">
              Aucun profil local trouvé. Crée un nouveau profil pour commencer.
            </p>
            <button
              onClick={handleCreateNew}
              className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Créer un profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
