/**
 * Design System — Barrel export
 *
 * Foundational components (always use these instead of raw HTML elements):
 * - Button, Input, Select, Card, Avatar, Badge, PremiumGate
 *
 * Domain-specific components:
 * - StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar, HelpCard, PlayerCard
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
export type {
  ListRowProps,
  ListRowPlayerProps,
  ListRowTournamentProps,
  ListRowLeagueProps,
} from './ListRow';
export { InfoCard } from './InfoCard';
export type {
  InfoCardProps,
  InfoCardInfoItem,
  InfoCardStatusVariant,
} from './InfoCard';
export { FAB } from './FAB';
export type { FABProps, FABVariant } from './FAB';
export { Banner } from './Banner';
export type { BannerProps, BannerVariant, BannerPosition } from './Banner';
export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';
export { HelpCard } from './HelpCard';
export type { HelpCardProps, HelpCardStep } from './HelpCard';
export { PlayerCard } from './PlayerCard';
export type {
  PlayerCardProps,
  PlayerCardCompactProps,
  PlayerCardFullProps,
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

export { SettingsSheet } from './SettingsSheet';
export type {
  SettingsSheetTournamentValues,
  SettingsSheetLeagueValues,
  SettingsSheetTournamentUpdates,
  SettingsSheetLeagueUpdates,
} from './SettingsSheet';
