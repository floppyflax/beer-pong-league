/**
 * Design System — Barrel export
 *
 * Foundational components (always use these instead of raw HTML elements):
 * - Button, Input, Select, Card, Avatar, Badge, PremiumGate
 *
 * Domain-specific components:
 * - StatCard, SegmentedTabs, ListRow, FAB, Banner, SearchBar, HelpCard, PlayerCard
 */

// --- Foundational ---
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { Input } from './Input';
export type { InputProps, InputSize } from './Input';
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';
export { Card } from './Card';
export type { CardProps, CardVariant } from './Card';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';
export { PremiumGate } from './PremiumGate';
export type { PremiumGateProps } from './PremiumGate';

// --- Domain-specific ---
export { StatCard } from './StatCard';
export type { StatCardProps, StatCardVariant } from './StatCard';
export { SegmentedTabs } from './SegmentedTabs';
export type {
  SegmentedTabsProps,
  SegmentedTab,
  SegmentedTabsVariant,
} from './SegmentedTabs';
export { ListRow } from './ListRow';
export type { ListRowProps, ListRowPlayerProps } from './ListRow';
export { FAB } from './FAB';
export type { FABProps, FABVariant } from './FAB';
export { Banner } from './Banner';
export type { BannerProps, BannerVariant, BannerPosition } from './Banner';
export { LifecycleStrip } from './LifecycleStrip';
export type { LifecycleStripProps, LifecycleStripTone } from './LifecycleStrip';
export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';
export { HelpCard } from './HelpCard';
export type { HelpCardProps, HelpCardStep } from './HelpCard';
export { PlayerCard } from './PlayerCard';
export type {
  PlayerCardProps,
  PlayerCardCompactProps,
  PlayerCardLeaderRowProps,
  PlayerCardDetailedProps,
} from './PlayerCard';
export { ScreenLayout } from './ScreenLayout';
export type { ScreenLayoutProps } from './ScreenLayout';
export { PageHero } from './PageHero';
export type { PageHeroProps } from './PageHero';
export { DetailHero } from './DetailHero';
export type {
  DetailHeroProps,
  DetailHeroStat,
  DetailHeroAction,
  DetailHeroMenuItem,
  DetailHeroStatus,
  DetailHeroStatusVariant,
} from './DetailHero';
export { LastActivityCard } from './LastActivityCard';
export type { LastActivityCardProps } from './LastActivityCard';

// PR3 — Everything ELO DS form + input primitives (§5.2)
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

export { ToggleRow } from './ToggleRow';
export type { ToggleRowProps } from './ToggleRow';

export { CodeInput } from './CodeInput';
export type { CodeInputProps } from './CodeInput';

export { InviteSheet } from './InviteSheet';
export type {
  InviteSheetProps,
  InviteSheetShareData,
  InviteSheetLeaguePlayer,
} from './InviteSheet';

export { StickyCTA } from './StickyCTA';
export type { StickyCTAProps } from './StickyCTA';

// Match history card (per-row in dashboards / profile)
export { MatchHistoryCard } from './MatchHistoryCard';
export type {
  MatchHistoryCardProps,
  MatchHistoryCardPlayer,
} from './MatchHistoryCard';

// Claim ghost player (post-account creation flow — see migration 012)
export { ClaimGuestBanner } from './ClaimGuestBanner';
export type { ClaimGuestBannerProps } from './ClaimGuestBanner';
export { ClaimGuestSheet } from './ClaimGuestSheet';
export type { ClaimGuestSheetProps } from './ClaimGuestSheet';

// Join-time identity chooser (continue-as-X / OTP / play-anonymous)
export { IdentityGateSheet } from './IdentityGateSheet';
export type {
  IdentityGateSheetProps,
  IdentityGateChoice,
} from './IdentityGateSheet';

// Admin ghost player management (rename / invite link / delete)
export { GhostManagementSheet } from './GhostManagementSheet';
export type { GhostManagementSheetProps } from './GhostManagementSheet';

// Generic sheet shell — bottom-sheet (mobile) / centered (desktop)
export { Sheet } from './Sheet';
export type { SheetProps, SheetMaxWidth } from './Sheet';

// --- Atoms (small leaves) ---
export { PlayerChip } from './atoms/PlayerChip';
export type { PlayerChipProps, PlayerChipSide } from './atoms/PlayerChip';
export { RankBadge, RANK_BADGE_STYLES } from './atoms/RankBadge';
export type { RankBadgeProps, RankBadgeSize } from './atoms/RankBadge';
export { EmptyState } from './atoms/EmptyState';
export type { EmptyStateProps } from './atoms/EmptyState';

// --- Molecules (composed) ---
export { Stepper } from './molecules/Stepper';
export type { StepperProps } from './molecules/Stepper';
export { QuickAction } from './molecules/QuickAction';
export type { QuickActionProps } from './molecules/QuickAction';
export { CardShell } from './molecules/CardShell';
export type {
  CardShellProps,
  CardShellStatus,
  CardShellStatusTone,
} from './molecules/CardShell';
export { EventCard } from './molecules/EventCard';
export type { EventCardProps } from './molecules/EventCard';
export { LeagueCard } from './molecules/LeagueCard';
export type { LeagueCardProps } from './molecules/LeagueCard';
export { AchievementCard } from './molecules/AchievementCard';
export type {
  AchievementCardProps,
  Achievement,
} from './molecules/AchievementCard';

// --- Page-specific (1-page but documented in showcase) ---
export { TableSide } from './page-specific/TableSide';
export type {
  TableSideProps,
  TableSideState,
} from './page-specific/TableSide';
export { TeamCompositionCard } from './page-specific/TeamCompositionCard';
export type { TeamCompositionCardProps } from './page-specific/TeamCompositionCard';
export { PlayerPool } from './page-specific/PlayerPool';
export type { PlayerPoolProps } from './page-specific/PlayerPool';
export { ContextPickerModal } from './page-specific/ContextPickerModal';
export type { ContextPickerModalProps } from './page-specific/ContextPickerModal';
export {
  CUP_ROWS,
  TOTAL_CUPS,
  ELIMINATION_ORDER,
  EMPTY_DROPPED,
  cupId,
} from './page-specific/recordMatchInternals';
export type {
  Team,
  EnrichedPlayer,
} from './page-specific/recordMatchInternals';

// --- Showcase wrappers (used by /design-system page) ---
export { PhoneFrame } from './showcase/PhoneFrame';
export type { PhoneFrameProps, PhoneFrameDevice } from './showcase/PhoneFrame';
export { DualPreview } from './showcase/DualPreview';
export type { DualPreviewProps } from './showcase/DualPreview';
export {
  ShowcaseSection,
  ShowcaseSubSection,
} from './showcase/ShowcaseSection';
export type {
  ShowcaseSectionProps,
  ShowcaseSubSectionProps,
} from './showcase/ShowcaseSection';

// Archetype mocks removed: the showcase now embeds the real pages via
// LivePagePreview iframes (see DesignSystemShowcase.tsx §12).
