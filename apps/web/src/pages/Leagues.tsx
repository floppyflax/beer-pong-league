import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { Plus } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LeagueCard } from "@/components/leagues/LeagueCard";
import { SearchBar, SegmentedTabs, FAB } from "@/components/design-system";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { useLeaguesList } from "@/hooks/useLeaguesList";
import { useLeague } from "@/context/LeagueContext";

/**
 * Leagues Page
 *
 * List of leagues with ability to create new ones (design system 5.1, Frame 7).
 *
 * Features:
 * - Header: title + Create button (ContextualHeader)
 * - SearchBar (design system 4.7, debounce 300ms)
 * - SegmentedTabs: Tous / Actifs / Terminés (encapsulated variant)
 * - LeagueCard grid (gradient-card, design system 4.8)
 * - FAB: Créer league
 * - Bottom nav visible (design system 2.1)
 * - Premium limit enforcement (1 league max for free users)
 * - Empty state for new users
 * - Responsive design (mobile: vertical stack, desktop: 2-column grid)
 */

type FilterStatus = "all" | "active" | "finished";

export const Leagues: React.FC = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { canCreateLeague, isAtLeagueLimit, refetchPremium } =
    usePremiumLimits();
  const { leagues, isLoading } = useLeaguesList();
  const { reloadData } = useLeague();

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchPremium();
    reloadData();
  };

  // SearchBar handles 300ms debounce internally (design system 4.7)

  // Handle create league action
  const handleCreate = () => {
    if (canCreateLeague) {
      navigate("/create-league");
    } else {
      setShowPaymentModal(true);
    }
  };

  // Filter and search leagues (using debounced search query)
  const filteredLeagues = useMemo(() => {
    let result = leagues || [];

    // Filter by status
    if (filter === "active") {
      result = result.filter((l) => l.status === "active");
    } else if (filter === "finished") {
      result = result.filter((l) => l.status === "finished");
    }

    // Filter by search query (SearchBar debounces 300ms)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(query));
    }

    return result;
  }, [leagues, filter, searchQuery]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    );
  }

  // Show empty state if no leagues (design system 5.1: header + FAB)
  if (!leagues || leagues.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 lg:pb-8">
        <ContextualHeader
          title="Mes Leagues"
          actions={[
            {
              label: "CRÉER LEAGUE",
              icon: <Plus size={20} />,
              onClick: handleCreate,
              variant: "primary",
              premium: isAtLeagueLimit,
            },
          ]}
        />

        {/* Empty State */}
        <div className="flex flex-col flex-grow px-4 py-6 min-h-[calc(100vh-8rem)]">
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🏅</div>
              <h2 className="text-2xl font-bold text-white">Aucune league</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Créez votre première league pour organiser des compétitions long
                terme
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
        </div>

        <FAB icon={Plus} onClick={handleCreate} ariaLabel="Créer une league" />

        {/* Payment Modal - AC5: custom message when at league limit */}
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
            title={isAtLeagueLimit ? "Limite gratuite atteinte" : undefined}
            subtitle={
              isAtLeagueLimit
                ? "La version gratuite est limitée à 1 league active. Passez Premium pour créer des leagues illimitées et profiter de toutes les fonctionnalités avancées."
                : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 lg:pb-8">
      {/* Contextual Header (Story 13.2) */}
      <ContextualHeader
        title="Mes Leagues"
        actions={[
          {
            label: "CRÉER LEAGUE",
            icon: <Plus size={20} />,
            onClick: handleCreate,
            variant: "primary",
            premium: isAtLeagueLimit,
          },
        ]}
      />

      {/* Search Bar (design system 4.7, debounce 300ms) */}
      <div className="p-6 pb-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher une league..."
        />
      </div>

      {/* SegmentedTabs (design system 5.1: Tous / Actifs / Terminés, variante encapsulated Frame 7) */}
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

      {/* League Cards */}
      <div className="p-6">
        {filteredLeagues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {filter === "finished"
                ? "Les leagues terminées seront disponibles prochainement."
                : "Aucun résultat"}
            </p>
          </div>
        ) : (
          <div className="lg:max-w-[1200px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {filteredLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>

      {/* FAB: Créer league (design system 5.1) */}
      <FAB icon={Plus} onClick={handleCreate} ariaLabel="Créer une league" />

      {/* Payment Modal for Premium Upgrade - AC5: custom message when at league limit */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          title={isAtLeagueLimit ? "Limite gratuite atteinte" : undefined}
          subtitle={
            isAtLeagueLimit
              ? "La version gratuite est limitée à 1 league active. Passez Premium pour créer des leagues illimitées et profiter de toutes les fonctionnalités avancées."
              : undefined
          }
        />
      )}
    </div>
  );
};
