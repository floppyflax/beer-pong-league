import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { Plus } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LeagueCard } from "@/components/leagues/LeagueCard";
import {
  SearchBar,
  SegmentedTabs,
  FAB,
  ScreenLayout,
} from "@/components/design-system";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-cream">
        <LoadingSpinner />
      </div>
    );
  }

  const header = (
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
  );

  const paymentModal = showPaymentModal && (
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
  );

  if (!leagues || leagues.length === 0) {
    return (
      <ScreenLayout
        header={header}
        overlay={
          <>
            <FAB
              icon={Plus}
              onClick={handleCreate}
              ariaLabel="Créer une league"
            />
            {paymentModal}
          </>
        }
      >
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 min-h-[50vh]">
          <div className="text-6xl">🏅</div>
          <h2 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-ink">
            Aucune league
          </h2>
          <p className="text-ink-soft max-w-md">
            Créez votre première league pour organiser des compétitions long
            terme
          </p>
          <button
            onClick={handleCreate}
            className="bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-3 px-6 rounded-full transition-[transform,box-shadow,filter] duration-75 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Créer une league
            {isAtLeagueLimit && <span aria-label="Premium requis">🔒</span>}
          </button>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      header={header}
      overlay={
        <>
          <FAB
            icon={Plus}
            onClick={handleCreate}
            ariaLabel="Créer une league"
          />
          {paymentModal}
        </>
      }
    >
      <div className="space-y-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher une league..."
        />

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

        {filteredLeagues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-soft text-lg">
              {filter === "finished"
                ? "Les leagues terminées seront disponibles prochainement."
                : "Aucun résultat"}
            </p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {filteredLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>
    </ScreenLayout>
  );
};
