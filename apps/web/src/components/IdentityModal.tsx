import { useState, useEffect } from "react";
import { localUserService, type LocalUser } from "../services/LocalUserService";
import { Sheet } from "./design-system/Sheet";
import { PButton } from "./ponglo/PButton";

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
      localUserService.getLocalUser().then(setLocalUser);
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
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Reprendre ton profil ?"
      maxWidth="sm"
    >
      {localUser ? (
        <div className="space-y-4">
          <div className="bg-navy border border-card p-4 rounded-card">
            <div className="text-[11px] uppercase tracking-[0.5px] text-cool-gray mb-1 font-mono">
              Ton pseudo
            </div>
            <div className="text-lg font-bold text-white">
              {localUser.pseudo}
            </div>
            <div className="text-xs text-cool-gray mt-1">
              Créé le{" "}
              {new Date(localUser.createdAt).toLocaleDateString("fr-FR")}
            </div>
          </div>

          <div className="flex gap-3">
            <PButton variant="accent" full onClick={handleResume}>
              Reprendre
            </PButton>
            <PButton variant="ghost" full onClick={handleCreateNew}>
              Nouveau profil
            </PButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-cool-gray text-sm">
            Aucun profil local trouvé. Crée un nouveau profil pour commencer.
          </p>
          <PButton variant="accent" full onClick={handleCreateNew}>
            Créer un profil
          </PButton>
        </div>
      )}
    </Sheet>
  );
};
