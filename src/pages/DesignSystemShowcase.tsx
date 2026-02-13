/**
 * Design System Showcase — Story 14-1b, 14-10b
 *
 * Page de visualisation des tokens (Story 14-1), des composants atomiques (Stories 14-2 à 14-8)
 * et de la navigation (Story 14-10b).
 * Accessible via /design-system, lien dans DevPanel (mode dev uniquement).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ListRow,
  Banner,
  StatCard,
  HelpCard,
  InfoCard,
  FAB,
  SegmentedTabs,
  SearchBar,
} from "@/components/design-system";
import { BottomTabMenu } from "@/components/navigation/BottomTabMenu";
import { BottomMenuSpecific } from "@/components/navigation/BottomMenuSpecific";
import {
  Calendar,
  Users,
  LayoutGrid,
  Plus,
  QrCode,
  Trophy,
} from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";

function ColorSwatch({
  name,
  className,
  textClassName = "text-white",
}: {
  name: string;
  className: string;
  textClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`h-12 w-full rounded-lg border border-slate-600 ${className} ${textClassName} flex items-center justify-center text-xs font-medium`}
      >
        Aa
      </div>
      <span className="text-[10px] text-slate-400 font-mono">{name}</span>
    </div>
  );
}

function GradientBar({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-10 w-full rounded-lg ${className}`} />
      <span className="text-[10px] text-slate-400 font-mono">{name}</span>
    </div>
  );
}

function SegmentedTabsShowcase() {
  const [filterActive, setFilterActive] = useState("all");
  const [tabActive, setTabActive] = useState("ranking");
  const [encapsulatedActive, setEncapsulatedActive] = useState("all");

  const filterTabs = [
    { id: "all", label: "Tous" },
    { id: "active", label: "Actifs" },
    { id: "finished", label: "Terminés" },
  ];

  const dashboardTabs = [
    { id: "ranking", label: "Classement" },
    { id: "matches", label: "Matchs" },
    { id: "settings", label: "Paramètres" },
  ];

  return (
    <div className="space-y-6 p-4 bg-background-secondary rounded-card border border-card">
      <div>
        <p className="text-body-sm text-slate-400 mb-2">
          Variant default — Filtres (Tous / Actifs / Terminés)
        </p>
        <SegmentedTabs
          tabs={filterTabs}
          activeId={filterActive}
          onChange={setFilterActive}
        />
      </div>
      <div>
        <p className="text-body-sm text-slate-400 mb-2">
          Variant encapsulated — Filtres dans un bloc unique (Frame 3 Mes
          tournois)
        </p>
        <SegmentedTabs
          tabs={filterTabs}
          activeId={encapsulatedActive}
          onChange={setEncapsulatedActive}
          variant="encapsulated"
        />
      </div>
      <div>
        <p className="text-body-sm text-slate-400 mb-2">
          Onglets (Classement / Matchs / Paramètres)
        </p>
        <SegmentedTabs
          tabs={dashboardTabs}
          activeId={tabActive}
          onChange={setTabActive}
        />
      </div>
      <p className="text-body-sm text-slate-500">
        Default actif :{" "}
        {filterActive === "all"
          ? "Tous"
          : filterActive === "active"
            ? "Actifs"
            : "Terminés"}{" "}
        · Encapsulated :{" "}
        {encapsulatedActive === "all"
          ? "Tous"
          : encapsulatedActive === "active"
            ? "Actifs"
            : "Terminés"}{" "}
        · Dashboard :{" "}
        {tabActive === "ranking"
          ? "Classement"
          : tabActive === "matches"
            ? "Matchs"
            : "Paramètres"}
      </p>
    </div>
  );
}

function BannerShowcase() {
  const [showDismissable, setShowDismissable] = useState(true);

  return (
    <div>
      <h3 className="text-body font-semibold text-slate-300 mb-2">Banner</h3>
      <div className="space-y-3">
        <p className="text-body-sm text-slate-400 mb-2">
          Variants success et error. Position inline ou top. onDismiss
          optionnel.
        </p>
        <Banner message="Tournoi rejoint ! Redirection…" variant="success" />
        <Banner
          message="Erreur lors de la connexion. Réessayez."
          variant="error"
        />
        {showDismissable && (
          <Banner
            message="Message dismissable (cliquez X)"
            variant="success"
            onDismiss={() => setShowDismissable(false)}
          />
        )}
        <Banner
          message="Position top (fixe en haut)"
          variant="success"
          position="top"
        />
      </div>
    </div>
  );
}

function BottomTabMenuPreview() {
  const [activeRoute, setActiveRoute] = useState("/");

  return (
    <div className="relative h-64 max-w-sm mx-auto border border-slate-600 rounded-card overflow-hidden bg-background-secondary">
      <div className="p-4 text-body-sm text-slate-500">
        Simulated content area — click tabs to see active state
      </div>
      <BottomTabMenu
        previewMode
        previewActiveRoute={activeRoute}
        previewOnTabClick={setActiveRoute}
      />
    </div>
  );
}

function SearchBarShowcase() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="space-y-4 p-4 bg-background-secondary rounded-card border border-card">
      <p className="text-body-sm text-slate-400 mb-2">
        Recherche avec debounce 300ms — la valeur débouncée s'affiche ci-dessous
      </p>
      <SearchBar
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Rechercher un tournoi ou une league..."
      />
      <p className="text-body-sm text-slate-500">
        Valeur débouncée : {searchValue || "(vide)"}
      </p>
    </div>
  );
}

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="p-page space-y-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-slate-400 hover:text-primary transition-colors"
            aria-label="Retour"
          >
            ←
          </Link>
          <h1 className="text-page-title lg:text-page-title-lg">
            Design System — Beer Pong League
          </h1>
        </div>

        {/* ========== SECTION: Design Tokens (Story 14-1) ========== */}
        <section className="space-y-6">
          <h2 className="text-section-title text-text-secondary">
            1. Design Tokens
          </h2>

          {/* Couleurs */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Couleurs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <ColorSwatch
                name="bg-background-primary"
                className="bg-background-primary"
              />
              <ColorSwatch
                name="bg-background-secondary"
                className="bg-background-secondary"
              />
              <ColorSwatch
                name="bg-background-tertiary"
                className="bg-background-tertiary"
              />
              <ColorSwatch
                name="text-text-primary"
                className="bg-background-secondary"
                textClassName="text-text-primary"
              />
              <ColorSwatch
                name="text-text-secondary"
                className="bg-background-secondary"
                textClassName="text-text-secondary"
              />
              <ColorSwatch
                name="text-text-tertiary"
                className="bg-background-secondary"
                textClassName="text-text-tertiary"
              />
              <ColorSwatch
                name="text-text-muted"
                className="bg-background-secondary"
                textClassName="text-text-muted"
              />
              <ColorSwatch
                name="primary"
                className="bg-primary"
                textClassName="text-white"
              />
              <ColorSwatch
                name="success"
                className="bg-success"
                textClassName="text-white"
              />
              <ColorSwatch
                name="error"
                className="bg-error"
                textClassName="text-white"
              />
              <ColorSwatch
                name="elo"
                className="bg-elo"
                textClassName="text-white"
              />
              <ColorSwatch
                name="info"
                className="bg-info"
                textClassName="text-white"
              />
              <ColorSwatch
                name="status-active"
                className="bg-status-active"
                textClassName="text-white"
              />
              <ColorSwatch
                name="status-finished"
                className="bg-status-finished"
                textClassName="text-white"
              />
              <ColorSwatch
                name="delta-positive"
                className="bg-delta-positive"
                textClassName="text-white"
              />
              <ColorSwatch
                name="delta-negative"
                className="bg-delta-negative"
                textClassName="text-white"
              />
            </div>
          </div>

          {/* Gradients */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Gradients
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GradientBar name="gradient-cta" className="bg-gradient-cta" />
              <GradientBar
                name="gradient-cta-alt"
                className="bg-gradient-cta-alt"
              />
              <GradientBar name="gradient-fab" className="bg-gradient-fab" />
              <GradientBar
                name="gradient-tab-active"
                className="bg-gradient-tab-active"
              />
              <GradientBar name="gradient-card" className="bg-gradient-card" />
            </div>
            <p className="text-body-sm text-slate-500 mt-2">
              gradient-card : dégradé horizontal discret (slate-700 → slate-800)
              pour cartes TournamentCard / LeagueCard (Frame 3).
            </p>
            <div className="mt-4 p-4 rounded-card border border-card bg-gradient-card">
              <p className="text-body font-semibold text-white">
                Exemple de carte avec bg-gradient-card
              </p>
              <p className="text-body-sm text-slate-400 mt-1">
                Tournoi d&apos;été · 8 joueurs · En cours
              </p>
            </div>
          </div>

          {/* Typographie */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Typographie
            </h3>
            <div className="space-y-2 p-4 bg-background-secondary rounded-card border border-card">
              <p className="text-page-title">page-title (1.25rem bold)</p>
              <p className="text-page-title-lg">page-title-lg (1.5rem bold)</p>
              <p className="text-section-title">
                section-title (1.125rem bold)
              </p>
              <p className="text-body">body (1rem)</p>
              <p className="text-body-sm">body-sm (0.875rem)</p>
              <p className="text-label">label (0.875rem medium)</p>
              <p className="text-stat">stat (1.5rem bold)</p>
            </div>
          </div>

          {/* Espacements */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Espacements
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 bg-background-secondary rounded-lg border border-slate-600 p-page" />
                <span className="text-[10px] text-slate-400 font-mono">
                  p-page (1rem)
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 bg-background-secondary rounded-lg border border-slate-600 p-page-lg" />
                <span className="text-[10px] text-slate-400 font-mono">
                  p-page-lg (1.5rem)
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-card bg-background-secondary rounded-lg border border-slate-600 p-2">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-success rounded" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  gap-card (1rem)
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-background-secondary rounded-lg border border-slate-600 p-2 h-16 mb-bottom-nav" />
                <span className="text-[10px] text-slate-400 font-mono">
                  bottom-nav (5rem)
                </span>
              </div>
            </div>
          </div>

          {/* Radius */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Radius
            </h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 bg-background-secondary border border-slate-600 rounded-card" />
                <span className="text-[10px] text-slate-400 font-mono">
                  rounded-card (0.75rem)
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-10 bg-background-secondary border border-slate-600 rounded-button" />
                <span className="text-[10px] text-slate-400 font-mono">
                  rounded-button (0.5rem)
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-32 h-10 bg-background-secondary border border-slate-600 rounded-input" />
                <span className="text-[10px] text-slate-400 font-mono">
                  rounded-input (0.75rem)
                </span>
              </div>
            </div>
          </div>

          {/* Bordures */}
          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-3">
              Bordures
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-background-secondary rounded-card border border-card">
                <span className="text-body-sm font-mono text-slate-400">
                  border-card
                </span>
              </div>
              <div className="p-4 bg-background-secondary rounded-card border border-card-muted">
                <span className="text-body-sm font-mono text-slate-400">
                  border-card-muted
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SECTION: Composants ========== */}
        <section className="space-y-6">
          <h2 className="text-section-title text-text-secondary">
            2. Composants
          </h2>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              StatCard
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard value={12} label="Joueurs" variant="primary" />
              <StatCard value={24} label="Matchs" variant="success" />
              <StatCard value={1250} label="Top ELO" variant="accent" />
            </div>
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              SegmentedTabs
            </h3>
            <SegmentedTabsShowcase />
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              ListRow
            </h3>
            <div className="space-y-3">
              <p className="text-body-sm text-slate-400 mb-2">
                Variant player (classement)
              </p>
              <ListRow
                variant="player"
                name="Alice Martin"
                subtitle="12W / 5L • 71%"
                elo={1250}
                rank={1}
                delta={25}
              />
              <ListRow
                variant="player"
                name="Bob Dupont"
                subtitle="10W / 2L • 83%"
                elo={1180}
                rank={2}
                delta={-12}
                recentResults={[true, false, true, true, false]}
              />
              <p className="text-body-sm text-slate-400 mt-4 mb-2">
                Variant tournament
              </p>
              <ListRow
                variant="tournament"
                name="Tournoi d'été"
                date="15 juin 2025"
                status="En cours"
                metrics={{ matches: 12, players: 8, format: "Simple" }}
              />
              <p className="text-body-sm text-slate-400 mt-4 mb-2">
                Variant league
              </p>
              <ListRow
                variant="league"
                name="Ligue Pro"
                date="2025"
                status="Active"
                metrics={{ matches: 50, players: 12, format: "Round-robin" }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              HelpCard (variante aide/tuto)
            </h3>
            <p className="text-body-sm text-slate-400 mb-3">
              Carte dédiée aux blocs d&apos;aide et tutoriels. Fond bleu clair
              accentué, icône point d&apos;interrogation.
            </p>
            <HelpCard
              title="Comment ça marche ?"
              steps={[
                { number: 1, text: "Partage le QR code ou le lien" },
                { number: 2, text: "Les joueurs scannent ou cliquent" },
                { number: 3, text: "Ils rejoignent le tournoi" },
              ]}
              successMessage="C'est parti pour la compétition !"
            />
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              InfoCard
            </h3>
            <InfoCard
              title="Tournoi Beer Pong Mars 2025"
              statusBadge="En cours"
              statusVariant="active"
              infos={[
                { icon: Calendar, text: "15 mars 2025" },
                { icon: Users, text: "8 joueurs" },
                { icon: LayoutGrid, text: "2v2" },
              ]}
            />
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">FAB</h3>
            <div className="flex flex-wrap gap-4 items-center p-4 bg-background-secondary rounded-card border border-card">
              <p className="text-body-sm text-slate-400 w-full">
                Variants primary (gradient) et secondary (muted). Icône 24px
                blanche.
              </p>
              <FAB
                icon={Plus}
                onClick={() => {}}
                ariaLabel="Créer (primary)"
                variant="primary"
                inline
              />
              <FAB
                icon={BeerPongMatchIcon}
                onClick={() => {}}
                ariaLabel="Nouveau match (BeerPongMatchIcon)"
                variant="primary"
                inline
              />
              <FAB
                icon={Plus}
                onClick={() => {}}
                ariaLabel="Action secondaire"
                variant="secondary"
                inline
              />
            </div>
          </div>

          <BannerShowcase />

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              SearchBar
            </h3>
            <SearchBarShowcase />
          </div>
        </section>

        {/* ========== SECTION: Navigation (Story 14-10b) ========== */}
        <section className="space-y-6">
          <h2 className="text-section-title text-text-secondary">
            3. Navigation
          </h2>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              BottomTabMenu
            </h3>
            <p className="text-body-sm text-slate-400 mb-3">
              5 tabs (Accueil, Rejoindre, Tournois, Leagues, Profil). Active:
              bg-gradient-tab-active + white text. Inactive: text-slate-400. Min
              height 64px, touch target 48px+. Click tabs to see active/inactive
              states.
            </p>
            <BottomTabMenuPreview />
          </div>

          <div>
            <h3 className="text-body font-semibold text-slate-300 mb-2">
              BottomMenuSpecific
            </h3>
            <p className="text-body-sm text-slate-400 mb-3">
              Context-specific actions (e.g. Scan QR, Create tournament). Stacks
              above BottomTabMenu when both visible.
            </p>
            <div className="relative h-48 max-w-sm mx-auto border border-slate-600 rounded-card overflow-hidden bg-background-secondary">
              <div className="p-4 text-body-sm text-slate-500">
                Simulated list page
              </div>
              <BottomMenuSpecific
                previewMode
                actions={[
                  {
                    label: "Scanner QR",
                    icon: <QrCode size={20} />,
                    onClick: () => {},
                  },
                  {
                    label: "Créer un tournoi",
                    icon: <Trophy size={20} />,
                    onClick: () => {},
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
