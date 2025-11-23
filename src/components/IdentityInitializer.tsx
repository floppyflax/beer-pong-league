import { useEffect, useState } from 'react';
import { useIdentityContext } from '../context/IdentityContext';
import { IdentityModal } from './IdentityModal';
import { CreateIdentityModal } from './CreateIdentityModal';
import type { LocalUser } from '../services/LocalUserService';

interface IdentityInitializerProps {
  children: React.ReactNode;
  onIdentityReady?: (user: LocalUser) => void;
}

/**
 * Component that ensures user has an identity before rendering children
 * Shows modals to create or resume identity if needed
 */
export const IdentityInitializer = ({
  children,
  onIdentityReady,
}: IdentityInitializerProps) => {
  const { localUser, isLoading, createIdentity } = useIdentityContext();
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // If user already has identity, notify parent
    if (localUser) {
      if (!hasInitialized) {
        setHasInitialized(true);
        onIdentityReady?.(localUser);
      }
      return;
    }

    // No identity found, show modal to create or resume
    if (!hasInitialized) {
      setShowIdentityModal(true);
      setHasInitialized(true);
    }
  }, [localUser, isLoading, hasInitialized, onIdentityReady]);

  const handleSelectIdentity = (user: LocalUser) => {
    setShowIdentityModal(false);
    onIdentityReady?.(user);
  };

  const handleCreateNew = () => {
    setShowIdentityModal(false);
    setShowCreateModal(true);
  };

  const handleIdentityCreated = (user: LocalUser) => {
    setShowCreateModal(false);
    onIdentityReady?.(user);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <div className="text-slate-400">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <IdentityModal
        isOpen={showIdentityModal}
        onClose={() => {
          setShowIdentityModal(false);
          setShowCreateModal(true);
        }}
        onSelectIdentity={handleSelectIdentity}
        onCreateNew={handleCreateNew}
      />
      <CreateIdentityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onIdentityCreated={handleIdentityCreated}
      />
    </>
  );
};



