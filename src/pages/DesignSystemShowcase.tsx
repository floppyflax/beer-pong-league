/**
 * Design System Showcase — Ponglo Arcade
 *
 * Référence vivante du système visuel : palette, typo, primitives Ponglo,
 * composants design-system reskinés. Accessible via /design-system.
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
  LastActivityCard,
  ScreenLayout,
} from "@/components/design-system";
import {
  PongloWordmark,
  PongloGlyph,
  PButton,
  EloDelta,
  PRankBadge,
  RANKS,
  type PButtonVariant,
} from "@/components/ponglo";
import { BottomTabMenu } from "@/components/navigation/BottomTabMenu";
import { Calendar, Users, LayoutGrid, Plus, Trophy } from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-archivo font-extrabold uppercase tracking-tight text-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-soft mt-1">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-archivo font-extrabold uppercase tracking-[0.8px] text-ink-soft mb-3">
      {children}
    </h3>
  );
}

function Swatch({
  name,
  hex,
  className,
  textClassName = "text-ink",
}: {
  name: string;
  hex: string;
  className: string;
  textClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`h-16 w-full rounded-md border border-card ${className} ${textClassName} flex items-center justify-center text-xs font-mono`}
      >
        {hex}
      </div>
      <span className="text-[11px] text-ink-mute font-mono">{name}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Showcases with local state
// -----------------------------------------------------------------------------

function TabsShowcase() {
  const [active, setActive] = useState("all");
  const tabs = [
    { id: "all", label: "Tous" },
    { id: "active", label: "Actifs" },
    { id: "finished", label: "Terminés" },
  ];
  return (
    <div className="space-y-4 p-4 bg-paper rounded-card border border-card">
      <SegmentedTabs tabs={tabs} activeId={active} onChange={setActive} />
      <SegmentedTabs
        tabs={tabs}
        activeId={active}
        onChange={setActive}
        variant="encapsulated"
      />
    </div>
  );
}

function BannerShowcase() {
  const [show, setShow] = useState(true);
  return (
    <div className="space-y-3">
      <Banner message="Tournoi rejoint ! Redirection…" variant="success" />
      <Banner message="Erreur lors de la connexion." variant="error" />
      {show && (
        <Banner
          message="Banner dismissable"
          variant="success"
          onDismiss={() => setShow(false)}
        />
      )}
    </div>
  );
}

function SearchShowcase() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-3 p-4 bg-paper rounded-card border border-card">
      <SearchBar
        value={q}
        onChange={setQ}
        placeholder="Rechercher un joueur…"
      />
      <p className="text-xs text-ink-mute font-mono">
        débouncée : {q || "(vide)"}
      </p>
    </div>
  );
}

function BottomTabPreview() {
  const [route, setRoute] = useState("/");
  return (
    <div className="relative h-64 max-w-sm mx-auto border border-card rounded-card overflow-hidden bg-paper">
      <div className="p-4 text-xs text-ink-mute">
        Zone de contenu simulée — cliquer sur les tabs.
      </div>
      <BottomTabMenu
        previewMode
        previewActiveRoute={route}
        previewOnTabClick={setRoute}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

const BUTTON_VARIANTS: PButtonVariant[] = [
  "primary",
  "accent",
  "tertiary",
  "lime",
  "dark",
  "ghost",
];

export function DesignSystemShowcase() {
  return (
    <ScreenLayout
      header={
        <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur border-b border-card">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
            <Link
              to="/"
              className="text-ink-soft hover:text-ink transition-colors font-archivo font-bold uppercase text-sm tracking-tight"
              aria-label="Retour"
            >
              ← Retour
            </Link>
            <span className="text-ink-mute">/</span>
            <h1 className="text-sm font-archivo font-extrabold uppercase tracking-[0.6px] text-ink">
              Design System — Ponglo Arcade
            </h1>
          </div>
        </header>
      }
    >
      <div className="space-y-16">
        {/* ─── Identity ──────────────────────────────────────────── */}
        <Section title="0 · Identity" subtitle="Wordmark et glyph Ponglo">
          <div className="p-8 bg-paper rounded-card border border-card flex flex-col items-center gap-6">
            <PongloWordmark size={40} />
            <div className="flex items-center gap-6">
              <PongloGlyph size={48} />
              <PongloGlyph size={64} />
              <PongloWordmark size={20} />
            </div>
          </div>
        </Section>

        {/* ─── Palette ───────────────────────────────────────────── */}
        <Section
          title="1 · Palette"
          subtitle="Dark night + neon accents — 3 rouges : cup-red, cup-red-deep, ruby"
        >
          <div>
            <SubHeading>Surfaces</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Swatch name="cream" hex="#0B0D14" className="bg-cream" />
              <Swatch
                name="cream-deep"
                hex="#050710"
                className="bg-cream-deep"
              />
              <Swatch name="paper" hex="#141826" className="bg-paper" />
            </div>
          </div>

          <div>
            <SubHeading>Ink (textes)</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Swatch
                name="ink"
                hex="#F4F2E8"
                className="bg-paper"
                textClassName="text-ink"
              />
              <Swatch
                name="ink-soft"
                hex="#B8B4A3"
                className="bg-paper"
                textClassName="text-ink-soft"
              />
              <Swatch
                name="ink-mute"
                hex="#6B6A5E"
                className="bg-paper"
                textClassName="text-ink-mute"
              />
            </div>
          </div>

          <div>
            <SubHeading>Brand & signals</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch name="cup-red" hex="#FF4438" className="bg-cup-red" />
              <Swatch
                name="cup-blue"
                hex="#3B8EFF"
                className="bg-cup-blue"
              />
              <Swatch name="lime" hex="#B8FF3D" className="bg-lime" />
              <Swatch
                name="gold"
                hex="#FFB800"
                className="bg-gold"
                textClassName="text-cream"
              />
              <Swatch name="ruby" hex="#FF4438" className="bg-ruby" />
              <Swatch
                name="cup-red-deep"
                hex="#C42418"
                className="bg-cup-red-deep"
              />
              <Swatch
                name="cup-blue-deep"
                hex="#0052D4"
                className="bg-cup-blue-deep"
              />
              <Swatch
                name="cup-green-deep"
                hex="#8BCC1F"
                className="bg-cup-green-deep"
              />
            </div>
          </div>
        </Section>

        {/* ─── Typography ────────────────────────────────────────── */}
        <Section
          title="2 · Typographie"
          subtitle="Space Grotesk (body), Archivo (display/labels), JetBrains Mono (chiffres)"
        >
          <div className="space-y-4 p-6 bg-paper rounded-card border border-card">
            <p className="text-xs text-ink-mute font-mono">Display</p>
            <p className="text-display-lg text-ink">1547</p>
            <p className="text-display-md text-ink">Champions</p>
            <p className="text-display-sm text-ink">Arcade</p>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-ink-mute font-mono">Page / section</p>
            <h1 className="font-archivo font-extrabold uppercase tracking-tight text-ink text-2xl">
              Page title
            </h1>
            <h2 className="font-archivo font-extrabold uppercase tracking-tight text-ink text-xl">
              Section title
            </h2>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-ink-mute font-mono">Body</p>
            <p className="text-ink">
              Space Grotesk body — Le brouillard se lève sur le plateau…
            </p>
            <p className="text-ink-soft text-sm">
              Texte secondaire — stats, légendes, sous-titres.
            </p>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-ink-mute font-mono">Mono</p>
            <p className="font-mono tabular-nums text-lime text-2xl">
              1247 · +24 · 83%
            </p>
          </div>
        </Section>

        {/* ─── Primitives Ponglo ─────────────────────────────────── */}
        <Section
          title="3 · Primitives Ponglo"
          subtitle="PButton, EloDelta, PRankBadge"
        >
          <div>
            <SubHeading>PButton — variants</SubHeading>
            <div className="flex flex-wrap gap-3 p-4 bg-paper rounded-card border border-card">
              {BUTTON_VARIANTS.map((v) => (
                <PButton key={v} variant={v}>
                  {v}
                </PButton>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>PButton — sizes</SubHeading>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-paper rounded-card border border-card">
              <PButton size="sm">Small</PButton>
              <PButton size="md">Medium</PButton>
              <PButton size="lg">Large</PButton>
              <PButton size="md" icon={<Plus size={18} />}>
                Avec icône
              </PButton>
              <PButton size="md" disabled>
                Disabled
              </PButton>
            </div>
          </div>

          <div>
            <SubHeading>EloDelta</SubHeading>
            <div className="flex flex-wrap gap-4 p-4 bg-paper rounded-card border border-card">
              <EloDelta value={24} />
              <EloDelta value={-12} />
              <EloDelta value={0} />
              <EloDelta value={48} showUnit />
              <EloDelta value={-7} hideArrow />
            </div>
          </div>

          <div>
            <SubHeading>PRankBadge — tiers par ELO</SubHeading>
            <div className="flex flex-wrap gap-4 p-4 bg-paper rounded-card border border-card">
              {RANKS.map((r) => (
                <div key={r.name} className="flex flex-col items-center gap-2">
                  <PRankBadge elo={r.min + 50} />
                  <span className="text-[10px] font-mono text-ink-mute">
                    ≥{r.min}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Radius & shadows ──────────────────────────────────── */}
        <Section
          title="4 · Forme"
          subtitle="Radius sharp (2/4/6/10/14) + glow shadows"
        >
          <div className="flex flex-wrap gap-6 p-4 bg-paper rounded-card border border-card">
            {[
              { k: "xs", cls: "rounded-xs" },
              { k: "sm", cls: "rounded-sm" },
              { k: "md", cls: "rounded-md" },
              { k: "lg", cls: "rounded-lg" },
              { k: "xl", cls: "rounded-xl" },
              { k: "card", cls: "rounded-card" },
              { k: "full", cls: "rounded-full" },
            ].map(({ k, cls }) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <div
                  className={`w-16 h-16 bg-cream-deep border border-card ${cls}`}
                />
                <span className="text-[10px] text-ink-mute font-mono">
                  {k}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-paper rounded-card shadow-card text-center text-xs font-mono text-ink-mute">
              shadow-card
            </div>
            <div className="p-6 bg-paper rounded-card shadow-card-lg text-center text-xs font-mono text-ink-mute">
              shadow-card-lg (glow red)
            </div>
            <div className="p-6 bg-paper rounded-card shadow-fab text-center text-xs font-mono text-ink-mute">
              shadow-fab (glow lime)
            </div>
          </div>
        </Section>

        {/* ─── DS Components ─────────────────────────────────────── */}
        <Section
          title="5 · Composants design-system"
          subtitle="API inchangée, reskin Arcade"
        >
          <div>
            <SubHeading>StatCard</SubHeading>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard value={12} label="Joueurs" variant="primary" />
              <StatCard value={24} label="Matchs" variant="success" />
              <StatCard value={1547} label="Top ELO" variant="accent" />
              <StatCard value="+24" label="Delta" />
            </div>
          </div>

          <div>
            <SubHeading>SegmentedTabs</SubHeading>
            <TabsShowcase />
          </div>

          <div>
            <SubHeading>ListRow</SubHeading>
            <div className="space-y-2">
              <ListRow
                variant="player"
                name="Alice Martin"
                subtitle="12W / 5L • 71%"
                elo={1547}
                rank={1}
                delta={25}
                recentResults={[true, true, false, true, true]}
              />
              <ListRow
                variant="player"
                name="Bob Dupont"
                subtitle="10W / 2L • 83%"
                elo={1180}
                rank={2}
                delta={-12}
              />
              <ListRow
                variant="tournament"
                name="Tournoi d'été"
                date="15 juin 2025"
                status="En cours"
                metrics={{ matches: 12, players: 8, format: "Simple" }}
              />
              <ListRow
                variant="league"
                name="Ligue Pro"
                date="2025"
                status="Terminée"
                metrics={{ matches: 50, players: 12, format: "Round-robin" }}
              />
            </div>
          </div>

          <div>
            <SubHeading>HelpCard</SubHeading>
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
            <SubHeading>InfoCard</SubHeading>
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
            <SubHeading>Banner</SubHeading>
            <BannerShowcase />
          </div>

          <div>
            <SubHeading>SearchBar (debounce 300ms)</SubHeading>
            <SearchShowcase />
          </div>

          <div>
            <SubHeading>FAB</SubHeading>
            <div className="flex flex-wrap gap-4 items-center p-4 bg-paper rounded-card border border-card">
              <FAB
                icon={Plus}
                onClick={() => {}}
                ariaLabel="Créer"
                variant="primary"
                inline
              />
              <FAB
                icon={BeerPongMatchIcon}
                onClick={() => {}}
                ariaLabel="Nouveau match"
                variant="primary"
                inline
              />
              <FAB
                icon={Trophy}
                onClick={() => {}}
                ariaLabel="Action secondaire"
                variant="secondary"
                inline
              />
            </div>
          </div>

          <div>
            <SubHeading>LastActivityCard</SubHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LastActivityCard
                kind="tournament"
                activity={{
                  id: "t1",
                  name: "Tournoi d'été",
                  count: 8,
                  updatedAt: new Date().toISOString(),
                  finished: false,
                }}
              />
              <LastActivityCard kind="league" />
            </div>
          </div>
        </Section>

        {/* ─── Navigation ────────────────────────────────────────── */}
        <Section
          title="6 · Navigation"
          subtitle="BottomTabMenu 5 onglets, gradient terracotta pour l'actif"
        >
          <BottomTabPreview />
        </Section>
      </div>
    </ScreenLayout>
  );
}
