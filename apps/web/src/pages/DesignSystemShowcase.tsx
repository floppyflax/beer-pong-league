/**
 * Design System Showcase — Everything ELO
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
  MatchHistoryCard,
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
import { FormField, ToggleRow, CodeInput } from "@/components/design-system";
import {
  Sparkline,
  EloChart,
  PAvatar,
  LeaderRow,
  Podium,
  MatchRow,
  DayGroup,
} from "@/components/ponglo";
import { Calendar, Users, LayoutGrid, Plus, Trophy } from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";

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
        <h2 className="text-xl font-archivo font-extrabold uppercase tracking-tight text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-cool-gray mt-1">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-archivo font-extrabold uppercase tracking-[0.8px] text-cool-gray mb-3">
      {children}
    </h3>
  );
}

function Swatch({
  name,
  hex,
  className,
  textClassName = "text-white",
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
      <span className="text-[11px] text-cool-gray font-mono">{name}</span>
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
    <div className="space-y-4 p-4 bg-navy-soft rounded-card border border-card">
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
    <div className="space-y-3 p-4 bg-navy-soft rounded-card border border-card">
      <SearchBar
        value={q}
        onChange={setQ}
        placeholder="Rechercher un joueur…"
      />
      <p className="text-xs text-cool-gray font-mono">
        débouncée : {q || "(vide)"}
      </p>
    </div>
  );
}

function BottomTabPreview() {
  const [route, setRoute] = useState("/");
  return (
    <div className="relative h-64 max-w-sm mx-auto border border-card rounded-card overflow-hidden bg-navy-soft">
      <div className="p-4 text-xs text-cool-gray">
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

function ToggleRowDemo({
  label,
  sub,
  disabled = false,
  defaultOn = false,
}: {
  label: string;
  sub?: string;
  disabled?: boolean;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return <ToggleRow label={label} sub={sub} on={on} onToggle={setOn} disabled={disabled} />;
}

function CodeInputDemo() {
  const [code, setCode] = useState("ABC");
  return (
    <div className="flex flex-col gap-2">
      <CodeInput value={code} onChange={setCode} autoFocus={false} />
      <span className="text-xs font-mono text-cool-gray">Valeur : "{code}"</span>
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
        <header className="sticky top-0 z-10 bg-navy/90 backdrop-blur border-b border-card">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
            <Link
              to="/"
              className="text-cool-gray hover:text-white transition-colors font-archivo font-bold uppercase text-sm tracking-tight"
              aria-label="Retour"
            >
              ← Retour
            </Link>
            <span className="text-cool-gray">/</span>
            <h1 className="text-sm font-archivo font-extrabold uppercase tracking-[0.6px] text-white">
              Design System — Everything ELO
            </h1>
          </div>
        </header>
      }
    >
      <div className="space-y-16">
        {/* ─── Identity ──────────────────────────────────────────── */}
        <Section title="0 · Identity" subtitle="Wordmark et glyph Ponglo">
          <div className="p-8 bg-navy-soft rounded-card border border-card flex flex-col items-center gap-6">
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
          subtitle="Everything ELO — navy base + electric-blue + ping-yellow + lime + signal-red"
        >
          <div>
            <SubHeading>Surfaces</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Swatch name="navy" hex="#0B1320" className="bg-navy" />
              <Swatch name="navy-deep" hex="#070C16" className="bg-navy-deep" />
              <Swatch name="navy-soft" hex="#141D2F" className="bg-navy-soft" />
            </div>
          </div>

          <div>
            <SubHeading>Text</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Swatch
                name="white"
                hex="#FFFFFF"
                className="bg-navy-soft"
                textClassName="text-white"
              />
              <Swatch
                name="cool-gray"
                hex="#A8B0C0"
                className="bg-navy-soft"
                textClassName="text-cool-gray"
              />
            </div>
          </div>

          <div>
            <SubHeading>Brand accents</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch name="electric-blue" hex="#2F6BFF" className="bg-electric-blue" />
              <Swatch name="electric-blue-deep" hex="#1E4CD9" className="bg-electric-blue-deep" />
              <Swatch name="signal-red" hex="#FF3B3B" className="bg-signal-red" />
              <Swatch name="signal-red-deep" hex="#D32828" className="bg-signal-red-deep" />
              <Swatch
                name="ping-yellow"
                hex="#FFD400"
                className="bg-ping-yellow"
                textClassName="text-navy"
              />
              <Swatch
                name="ping-yellow-deep"
                hex="#D9B400"
                className="bg-ping-yellow-deep"
                textClassName="text-navy"
              />
              <Swatch
                name="lime"
                hex="#B7FF3B"
                className="bg-lime"
                textClassName="text-navy"
              />
              <Swatch name="lime-deep" hex="#8BCC1F" className="bg-lime-deep" textClassName="text-navy" />
              <Swatch name="bronze" hex="#CD7F32" className="bg-bronze" />
            </div>
          </div>
        </Section>

        {/* ─── Typography ────────────────────────────────────────── */}
        <Section
          title="2 · Typographie"
          subtitle="Sora (body), Teko (numbers/display), JetBrains Mono (stats/code)"
        >
          <div className="space-y-4 p-6 bg-navy-soft rounded-card border border-card">
            <p className="text-xs text-cool-gray font-mono">Display</p>
            <p className="text-display-lg text-white">1547</p>
            <p className="text-display-md text-white">Champions</p>
            <p className="text-display-sm text-white">Arcade</p>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-cool-gray font-mono">Page / section</p>
            <h1 className="font-archivo font-extrabold uppercase tracking-tight text-white text-2xl">
              Page title
            </h1>
            <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-xl">
              Section title
            </h2>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-cool-gray font-mono">Body</p>
            <p className="text-white">
              Sora body — Le brouillard se lève sur le plateau…
            </p>
            <p className="text-cool-gray text-sm">
              Texte secondaire — stats, légendes, sous-titres.
            </p>

            <div className="h-px bg-card my-4" />

            <p className="text-xs text-cool-gray font-mono">Mono</p>
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
            <div className="flex flex-wrap gap-3 p-4 bg-navy-soft rounded-card border border-card">
              {BUTTON_VARIANTS.map((v) => (
                <PButton key={v} variant={v}>
                  {v}
                </PButton>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>PButton — sizes</SubHeading>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-navy-soft rounded-card border border-card">
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
            <div className="flex flex-wrap gap-4 p-4 bg-navy-soft rounded-card border border-card">
              <EloDelta value={24} />
              <EloDelta value={-12} />
              <EloDelta value={0} />
              <EloDelta value={48} showUnit />
              <EloDelta value={-7} hideArrow />
            </div>
          </div>

          <div>
            <SubHeading>PRankBadge — 7 tiers par ELO (§2.3 Everything ELO)</SubHeading>
            <div className="flex flex-wrap gap-4 p-4 bg-navy-soft rounded-card border border-card">
              {RANKS.map((r) => (
                <div key={r.name} className="flex flex-col items-center gap-2">
                  <PRankBadge elo={r.min + 50} size="lg" />
                  <span className="text-[10px] font-mono text-cool-gray">≥{r.min}</span>
                  <span
                    className="text-[9px] font-mono px-1 rounded"
                    style={{ background: r.color, color: r.textColor }}
                  >
                    {r.color}
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
          <div className="flex flex-wrap gap-6 p-4 bg-navy-soft rounded-card border border-card">
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
                  className={`w-16 h-16 bg-navy-deep border border-card ${cls}`}
                />
                <span className="text-[10px] text-cool-gray font-mono">
                  {k}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-navy-soft rounded-card shadow-card text-center text-xs font-mono text-cool-gray">
              shadow-card
            </div>
            <div className="p-6 bg-navy-soft rounded-card shadow-card-lg text-center text-xs font-mono text-cool-gray">
              shadow-card-lg (glow red)
            </div>
            <div className="p-6 bg-navy-soft rounded-card shadow-fab text-center text-xs font-mono text-cool-gray">
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
            <div className="flex flex-wrap gap-4 items-center p-4 bg-navy-soft rounded-card border border-card">
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

          <div>
            <SubHeading>MatchHistoryCard — feed des matchs (Tournament/League)</SubHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MatchHistoryCard
                teamA={[{ id: "p1", name: "Florian" }]}
                teamB={[{ id: "p2", name: "Niko" }]}
                scoreA={10}
                scoreB={6}
                date={new Date(Date.now() - 30_000).toISOString()}
                eloChanges={{ p1: 16, p2: -16 }}
              />
              <MatchHistoryCard
                teamA={[
                  { id: "p1", name: "Florian" },
                  { id: "p3", name: "Amar" },
                ]}
                teamB={[
                  { id: "p2", name: "Niko" },
                  { id: "p4", name: "Winnie" },
                ]}
                scoreA={6}
                scoreB={10}
                date={new Date(Date.now() - 2 * 3600_000).toISOString()}
                eloChanges={{ p1: -16, p3: -16, p2: 16, p4: 16 }}
                cupsRemaining={4}
              />
              <MatchHistoryCard
                teamA={[
                  { id: "p1", name: "Florian" },
                  { id: "p3", name: "Amar" },
                  { id: "p5", name: "Tom" },
                ]}
                teamB={[
                  { id: "p2", name: "Niko" },
                  { id: "p4", name: "Winnie" },
                  { id: "p6", name: "Jules" },
                ]}
                scoreA={10}
                scoreB={3}
                date={new Date(Date.now() - 26 * 3600_000).toISOString()}
                eloChanges={{ p1: 24, p3: 24, p5: 24, p2: -24, p4: -24, p6: -24 }}
                isLive
              />
              <MatchHistoryCard
                teamA={[{ id: "p1", name: "AlexandreLeGrandJoueurDuMonde" }]}
                teamB={[{ id: "p2", name: "JeanPhilippeDuBeerPong" }]}
                scoreA={8}
                scoreB={10}
                date={new Date(Date.now() - 5 * 86400_000).toISOString()}
                eloChanges={{ p1: -12, p2: 12 }}
              />
            </div>
          </div>
        </Section>

        {/* ─── PR3 Primitives ─────────────────────────────────────── */}
        <Section
          title="6 · Primitives Everything ELO (PR3 §5)"
          subtitle="Sparkline · EloChart · PAvatar · FormField · ToggleRow · CodeInput · LeaderRow · Podium · MatchRow · DayGroup · StatCard compact"
        >
          {/* Sparkline */}
          <div>
            <SubHeading>Sparkline (§5.1) — mini trend chart SVG</SubHeading>
            <div className="flex flex-wrap gap-6 p-4 bg-navy-soft rounded-card border border-card items-center">
              <div className="flex flex-col gap-1 items-center">
                <Sparkline points={[1000, 1050, 1020, 1080, 1070, 1120, 1150]} fill />
                <span className="text-[9px] font-mono text-cool-gray">fill=true</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <Sparkline points={[1200, 1150, 1100, 1080, 1050]} color="#FF3B3B" />
                <span className="text-[9px] font-mono text-cool-gray">descending (signal-red)</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <Sparkline points={[1000, 1000, 1200, 1000, 1000]} width={80} height={28} fill />
                <span className="text-[9px] font-mono text-cool-gray">80×28</span>
              </div>
            </div>
          </div>

          {/* EloChart */}
          <div>
            <SubHeading>EloChart (§5.1) — courbe ELO pleine largeur</SubHeading>
            <div className="p-4 bg-navy-soft rounded-card border border-card">
              <EloChart
                points={[
                  { date: "2025-01-01", elo: 1000 },
                  { date: "2025-02-01", elo: 1050 },
                  { date: "2025-03-01", elo: 1020 },
                  { date: "2025-04-01", elo: 1100 },
                  { date: "2025-05-01", elo: 1080 },
                  { date: "2025-06-01", elo: 1200 },
                  { date: "2025-07-01", elo: 1250 },
                ]}
                width={500}
                height={80}
              />
            </div>
            <div className="p-4 bg-navy-soft rounded-card border border-card mt-2">
              <EloChart points={[{ date: "2025-01-01", elo: 1000 }]} />
            </div>
          </div>

          {/* PAvatar */}
          <div>
            <SubHeading>PAvatar (§5.1) — avatar + ring</SubHeading>
            <div className="flex flex-wrap gap-6 p-4 bg-navy-soft rounded-card border border-card items-center">
              <div className="flex flex-col gap-1 items-center">
                <PAvatar name="Marc Dupont" size={48} ring="#FFD400" />
                <span className="text-[9px] font-mono text-cool-gray">1er (ping-yellow)</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <PAvatar name="Jean Martin" size={40} ring="#A8B0C0" />
                <span className="text-[9px] font-mono text-cool-gray">2e (cool-gray)</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <PAvatar name="Paul Tiers" size={40} ring="#CD7F32" />
                <span className="text-[9px] font-mono text-cool-gray">3e (bronze)</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <PAvatar name="User Moi" size={40} ring="#B7FF3B" />
                <span className="text-[9px] font-mono text-cool-gray">MOI (lime)</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <PAvatar name="No Ring" size={32} />
                <span className="text-[9px] font-mono text-cool-gray">no ring</span>
              </div>
            </div>
          </div>

          {/* FormField */}
          <div>
            <SubHeading>FormField (§5.2) — champ tappable + erreur</SubHeading>
            <div className="flex flex-col gap-3 p-4 bg-navy-soft rounded-card border border-card max-w-sm">
              <FormField label="Nom de la ligue" value="Les Champions du Vendredi" />
              <FormField label="Format" value="" chevron onClick={() => {}} />
              <FormField
                label="Durée"
                value="Saison complète"
                chevron
                onClick={() => {}}
                mono
              />
              <FormField label="Email" value="test@bpl.com" error="Adresse invalide" />
            </div>
          </div>

          {/* ToggleRow */}
          <div>
            <SubHeading>ToggleRow (§5.2) — interrupteur</SubHeading>
            <div className="flex flex-col gap-0 p-4 bg-navy-soft rounded-card border border-card max-w-sm divide-y divide-card">
              <ToggleRowDemo label="Classement ELO" sub="Active le système ELO pour cette ligue" defaultOn={true} />
              <ToggleRowDemo label="Anti-triche" sub="Confirmation requise par l'adversaire" defaultOn={false} />
              <ToggleRowDemo label="Option désactivée" disabled defaultOn={true} />
            </div>
          </div>

          {/* CodeInput */}
          <div>
            <SubHeading>CodeInput (§5.2) — 6 cases OTP</SubHeading>
            <div className="flex flex-col gap-4 p-4 bg-navy-soft rounded-card border border-card">
              <CodeInputDemo />
            </div>
          </div>

          {/* LeaderRow */}
          <div>
            <SubHeading>LeaderRow (§5.3) — ligne leaderboard</SubHeading>
            <div className="flex flex-col gap-1.5 p-4 bg-navy-soft rounded-card border border-card">
              {[
                { rank: 1, name: "Marc Dupont", elo: 1850, delta: +24, eloHistory: [1700, 1750, 1780, 1800, 1850] },
                { rank: 2, name: "Jean Martin", elo: 1720, delta: -12, eloHistory: [1780, 1760, 1730, 1720] },
                { rank: 3, name: "Paul Tiers", elo: 1600, delta: +5, eloHistory: [1550, 1570, 1600] },
                { rank: 4, name: "Alice Lebrun", elo: 1400, delta: 0, eloHistory: [1420, 1400] },
              ].map((p) => (
                <LeaderRow
                  key={p.rank}
                  rank={p.rank}
                  player={{ id: `p${p.rank}`, ...p }}
                  isMe={p.rank === 2}
                />
              ))}
            </div>
          </div>

          {/* Podium */}
          <div>
            <SubHeading>Podium (§5.3) — top 3</SubHeading>
            <div className="max-w-xs">
              <Podium
                top3={[
                  { id: "p1", name: "Marc D.", elo: 1850 },
                  { id: "p2", name: "Jean M.", elo: 1720 },
                  { id: "p3", name: "Paul T.", elo: 1600 },
                ]}
                scope="League des Pingouins"
              />
            </div>
          </div>

          {/* MatchRow */}
          <div>
            <SubHeading>MatchRow (§5.3) — variants history / match</SubHeading>
            <div className="flex flex-col gap-2 p-4 bg-navy-soft rounded-card border border-card">
              <MatchRow
                match={{
                  id: "m1",
                  date: "2026-01-15",
                  teamA: ["p1"],
                  teamB: ["p2"],
                  scoreA: 10,
                  scoreB: 7,
                  eloChanges: { p1: 18, p2: -18 },
                }}
                variant="history"
                userPerspective="won"
                currentPlayerId="p1"
                playerNames={{ p1: "Marc", p2: "Jean" }}
              />
              <MatchRow
                match={{
                  id: "m2",
                  date: "2026-01-14",
                  teamA: ["p3"],
                  teamB: ["p1"],
                  scoreA: 10,
                  scoreB: 8,
                  eloChanges: { p3: 14, p1: -14 },
                }}
                variant="history"
                userPerspective="lost"
                currentPlayerId="p1"
                playerNames={{ p1: "Marc", p3: "Paul" }}
              />
              <MatchRow
                match={{
                  id: "m3",
                  date: "2026-01-13",
                  teamA: ["p1"],
                  teamB: ["p2"],
                  scoreA: 8,
                  scoreB: 8,
                }}
                variant="match"
                playerNames={{ p1: "Marc", p2: "Jean" }}
              />
            </div>
          </div>

          {/* DayGroup */}
          <div>
            <SubHeading>DayGroup (§5.3) — groupe par date</SubHeading>
            <div className="flex flex-col gap-4 p-4 bg-navy-soft rounded-card border border-card">
              <DayGroup label="Hier" count="2 matchs" deltaSum={4}>
                <MatchRow
                  match={{ id: "d1", date: "2026-01-15", teamA: ["p1"], teamB: ["p2"], scoreA: 10, scoreB: 7, eloChanges: { p1: 18 } }}
                  variant="history"
                  userPerspective="won"
                  currentPlayerId="p1"
                  playerNames={{ p1: "Marc", p2: "Jean" }}
                />
              </DayGroup>
              <DayGroup label="Cette semaine" count="3 matchs" deltaSum={-10}>
                <MatchRow
                  match={{ id: "d2", date: "2026-01-12", teamA: ["p2"], teamB: ["p1"], scoreA: 10, scoreB: 6, eloChanges: { p1: -22 } }}
                  variant="history"
                  userPerspective="lost"
                  currentPlayerId="p1"
                  playerNames={{ p1: "Marc", p2: "Jean" }}
                />
              </DayGroup>
            </div>
          </div>

          {/* StatCard compact */}
          <div>
            <SubHeading>StatCard variant="compact" (§5.3) — grille 3×2</SubHeading>
            <div className="grid grid-cols-3 gap-2 max-w-xs">
              <StatCard value={42} label="Matchs" variant="compact" />
              <StatCard value={28} label="Victoires" variant="compact" />
              <StatCard value="67%" label="Ratio" variant="compact" />
              <StatCard value="🔥 4" label="Série" variant="compact" />
              <StatCard value={1850} label="Pic ELO" variant="compact" />
              <StatCard value="#3" label="Rang" variant="compact" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard value={12} label="Joueurs" variant="primary" />
              <StatCard value={24} label="Matchs" variant="success" />
              <StatCard value={1547} label="Top ELO" variant="accent" />
              <StatCard value="+24" label="Delta" />
            </div>
          </div>
        </Section>

        {/* ─── Navigation ────────────────────────────────────────── */}
        <Section
          title="7 · Navigation"
          subtitle="BottomTabMenu 4 onglets (Accueil · Jouer · Classement · Profil), gradient electric-blue pour l'actif"
        >
          <BottomTabPreview />
        </Section>

        {/* ─── Phase D — Live & Achievements ─────────────────────── */}
        <Section
          title="8 · Phase D — Live & Succès"
          subtitle="LiveMatchBadge (D.4) · AchievementCard (D.3)"
        >
          {/* LiveMatchBadge */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">LiveMatchBadge</p>
            <div className="flex items-center gap-4 p-4 bg-navy-soft rounded-lg border border-card">
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge isLive={true} />
                <span className="text-[10px] text-cool-gray">isLive=true</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge isLive={false} />
                <span className="text-[10px] text-cool-gray">isLive=false (rien)</span>
              </div>
            </div>
          </div>

          {/* AchievementCard × 3 */}
          <div className="space-y-2 mt-4">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">AchievementCard</p>
            <div className="space-y-2">
              <AchievementCard achievement={{
                slug: "first_match",
                label: "Premier Match",
                description: "Tu as enregistré ton premier match.",
                icon_key: "flag",
                earned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
              }} />
              <AchievementCard achievement={{
                slug: "five_wins",
                label: "5 Victoires",
                description: "Tu as remporté 5 matchs au total.",
                icon_key: "star",
                earned_at: new Date(Date.now() - 86400000 * 7).toISOString(),
              }} />
              <AchievementCard achievement={{
                slug: "hot_streak",
                label: "En Feu !",
                description: "Tu as enchaîné 3 victoires ou plus d'affilée.",
                icon_key: "flame",
                earned_at: new Date().toISOString(),
              }} />
            </div>
          </div>
        </Section>
      </div>
    </ScreenLayout>
  );
}
