import { useState, useEffect } from "react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
import { Modal } from "./Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprendre ton profil ?"
      maxWidth="max-w-sm"
    >
      {localUser ? (
        <div className="space-y-4">
          <div className="bg-navy-soft p-4 rounded-input">
            <div className="text-sm text-cool-gray mb-1">Ton pseudo</div>
            <div className="text-lg font-bold text-white">
              {localUser.pseudo}
            </div>
            <div className="text-xs text-cool-gray mt-1">
              Créé le{" "}
              {new Date(localUser.createdAt).toLocaleDateString("fr-FR")}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleResume}
              className="flex-1 bg-electric-blue hover:bg-amber-600 text-white font-bold py-3 rounded-input transition-colors"
            >
              Reprendre
            </button>
            <button
              onClick={handleCreateNew}
              className="flex-1 bg-navy-soft hover:bg-slate-600 text-white font-bold py-3 rounded-input transition-colors"
            >
              Nouveau profil
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-cool-gray">
            Aucun profil local trouvé. Crée un nouveau profil pour commencer.
          </p>
          <button
            onClick={handleCreateNew}
            className="w-full bg-electric-blue hover:bg-amber-600 text-white font-bold py-3 rounded-input transition-colors"
          >
            Créer un profil
          </button>
        </div>
      )}
    </Modal>
  );
};
