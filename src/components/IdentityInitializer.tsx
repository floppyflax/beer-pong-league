import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { localUser, isLoading } = useIdentityContext();
  const location = useLocation();
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Routes that don't require identity (tournament join, display views, invite)
  const publicRoutes = ['/tournament/', '/league/', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.includes(route));

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

    // If on a public route (tournament join, display, etc.), don't require identity
    if (isPublicRoute) {
      if (!hasInitialized) {
        setHasInitialized(true);
      }
      return;
    }

    // No identity found and not on public route, show modal to create or resume
    if (!hasInitialized) {
      setShowIdentityModal(true);
      setHasInitialized(true);
    }
  }, [localUser, isLoading, hasInitialized, onIdentityReady, isPublicRoute, location.pathname]);

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



