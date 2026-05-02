import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Crown } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EventCard } from "@/components/events/EventCard";
import { LeagueCard } from "@/components/leagues/LeagueCard";
import { PButton } from "@/components/ponglo/PButton";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import {
  SearchBar,
  SegmentedTabs,
  Banner,
  ScreenLayout,
  PageHero,
} from "@/components/design-system";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { useEventsList } from "@/hooks/useEventsList";
import { useLeaguesList } from "@/hooks/useLeaguesList";
import { useLeague } from "@/context/LeagueContext";
import toast from "react-hot-toast";

/**
 * Competitions — unified page for Événements + Leagues
 *
 * Remplace les pages `/events` et `/leagues` séparées par un écran unique
 * avec SegmentedTabs [Événements | Leagues] et un FAB qui ouvre un sheet
 * "Créer un événement" / "Créer une ligue".
 *
 * - SegmentedTabs encapsulated (design system 4.2)
 * - SearchBar filtre le tab actif (debounce 300ms)
 * - Filtre secondaire Actifs / Terminés
 * - Premium limits enforced (1 league, 2 events gratuits)
 * - Empty state contextuel par tab
 */

type Scope = "events" | "leagues";
type FilterStatus = "all" | "active" | "finished";

export const Competitions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialScope: Scope =
    searchParams.get("tab") === "leagues" ? "leagues" : "events";
  const [scope, setScope] = useState<Scope>(initialScope);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sync scope → URL (?tab=events|leagues) so back-nav from Create pages lands on the right tab.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== scope) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", scope);
      setSearchParams(next, { replace: true });
    }
     
  }, [scope]);

  const {
    canCreateEvent,
    canCreateLeague,
    isAtEventLimit,
    isAtLeagueLimit,
    refetchPremium,
  } = usePremiumLimits();
  const { events, isLoading: isLoadingEvents, loadError } =
    useEventsList();
  const { leagues, isLoading: isLoadingLeagues } = useLeaguesList();
  const { reloadData } = useLeague();

  const isLoading = isLoadingEvents || isLoadingLeagues;

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchPremium();
    reloadData();
  };

  const [paymentContext, setPaymentContext] = useState<Scope>("events");

  const handleCreateEvent = () => {
    if (canCreateEvent) {
      navigate("/create-event");
    } else {
      setPaymentContext("events");
      setShowPaymentModal(true);
    }
  };

  const handleCreateLeague = () => {
    if (canCreateLeague) {
      navigate("/create-league");
    } else {
      setPaymentContext("leagues");
      setShowPaymentModal(true);
    }
  };

  const handleQuickScore = () => {
    const active = events.find((t) => !t.isFinished);
    if (active) {
      navigate(`/record-match/event/${active.id}`);
    } else {
      toast("Rejoins un événement actif pour enregistrer un score.", { icon: "🏓" });
    }
  };

  // ── Filtered lists ─────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    let result = events || [];
    if (filter === "active") {
      result = result.filter((t) => !t.isFinished);
    } else if (filter === "finished") {
      result = result.filter((t) => t.isFinished);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result;
  }, [events, filter, searchQuery]);

  const filteredLeagues = useMemo(() => {
    let result = leagues || [];
    if (filter === "active") {
      result = result.filter((l) => l.status === "active");
    } else if (filter === "finished") {
      result = result.filter((l) => l.status === "finished");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    return result;
  }, [leagues, filter, searchQuery]);

  // ── Early returns ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-navy">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <ScreenLayout>
        <PageHero eyebrow="Jouer" title="Oups." />
        <div className="space-y-4">
          <Banner message={loadError} variant="error" position="inline" />
          <div className="flex justify-center">
            <PButton variant="primary" size="lg" onClick={() => reloadData()}>
              Réessayer
            </PButton>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const hero = (
    <PageHero
      eyebrow="Jouer"
      title={
        <>
          Tes ligues
          <br />
          et événements.
        </>
      }
      subtitle="Un onglet pour tout — soirées ponctuelles et championnats long-terme."
    />
  );

  const overlay = (
    <>
      {/* Bottom bar: create CTA + score button — same height, equal outer margins */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 pb-bottom-nav lg:pb-bottom-nav-lg pt-3 bg-gradient-to-t from-navy via-navy/80 to-transparent pointer-events-none">
        <PButton
          variant="primary"
          size="sm"
          className="flex-1 !h-14 md:!h-16 pointer-events-auto whitespace-nowrap shadow-none active:translate-y-0"
          icon={<Plus size={14} />}
          onClick={scope === "events" ? handleCreateEvent : handleCreateLeague}
        >
          {scope === "events" ? "Créer un événement" : "Créer une ligue"}
          {((scope === "events" && isAtEventLimit) ||
            (scope === "leagues" && isAtLeagueLimit)) && (
            <Crown
              size={14}
              className="ml-1.5 text-ping-yellow"
              aria-label={
                scope === "leagues" ? "Fonctionnalité Premium" : "Premium requis"
              }
            />
          )}
        </PButton>
        <button
          type="button"
          onClick={handleQuickScore}
          aria-label="Enregistrer un score"
          className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center rounded-full bg-ping-yellow border-[1.5px] border-ping-yellow-deep shadow-fab hover:brightness-110 active:translate-y-[2px] transition-[transform,filter] duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ping-yellow"
        >
          <BeerPongMatchIcon size={24} className="text-navy" />
        </button>
      </div>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          title={
            paymentContext === "leagues"
              ? "Les ligues sont une fonctionnalité Premium"
              : isAtEventLimit
                ? "Limite gratuite atteinte"
                : undefined
          }
          subtitle={
            paymentContext === "leagues"
              ? "Crée des ligues saisonnières ou continues, organise des championnats long-terme et débloque toutes les fonctionnalités avancées."
              : isAtEventLimit
                ? "La version gratuite est limitée à 2 événements actifs. Passez Premium pour des créations illimitées."
                : undefined
          }
        />
      )}
    </>
  );

  const totalCount =
    scope === "events" ? events.length : leagues.length;
  const filteredList = scope === "events" ? filteredEvents : filteredLeagues;
  const searchPlaceholder =
    scope === "events" ? "Rechercher un événement..." : "Rechercher une league...";

  return (
    <ScreenLayout overlay={overlay}>
      {hero}
      <div className="space-y-6">
        {/* Scope: Événements | Leagues */}
        <SegmentedTabs
          tabs={[
            { id: "events", label: "Événements" },
            { id: "leagues", label: "Ligues" },
          ]}
          activeId={scope}
          onChange={(id) => {
            setScope(id as Scope);
            setSearchQuery("");
          }}
          variant="encapsulated"
        />

        {totalCount === 0 ? (
          <EmptyState scope={scope} />
        ) : (
          <>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={searchPlaceholder}
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

            {filteredList.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-cool-gray text-lg">Aucun résultat</p>
              </div>
            ) : scope === "events" ? (
              <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
                {filteredLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ScreenLayout>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────

const EmptyState: React.FC<{ scope: Scope }> = ({ scope }) => {
  const isEvents = scope === "events";
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 min-h-[40vh]">
      <div className="text-5xl">{isEvents ? "🏆" : "🏅"}</div>
      <h2 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white">
        {isEvents ? "Aucun événement" : "Aucune ligue"}
      </h2>
      <p className="text-cool-gray max-w-xs text-sm">
        {isEvents
          ? "Crée un événement ou rejoins-en un via le code d'invitation."
          : "Crée une ligue ou rejoins-en une via QR pour un championnat long-terme."}
      </p>
    </div>
  );
};
