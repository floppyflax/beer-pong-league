import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomMenuSpecific } from '../components/navigation/BottomMenuSpecific';
import { Plus } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PaymentModal } from '../components/PaymentModal';
import { usePremiumLimits } from '../hooks/usePremiumLimits';

/**
 * Leagues Page
 * 
 * List of leagues with ability to create new ones
 * 
 * Features:
 * - List of user's leagues (placeholder for now)
 * - Bottom Menu Specific with "Créer" action (mobile only)
 * - Premium limit enforcement (1 league max for free users)
 * - Desktop: Create button in header
 */

export const Leagues: React.FC = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { canCreateLeague, isAtLeagueLimit } = usePremiumLimits();

  const handleCreate = () => {
    if (canCreateLeague) {
      navigate('/create-league');
    } else {
      setShowPaymentModal(true);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6">
      {/* Desktop Header Actions */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Mes Leagues</h1>
        <button
          onClick={handleCreate}
          className="bg-primary hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>CRÉER</span>
          {isAtLeagueLimit && <span>🔒</span>}
        </button>
      </div>

      {/* Mobile Header (without action) */}
      <div className="lg:hidden mb-6">
        <h1 className="text-3xl font-bold text-white">Mes Leagues</h1>
      </div>

      {/* League List (placeholder) */}
      <div className="flex-grow">
        <EmptyState
          icon="🏅"
          title="Aucune league"
          description="Créez votre première league pour organiser une compétition longue durée"
        />
      </div>

      {/* Mobile Bottom Menu (shown below lg breakpoint) */}
      <div className="lg:hidden">
        <BottomMenuSpecific
          actions={[
            {
              label: 'CRÉER',
              icon: <Plus size={20} />,
              onClick: handleCreate,
              premium: isAtLeagueLimit,
            },
          ]}
        />
      </div>

      {/* Payment Modal for Premium Upgrade */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};
