import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { Plus } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import {
  SearchBar,
  SegmentedTabs,
  FAB,
  Banner,
  ScreenLayout,
} from "@/components/design-system";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { useTournamentsList } from "@/hooks/useTournamentsList";
import { useLeague } from "@/context/LeagueContext";

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
  const { tournaments, isLoading, loadError } = useTournamentsList();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-navy">
        <LoadingSpinner />
      </div>
    );
  }

  const header = (
    <ContextualHeader
      title="Mes Événements"
      actions={[
        {
          label: "CRÉER ÉVÉNEMENT",
          icon: <Plus size={20} />,
          onClick: handleCreate,
          variant: "primary",
          premium: isAtTournamentLimit,
        },
      ]}
    />
  );

  const paymentModal = showPaymentModal && (
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      onSuccess={handlePaymentSuccess}
    />
  );

  if (loadError) {
    return (
      <ScreenLayout header={<ContextualHeader title="Mes Événements" />}>
        <div className="space-y-4">
          <Banner message={loadError} variant="error" position="inline" />
          <div className="flex justify-center">
            <button
              onClick={() => reloadData()}
              className="bg-signal-red text-white border-[1.5px] border-signal-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-3 px-6 rounded-full transition-[transform,box-shadow,filter] duration-75"
            >
              Réessayer
            </button>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  const filters = (
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
  );

  if (!tournaments || tournaments.length === 0) {
    return (
      <ScreenLayout
        header={header}
        overlay={
          <>
            <FAB
              icon={Plus}
              onClick={handleCreate}
              ariaLabel="Créer un événement"
            />
            {paymentModal}
          </>
        }
      >
        <div className="space-y-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un événement..."
          />
          {filters}

          <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 min-h-[40vh]">
            <div className="text-6xl">🏆</div>
            <h2 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white">
              Aucun événement
            </h2>
            <p className="text-cool-gray max-w-md">
              Rejoignez votre premier événement ou créez-en un
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreate}
                className="bg-signal-red text-white border-[1.5px] border-signal-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-3 px-6 rounded-full transition-[transform,box-shadow,filter] duration-75 inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Créer un événement
                {isAtTournamentLimit && (
                  <span aria-label="Premium requis">🔒</span>
                )}
              </button>
              <button
                onClick={() => navigate("/join")}
                className="bg-navy-soft text-white border-[1.5px] border-card hover:border-card-muted font-archivo font-bold uppercase tracking-tight py-3 px-6 rounded-full transition-colors"
              >
                Rejoindre un événement
              </button>
            </div>
          </div>
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
            ariaLabel="Créer un événement"
          />
          {paymentModal}
        </>
      }
    >
      <div className="space-y-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un événement..."
        />
        {filters}

        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cool-gray text-lg">Aucun résultat</p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </ScreenLayout>
  );
};
