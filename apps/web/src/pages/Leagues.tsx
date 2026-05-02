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
  ScreenLayout,
} from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";
import { Lock } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-navy">
        <LoadingSpinner />
      </div>
    );
  }

  const header = (
    <ContextualHeader
      title="Mes Ligues"
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
      title="Les ligues sont une fonctionnalité Premium"
      subtitle="Crée des ligues saisonnières ou continues, organise des championnats long-terme et débloque toutes les fonctionnalités avancées."
    />
  );

  if (!leagues || leagues.length === 0) {
    return (
      <ScreenLayout
        header={header}
        overlay={
          <>
            <div className="fixed bottom-24 right-5 z-30 lg:hidden">
              <PButton
                variant="primary"
                size="lg"
                onClick={handleCreate}
                aria-label={
                  isAtLeagueLimit
                    ? "Créer une league (Premium)"
                    : "Créer une league"
                }
                icon={
                  isAtLeagueLimit ? (
                    <Lock size={20} aria-label="Premium requis" />
                  ) : (
                    <Plus size={22} />
                  )
                }
                className="!rounded-full !h-14 !w-14 !p-0 shadow-modal"
              />
            </div>
            {paymentModal}
          </>
        }
      >
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 min-h-[50vh]">
          <div className="text-6xl">🏅</div>
          <h2 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white">
            Aucune league
          </h2>
          <p className="text-cool-gray max-w-md">
            Créez votre première league pour organiser des compétitions long
            terme
          </p>
          <PButton
            variant="primary"
            size="md"
            icon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Créer une league
            {isAtLeagueLimit && (
              <Lock size={14} className="ml-1 opacity-80" aria-label="Premium requis" />
            )}
          </PButton>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      header={header}
      overlay={
        <>
          <div className="fixed bottom-24 right-5 z-30 lg:hidden">
            <PButton
              variant="primary"
              size="lg"
              onClick={handleCreate}
              aria-label={
                isAtLeagueLimit
                  ? "Créer une league (Premium)"
                  : "Créer une league"
              }
              icon={
                isAtLeagueLimit ? (
                  <Lock size={20} aria-label="Premium requis" />
                ) : (
                  <Plus size={22} />
                )
              }
              className="!rounded-full !h-14 !w-14 !p-0 shadow-modal"
            />
          </div>
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
            <p className="text-cool-gray text-lg">
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
