import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomMenuSpecific } from '../components/navigation/BottomMenuSpecific';
import { ContextualHeader } from '../components/navigation/ContextualHeader';
import { Plus, Search } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LeagueCard } from '../components/leagues/LeagueCard';
import { usePremiumLimits } from '../hooks/usePremiumLimits';
import { useLeaguesList } from '../hooks/useLeaguesList';
import { useLeague } from '../context/LeagueContext';

/**
 * Leagues Page
 * 
 * List of leagues with ability to create new ones
 * 
 * Features:
 * - List of user's leagues (owned + joined)
 * - Status filtering (All, Active, Finished)
 * - Search by league name
 * - Bottom Menu Specific with "Créer" action (mobile only)
 * - Premium limit enforcement (1 league max for free users)
 * - Desktop: Create button in header
 * - Empty state for new users
 * - Responsive design (mobile: vertical stack, desktop: 2-column grid)
 */

type FilterStatus = 'all' | 'active' | 'finished';

export const Leagues: React.FC = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  const { canCreateLeague, isAtLeagueLimit } = usePremiumLimits();
  const { leagues, isLoading } = useLeaguesList();
  const { reloadData } = useLeague();

  // Story 10.3: Add 300ms debounce to search for performance (same as Story 10.2)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle create league action
  const handleCreate = () => {
    if (canCreateLeague) {
      navigate('/create-league');
    } else {
      setShowPaymentModal(true);
    }
  };

  // Filter and search leagues (using debounced search query)
  const filteredLeagues = useMemo(() => {
    let result = leagues || [];

    // Filter by status
    if (filter === 'active') {
      result = result.filter(l => l.status === 'active');
    } else if (filter === 'finished') {
      result = result.filter(l => l.status === 'finished');
    }

    // Filter by search query (debounced for performance)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [leagues, filter, debouncedSearchQuery]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    );
  }

  // Show empty state if no leagues (Story 10.3 AC7)
  if (!leagues || leagues.length === 0) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Mes Leagues</h1>
        </div>

        {/* Empty State */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🏅</div>
            <h2 className="text-2xl font-bold text-white">Aucune league</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Créez votre première league pour organiser des compétitions long terme
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleCreate}
                className="bg-primary hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Créer une league
                {isAtLeagueLimit && <span>🔒</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Modal - AC5: custom message when at league limit */}
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => reloadData()}
            title={isAtLeagueLimit ? 'Limite gratuite atteinte' : undefined}
            subtitle={isAtLeagueLimit ? 'La version gratuite est limitée à 1 league active. Passez Premium pour créer des leagues illimitées et profiter de toutes les fonctionnalités avancées.' : undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20 lg:pb-8">
      {/* Contextual Header (Story 13.2) */}
      <ContextualHeader 
        title="Mes Leagues"
        actions={[
          {
            label: 'CRÉER LEAGUE',
            icon: <Plus size={20} />,
            onClick: handleCreate,
            variant: 'primary',
            premium: isAtLeagueLimit,
          },
        ]}
      />

      {/* Search Bar */}
      <div className="p-6 pb-0">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Rechercher une league..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs - Story 10.3 AC3 */}
      <div className="flex gap-2 p-6 pb-4 border-b border-slate-800">
        <FilterTab
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="Tous"
        />
        <FilterTab
          active={filter === 'active'}
          onClick={() => setFilter('active')}
          label="Actifs"
        />
        <FilterTab
          active={filter === 'finished'}
          onClick={() => setFilter('finished')}
          label="Terminés"
        />
      </div>

      {/* League Cards - Story 10.3 AC2, AC8 */}
      <div className="p-6">
        {filteredLeagues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Aucun résultat</p>
          </div>
        ) : (
          <div className="lg:max-w-[1200px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {filteredLeagues.map(league => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Menu - Story 10.3 AC5 */}
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

      {/* Payment Modal for Premium Upgrade - AC5: custom message when at league limit */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => reloadData()}
          title={isAtLeagueLimit ? 'Limite gratuite atteinte' : undefined}
          subtitle={isAtLeagueLimit ? 'La version gratuite est limitée à 1 league active. Passez Premium pour créer des leagues illimitées et profiter de toutes les fonctionnalités avancées.' : undefined}
        />
      )}
    </div>
  );
};

/**
 * FilterTab Component
 * 
 * Tab button for filter selection
 */
interface FilterTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const FilterTab: React.FC<FilterTabProps> = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
        active
          ? 'bg-primary text-white'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
};
