import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { Plus } from "lucide-react";
import { PaymentModal } from "../components/PaymentModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { TournamentCard } from "../components/tournaments/TournamentCard";
import { SearchBar, SegmentedTabs, FAB } from "../components/design-system";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { useTournamentsList } from "../hooks/useTournamentsList";
import { useLeague } from "../context/LeagueContext";

/**
 * Tournaments Page
 *
 * List of tournaments with ability to create new ones
 *
 * Features:
 * - List of user's tournaments (active first, then archived)
 * - Status filtering (All, Active, Finished)
 * - Search by tournament name
 * - FAB: Créer tournoi (design system 5.1)
 * - Premium limit enforcement (2 tournaments max for free users)
 * - Desktop: Create button in header
 * - Empty state for new users
 * - Responsive design (mobile: vertical stack, desktop: 2-column grid)
 */

type FilterStatus = "all" | "active" | "finished";

export const Tournaments: React.FC = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { canCreateTournament, isAtTournamentLimit, refetchPremium } =
    usePremiumLimits();
  const { tournaments, isLoading } = useTournamentsList();
  const { reloadData } = useLeague();

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchPremium();
    reloadData();
  };

  // SearchBar handles 300ms debounce internally (design system 4.7)

  // Handle create tournament action
  const handleCreate = () => {
    if (canCreateTournament) {
      navigate("/create-tournament");
    } else {
      setShowPaymentModal(true);
    }
  };

  // Filter and search tournaments (using debounced search query)
  const filteredTournaments = useMemo(() => {
    let result = tournaments || [];

    // Filter by status
    if (filter === "active") {
      result = result.filter((t) => !t.isFinished);
    } else if (filter === "finished") {
      result = result.filter((t) => t.isFinished);
    }

    // Filter by search query (SearchBar debounces 300ms)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(query));
    }

    return result;
  }, [tournaments, filter, searchQuery]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    );
  }

  // Show empty state if no tournaments (design system 5.1: header + FAB)
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 lg:pb-8">
        <ContextualHeader
          title="Mes Tournois"
          actions={[
            {
              label: "CRÉER TOURNOI",
              icon: <Plus size={20} />,
              onClick: handleCreate,
              variant: "primary",
              premium: isAtTournamentLimit,
            },
          ]}
        />

        {/* Empty State */}
        <div className="flex flex-col flex-grow px-4 py-6 min-h-[calc(100vh-8rem)]">
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white">Aucun tournoi</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Rejoignez votre premier tournoi ou créez-en un
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <button
                  onClick={handleCreate}
                  className="bg-primary hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Créer un tournoi
                  {isAtTournamentLimit && <span>🔒</span>}
                </button>
                <button
                  onClick={() => navigate("/join")}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                >
                  Rejoindre un tournoi
                </button>
              </div>
            </div>
          </div>
        </div>

        <FAB icon={Plus} onClick={handleCreate} ariaLabel="Créer un tournoi" />

        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 lg:pb-8">
      {/* Contextual Header (Story 13.2) */}
      <ContextualHeader
        title="Mes Tournois"
        actions={[
          {
            label: "CRÉER TOURNOI",
            icon: <Plus size={20} />,
            onClick: handleCreate,
            variant: "primary",
            premium: isAtTournamentLimit,
          },
        ]}
      />

      {/* Search Bar (design system 4.7, debounce 300ms) */}
      <div className="p-6 pb-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un tournoi..."
        />
      </div>

      {/* SegmentedTabs (design system 5.1: Tous / Actifs / Terminés, variante encapsulated Frame 3) */}
      <div className="p-6 pb-4 border-b border-slate-800">
        <SegmentedTabs
          tabs={[
            { id: "all", label: "Tous" },
            { id: "active", label: "Actifs" },
            { id: "finished", label: "Terminés" },
          ]}
          activeId={filter}
          onChange={(id) => setFilter(id as FilterStatus)}
          variant="encapsulated"
        />
      </div>

      {/* Tournament Cards */}
      <div className="p-6">
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Aucun résultat</p>
          </div>
        ) : (
          <div className="lg:max-w-[1200px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>

      {/* FAB: Créer tournoi (design system 5.1) */}
      <FAB icon={Plus} onClick={handleCreate} ariaLabel="Créer un tournoi" />

      {/* Payment Modal for Premium Upgrade */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
