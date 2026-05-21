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
  FAB,
  SegmentedTabs,
  SearchBar,
  LastActivityCard,
  MatchHistoryCard,
  ScreenLayout,
  EventCard,
  PlayerCard,
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
import { Users, LayoutGrid, Plus, Trophy } from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import {
  PlayerChip,
  RankBadge,
  EmptyState,
  Stepper,
  QuickAction,
  TableSide,
  TeamCompositionCard,
  PlayerPool,
  EMPTY_DROPPED,
  DualPreview,
} from "@/components/design-system";
import { LivePagePreview } from "@/components/design-system/showcase/LivePagePreview";
import { useLeague } from "@/context/LeagueContext";

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

/**
 * Catalogue d'états vides utilisés dans l'app — sélectionne via dropdown
 * pour éviter d'empiler 8 cartes.
 */
const EMPTY_STATE_VARIANTS = [
  {
    id: "events",
    icon: "🏆",
    title: "Aucun événement",
    description: "Crée un événement ou rejoins-en un via le code d'invitation.",
    cta: "Créer un événement",
  },
  {
    id: "leagues",
    icon: "🏅",
    title: "Aucune ligue",
    description:
      "Crée une ligue ou rejoins-en une via QR pour un championnat long-terme.",
    cta: "Créer une ligue",
  },
  {
    id: "matches",
    icon: "🍻",
    title: "Aucun match enregistré",
    description: "Démarre une partie pour voir les résultats apparaître ici.",
    cta: "Nouveau match",
  },
  {
    id: "players",
    icon: "👥",
    title: "Aucun joueur",
    description: "Ajoute les premiers joueurs pour démarrer le classement.",
    cta: "Ajouter",
  },
  {
    id: "ranking",
    icon: "📈",
    title: "Pas encore de classement",
    description: "Le classement apparaît après le premier match confirmé.",
  },
  {
    id: "achievements",
    icon: "✨",
    title: "Aucun succès débloqué",
    description: "Joue ton premier match pour décrocher ton premier badge.",
  },
  {
    id: "history",
    icon: "📜",
    title: "Pas d'historique",
    description: "Tes derniers matchs s'afficheront ici.",
  },
  {
    id: "search",
    icon: "🔍",
    title: "Aucun résultat",
    description: "Aucun joueur ne correspond à ta recherche.",
  },
] as const;

function EmptyStatesGallery() {
  const [selected, setSelected] = useState<string>(EMPTY_STATE_VARIANTS[0].id);
  const variant =
    EMPTY_STATE_VARIANTS.find((v) => v.id === selected) ??
    EMPTY_STATE_VARIANTS[0];
  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="bg-navy-soft border border-card rounded-input px-3 py-2 text-sm text-white font-mono"
      >
        {EMPTY_STATE_VARIANTS.map((v) => (
          <option key={v.id} value={v.id}>
            {v.title}
          </option>
        ))}
      </select>
      <div className="bg-navy-soft border border-card rounded-card max-w-md">
        <EmptyState
          icon={variant.icon}
          title={variant.title}
          description={variant.description}
          minHeight="min-h-[28vh]"
          action={
            "cta" in variant && variant.cta ? (
              <button
                type="button"
                className="bg-ping-yellow text-navy border-[1.5px] border-ping-yellow-deep shadow-[0_3px_0_#D9B400] px-5 h-11 rounded-full font-archivo font-extrabold uppercase text-[11px] tracking-[1px] hover:brightness-110 transition"
              >
                {variant.cta}
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

function PageGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 first:mt-0">
      <h3 className="text-sm font-mono uppercase tracking-[2px] text-electric-blue mb-4">
        {label}
      </h3>
      <div className="space-y-10">{children}</div>
    </div>
  );
}

function PageMount({
  title,
  file,
  shot,
  url,
  emptyUrl,
}: {
  title: string;
  file: string;
  /** Slug used to build `/design-system/mobile-screens/<shot>.png`. */
  shot: string;
  /** Same-origin URL of the real route to embed (e.g. `/events`). */
  url: string;
  /**
   * Optional URL that triggers the empty / not-found state of the same
   * page (typically a route with a non-existent id, e.g.
   * `/event/empty-state-demo`). When provided, a [Plein ↔ Vide] toggle
   * appears next to the title.
   */
  emptyUrl?: string;
}) {
  const [mode, setMode] = useState<"full" | "empty">("full");
  const activeUrl = mode === "empty" && emptyUrl ? emptyUrl : url;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-base font-archivo font-extrabold uppercase tracking-tight text-white">
            {title}
          </h4>
          <p className="text-[10px] font-mono text-cool-gray/70">{file}</p>
        </div>
        <div className="flex items-center gap-3">
          {emptyUrl && (
            <div
              className="inline-flex rounded-full border border-card overflow-hidden"
              role="tablist"
              aria-label="État de la page"
            >
              {(["full", "empty"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    mode === m
                      ? "bg-electric-blue text-white"
                      : "text-cool-gray hover:text-white"
                  }`}
                >
                  {m === "full" ? "Plein" : "Vide"}
                </button>
              ))}
            </div>
          )}
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-mono uppercase tracking-widest text-electric-blue hover:text-white transition-colors"
          >
            Ouvrir →
          </a>
        </div>
      </div>
      <DualPreview
        webPreview={
          // Re-key so the iframe fully reloads when switching mode.
          <LivePagePreview key={activeUrl} url={activeUrl} />
        }
        mobileScreenshotSrc={`/design-system/mobile-screens/${shot}.png`}
      />
    </div>
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
  const duo = [
    { id: "matches", label: "Matchs" },
    { id: "ranking", label: "Classement" },
  ];
  const [duoActive, setDuoActive] = useState("matches");
  return (
    <div className="space-y-4 p-4 bg-navy-soft rounded-card border border-card">
      <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">Trio · default</p>
      <SegmentedTabs tabs={tabs} activeId={active} onChange={setActive} />
      <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">Trio · encapsulated</p>
      <SegmentedTabs
        tabs={tabs}
        activeId={active}
        onChange={setActive}
        variant="encapsulated"
      />
      <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">Duo · default (gauche bleu, droit rouge)</p>
      <SegmentedTabs tabs={duo} activeId={duoActive} onChange={setDuoActive} />
      <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">Duo · encapsulated</p>
      <SegmentedTabs
        tabs={duo}
        activeId={duoActive}
        onChange={setDuoActive}
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
            <SubHeading>QuickAction (Home action grid) — voisin de StatCard</SubHeading>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <QuickAction
                label="Nouveau match"
                sub="ELO ranked"
                icon={<BeerPongMatchIcon size={22} />}
                bg="bg-lime"
                color="text-navy"
              />
              <QuickAction
                label="Rejoindre"
                sub="Code court"
                icon={<Users size={22} />}
                bg="bg-electric-blue/15"
                color="text-electric-blue"
                border
              />
              <QuickAction
                label="Tournoi"
                sub="Bracket / event"
                icon={<Trophy size={22} />}
                bg="bg-navy"
                color="text-white"
                border
              />
              <QuickAction
                label="Ligue"
                sub="Long terme"
                icon={<LayoutGrid size={22} />}
                bg="bg-navy"
                color="text-white"
                border
              />
            </div>
          </div>

          <div>
            <SubHeading>SegmentedTabs</SubHeading>
            <TabsShowcase />
          </div>

          <div>
            <SubHeading>
              ListRow — variant&nbsp;<code>player</code> seulement (les variants <code>event</code> / <code>league</code> sont legacy : EventCard / LeagueCard les remplacent en prod)
            </SubHeading>
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
            </div>
          </div>

          {/* PlayerCard — variants compact / leaderRow / detailed */}
          <div>
            <SubHeading>PlayerCard — 3 variants (compact · leaderRow · detailed)</SubHeading>
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">variant=&quot;compact&quot; — picker</p>
              <div className="space-y-2 max-w-md">
                <PlayerCard variant="compact" name="Florian" avatarUrl="https://i.pravatar.cc/150?img=12" selected />
                <PlayerCard variant="compact" name="Amar" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray pt-2">variant=&quot;leaderRow&quot; — médaillon rang en bas-droite de l&apos;avatar, badge ▲/▼ rang en haut-gauche, ELO (blanc) + ΔELO (lime/rouge) sur la ligne du nom (ELO aligné à droite), stats W/L/% à gauche + dots derniers matchs alignés à droite sous l&apos;ELO</p>
              <div className="space-y-2 max-w-md">
                <PlayerCard
                  variant="leaderRow"
                  name="Alice Martin"
                  elo={1547}
                  rank={1}
                  delta={25}
                  rankDelta={2}
                  wins={12}
                  losses={5}
                  recentResults={[true, true, false, true, true]}
                  avatarUrl="https://i.pravatar.cc/150?img=45"
                />
                <PlayerCard
                  variant="leaderRow"
                  name="Bob Dupont"
                  elo={1180}
                  rank={2}
                  delta={-12}
                  rankDelta={-1}
                  wins={10}
                  losses={2}
                  recentResults={[true, false, true, true, true]}
                />
                <PlayerCard
                  variant="leaderRow"
                  name="Niko"
                  elo={1102}
                  rank={3}
                  wins={6}
                  losses={9}
                  recentResults={[false, false, true, false, false]}
                />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray pt-2">variant=&quot;detailed&quot; — profil joueur (2 lignes)</p>
              <div className="space-y-2 max-w-md">
                <PlayerCard
                  variant="detailed"
                  name="Florian"
                  elo={1234}
                  delta={18}
                  rank={1}
                  wins={19}
                  losses={9}
                  recentResults={[true, true, true, false, true]}
                  avatarUrl="https://i.pravatar.cc/150?img=12"
                />
                <PlayerCard
                  variant="detailed"
                  name="Niko"
                  elo={1102}
                  delta={-7}
                  wins={10}
                  losses={13}
                  recentResults={[false, false, true, false, true]}
                />
              </div>
            </div>
          </div>

          <div>
            <SubHeading>HelpCard</SubHeading>
            <HelpCard
              title="Comment ça marche ?"
              steps={[
                { number: 1, text: "Partage le QR code ou le lien" },
                { number: 2, text: "Les joueurs scannent ou cliquent" },
                { number: 3, text: "Ils rejoignent l'événement" },
              ]}
              successMessage="C'est parti pour la compétition !"
            />
          </div>

          {/* EventCard / LeagueCard / AchievementCard — nouveau spot dans §5 pour
              les rendre découvrables (avant section "10 · Molecules"). */}
          <div>
            <SubHeading>EventCard — utilisé sur Events/Competitions list</SubHeading>
            <div className="max-w-md space-y-2">
              <EventCard
                event={{
                  id: "demo-1",
                  name: "Méchoui XIII",
                  date: new Date().toISOString(),
                  format: "2v2",
                  leagueId: null,
                  createdAt: new Date().toISOString(),
                  playerIds: ["a", "b", "c", "d"],
                  matches: [{}, {}, {}] as never,
                  isFinished: false,
                }}
                interactive={false}
              />
              <EventCard
                event={{
                  id: "demo-2",
                  name: "Tournoi Halloween",
                  date: "2025-10-31T00:00:00Z",
                  format: "1v1",
                  leagueId: null,
                  createdAt: new Date().toISOString(),
                  playerIds: ["a", "b"],
                  matches: [{}] as never,
                  isFinished: true,
                }}
                interactive={false}
              />
            </div>
          </div>
          <div>
            <SubHeading>AchievementCard — récompenses joueur</SubHeading>
            <div className="max-w-md space-y-2">
              <AchievementCard
                achievement={{
                  slug: "first_match",
                  label: "Premier Match",
                  description: "Tu as enregistré ton premier match.",
                  icon_key: "flag",
                  earned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                }}
              />
              <AchievementCard
                achievement={{
                  slug: "five_wins",
                  label: "5 Victoires",
                  description: "Tu as remporté 5 matchs au total.",
                  icon_key: "star",
                  earned_at: new Date(Date.now() - 86400000 * 7).toISOString(),
                }}
              />
            </div>
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
                kind="event"
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
            <SubHeading>MatchHistoryCard — feed des matchs (Event/League)</SubHeading>
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
            <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray pb-2">
              Badge ▲/▼ + places sur l&apos;avatar (haut-gauche). ΔELO à
              gauche de l&apos;ELO pour alignement à droite. Convention partagée
              avec <code>PlayerCard.leaderRow</code>.
            </p>
            <div className="flex flex-col gap-1.5 p-4 bg-navy-soft rounded-card border border-card">
              {[
                { rank: 1, name: "Marc Dupont", elo: 1850, delta: +24, rankDelta: 2, eloHistory: [1700, 1750, 1780, 1800, 1850] },
                { rank: 2, name: "Jean Martin", elo: 1720, delta: -12, rankDelta: -1, eloHistory: [1780, 1760, 1730, 1720] },
                { rank: 3, name: "Paul Tiers", elo: 1600, delta: +5, rankDelta: -1, eloHistory: [1550, 1570, 1600] },
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
            <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray pb-2">
              Badge ▲/▼ en haut-gauche de l&apos;avatar. Couronne 👑 du n°1 en
              haut-droite pour éviter la collision. ΔELO à gauche de l&apos;ELO.
            </p>
            <div className="max-w-xs">
              <Podium
                top3={[
                  { id: "p1", name: "Marc D.", elo: 1850, delta: 24, rankDelta: 1 },
                  { id: "p2", name: "Jean M.", elo: 1720, delta: -12, rankDelta: -1 },
                  { id: "p3", name: "Paul T.", elo: 1600, delta: 5 },
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

          {/* StatCard compact — section §6 ne montre que la variante "compact"
              (les autres variantes sont dans §5 pour éviter le doublon). */}
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
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">LiveMatchBadge — 4 statuts</p>
            <div className="flex flex-wrap items-center gap-6 p-4 bg-navy-soft rounded-lg border border-card">
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge status="live" />
                <span className="text-[10px] text-cool-gray">status=&quot;live&quot;</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge status="upcoming" />
                <span className="text-[10px] text-cool-gray">status=&quot;upcoming&quot;</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge status="finished" />
                <span className="text-[10px] text-cool-gray">status=&quot;finished&quot;</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <LiveMatchBadge status="archived" />
                <span className="text-[10px] text-cool-gray">status=&quot;archived&quot;</span>
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

        {/* ─── 9 · Atoms (extracted) ─────────────────────────────── */}
        <Section
          title="9 · Atoms"
          subtitle="Petites feuilles réutilisables : PlayerChip · RankBadge · EmptyState"
        >
          <div className="space-y-2">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">PlayerChip — équipe A / B / neutral, avec ou sans dim</p>
            <div className="flex flex-wrap gap-2">
              <PlayerChip
                name="Florian"
                side="A"
                avatarUrl="https://i.pravatar.cc/150?img=12"
              />
              <PlayerChip name="Amar" side="A" />
              <PlayerChip
                name="Niko"
                side="B"
                avatarUrl="https://i.pravatar.cc/150?img=33"
              />
              <PlayerChip name="Winnie" side="B" dim />
              <PlayerChip name="Marie" side="neutral" />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">RankBadge — sm / md / lg, top-3 medals + fallback</p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((r) => (
                <RankBadge key={r} rank={r} size="md" />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <RankBadge rank={1} size="sm" />
              <RankBadge rank={1} size="md" />
              <RankBadge rank={1} size="lg" />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">EmptyState — galerie via dropdown</p>
            <EmptyStatesGallery />
          </div>
        </Section>

        {/* ─── 10 · Molecules (extracted) ────────────────────────── */}
        <Section
          title="10 · Molecules"
          subtitle="Stepper. (QuickAction est documenté en §5 voisin de StatCard ; EventCard / LeagueCard / AchievementCard sont déjà ailleurs.)"
        >
          <div className="space-y-2">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">Stepper — 2 steps, 3 steps</p>
            <div className="flex flex-col gap-3">
              <Stepper total={2} current={1} label="Étape 1/2 — Saisir équipes" />
              <Stepper total={2} current={2} label="Étape 2/2 — Saisir score" />
              <Stepper total={3} current={2} label="Étape 2/3 — Détails" />
            </div>
          </div>
        </Section>

        {/* ─── 11 · Page-specific ────────────────────────────────── */}
        <Section
          title="11 · Page-specific"
          subtitle="Composants utilisés une seule fois mais documentés : TeamCompositionCard · PlayerPool · TableSide"
        >
          <div className="space-y-2">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">TeamCompositionCard — état actif vs inactif</p>
            <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
              <TeamCompositionCard
                team="A"
                players={[
                  { id: "p1", name: "Florian", elo: 1200, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: "https://i.pravatar.cc/150?img=12" },
                  { id: "p2", name: "Amar", elo: 1180, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: null },
                ]}
                maxSize={2}
                active
                onActivate={() => {}}
                onRemove={() => {}}
              />
              <TeamCompositionCard
                team="B"
                players={[]}
                maxSize={2}
                active={false}
                onActivate={() => {}}
                onRemove={() => {}}
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">PlayerPool</p>
            <div className="max-w-md">
              <PlayerPool
                players={[
                  { id: "p3", name: "Niko", elo: 1100, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: "https://i.pravatar.cc/150?img=33" },
                  { id: "p4", name: "Winnie", elo: 1050, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: null },
                  { id: "p5", name: "Marie", elo: 1020, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: "https://i.pravatar.cc/150?img=45" },
                ]}
                query=""
                onQueryChange={() => {}}
                onSelect={() => {}}
                onCreateNew={async () => {}}
                isCreating={false}
                canCreate
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <p className="text-xs font-mono text-cool-gray uppercase tracking-wider">TableSide — pending vs winner vs loser</p>
            <div className="grid md:grid-cols-3 gap-3 max-w-5xl">
              {(["pending", "winner", "loser"] as const).map((state) => (
                <div
                  key={state}
                  className="bg-navy-soft border border-card rounded-card p-3"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-cool-gray mb-2">
                    state = {state}
                  </p>
                  <TableSide
                    team="A"
                    players={[
                      { id: "p1", name: "Florian", elo: 1200, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: null },
                      { id: "p2", name: "Amar", elo: 1180, wins: 0, losses: 0, matchesPlayed: 0, streak: 0, avatarUrl: null },
                    ]}
                    droppedCups={EMPTY_DROPPED}
                    state={state}
                    onSelectWinner={() => {}}
                    onAdjustCups={() => {}}
                    onToggleCup={() => {}}
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── 12 · Pages réelles (live iframe) ──────────────────── */}
        <PagesArchetypesSection />
      </div>
    </ScreenLayout>
  );
}

/**
 * Live previews of every real page, embedded in iframes that share auth +
 * data with the parent (same origin). For pages requiring an `:id`, we pull
 * one from the user's own leagues/events — falling back to a placeholder
 * id when the user has none yet (the page will then render its empty state).
 */
function PagesArchetypesSection() {
  const { leagues, events } = useLeague();
  // Fallbacks must be valid UUIDs so the iframe doesn't trigger Postgres
  // 22P02 errors when the user has no events / leagues yet.
  const FALLBACK_UUID = "00000000-0000-0000-0000-000000000000";
  const firstLeagueId = leagues[0]?.id ?? FALLBACK_UUID;
  const firstEventId = events[0]?.id ?? FALLBACK_UUID;
  // Try every source we know — league.players (legacy), event.playerIds
  // (current). Fall back to a placeholder id that will trigger the
  // "joueur introuvable" empty state, which is itself useful to preview.
  const firstPlayerId =
    leagues[0]?.players[0]?.id ??
    events[0]?.playerIds?.[0] ??
    FALLBACK_UUID;

  return (
    <Section
      title="12 · Pages réelles"
      subtitle="Chaque encadré est la vraie page de l'app embarquée dans un iframe (même origine, même auth, mêmes données). Ouvre la page complète via le lien Ouvrir →. Les screenshots RN se déposent dans public/design-system/mobile-screens/. Pages avec :id réutilisent ta première ligue / ton premier événement."
    >
      <PageGroup label="A. Listes + CTA">
        <PageMount
          title="Events · /events"
          file="apps/web/src/pages/Events.tsx"
          shot="events"
          url="/events"
        />
        <PageMount
          title="Leagues · /leagues"
          file="apps/web/src/pages/Leagues.tsx"
          shot="leagues"
          url="/leagues"
        />
        <PageMount
          title="Competitions · /competitions"
          file="apps/web/src/pages/Competitions.tsx"
          shot="competitions"
          url="/competitions"
        />
        <PageMount
          title="Mes stats · /stats"
          file="apps/web/src/pages/Stats.tsx"
          shot="stats"
          url="/stats"
        />
      </PageGroup>

      <PageGroup label="B. Dashboards">
        <PageMount
          title="Home · /"
          file="apps/web/src/pages/Home.tsx"
          shot="home"
          url="/"
        />
        <PageMount
          title="EventDashboard · /event/:id"
          file="apps/web/src/pages/EventDashboard.tsx"
          shot="event-dashboard"
          url={`/event/${firstEventId}`}
          emptyUrl="/event/00000000-0000-0000-0000-000000000000"
        />
        <PageMount
          title="LeagueDashboard · /league/:id"
          file="apps/web/src/pages/LeagueDashboard.tsx"
          shot="league-dashboard"
          url={`/league/${firstLeagueId}`}
          emptyUrl="/league/00000000-0000-0000-0000-000000000000"
        />
      </PageGroup>

      <PageGroup label="C. Form wizards">
        <PageMount
          title="CreateEvent · /create-event"
          file="apps/web/src/pages/CreateEvent.tsx"
          shot="create-event"
          url="/create-event"
        />
        <PageMount
          title="CreateLeague · /create-league"
          file="apps/web/src/pages/CreateLeague.tsx"
          shot="create-league"
          url="/create-league"
        />
        <PageMount
          title="RecordMatch · /record-match/:contextType/:id"
          file="apps/web/src/pages/RecordMatch.tsx"
          shot="record-match"
          url={`/record-match/event/${firstEventId}`}
        />
      </PageGroup>

      <PageGroup label="D. Profil">
        <PageMount
          title="UserProfile · /user/profile"
          file="apps/web/src/pages/UserProfile.tsx"
          shot="user-profile"
          url="/user/profile"
        />
        <PageMount
          title="PlayerProfile · /player/:playerId"
          file="apps/web/src/pages/PlayerProfile.tsx"
          shot="player-profile"
          url={`/player/${firstPlayerId}`}
          emptyUrl="/player/00000000-0000-0000-0000-000000000000"
        />
      </PageGroup>

      <PageGroup label="E. Invite / Join">
        <PageMount
          title="EventInvite · /event/:id/invite"
          file="apps/web/src/pages/EventInvite.tsx"
          shot="event-invite"
          url={`/event/${firstEventId}/invite`}
        />
        <PageMount
          title="EventJoin · /event/:id/join"
          file="apps/web/src/pages/EventJoin.tsx"
          shot="event-join"
          url={`/event/${firstEventId}/join`}
        />
        <PageMount
          title="LeagueJoin · /league/:id/join"
          file="apps/web/src/pages/LeagueJoin.tsx"
          shot="league-join"
          url={`/league/${firstLeagueId}/join`}
        />
        <PageMount
          title="Join · /join"
          file="apps/web/src/pages/Join.tsx"
          shot="join"
          url="/join"
        />
      </PageGroup>

      <PageGroup label="F. Paiement / display">
        <PageMount
          title="PaymentSuccess · /payment-success"
          file="apps/web/src/pages/PaymentSuccess.tsx"
          shot="payment-success"
          url="/payment-success"
        />
        <PageMount
          title="PaymentCancel · /payment-cancel"
          file="apps/web/src/pages/PaymentCancel.tsx"
          shot="payment-cancel"
          url="/payment-cancel"
        />
        <PageMount
          title="DisplayView · /league/:id/display"
          file="apps/web/src/pages/DisplayView.tsx"
          shot="display-view"
          url={`/league/${firstLeagueId}/display`}
        />
        <PageMount
          title="EventDisplayView · /event/:id/display"
          file="apps/web/src/pages/EventDisplayView.tsx"
          shot="event-display-view"
          url={`/event/${firstEventId}/display`}
        />
      </PageGroup>
    </Section>
  );
}
