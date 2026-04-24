/**
 * ListRow — Story 14-4
 *
 * Composant réutilisable pour les lignes de liste (joueur, tournoi, league).
 * Design system: design-system-convergence.md section 4.3
 */

import { ChevronRight } from 'lucide-react';
import { getInitials } from '@/utils/string';

export interface ListRowPlayerProps {
  variant: 'player';
  /** Nom du joueur */
  name: string;
  /** Sous-texte (ex: W/L, winrate) */
  subtitle: string;
  /** ELO (ou valeur affichée à droite si rightLabel fourni) */
  elo: number;
  /** Libellé personnalisé à droite (ex: "5 matchs") — remplace l'affichage ELO */
  rightLabel?: string;
  /** Rang (1=or, 2=argent, 3=bronze) */
  rank?: number;
  /** Delta ELO (positif=vert, négatif=rouge) */
  delta?: number;
  /** URL avatar ou undefined pour initiales */
  avatarUrl?: string;
  /** Derniers résultats (true=victoire/vert, false=défaite/rouge), max 5, du plus récent au plus ancien */
  recentResults?: boolean[];
  onClick?: () => void;
}

export interface ListRowTournamentProps {
  variant: 'tournament';
  /** Nom du tournoi */
  name: string;
  /** Date affichée */
  date: string;
  /** Statut (badge) */
  status: string;
  /** Métriques */
  metrics: { matches: number; players: number; format: string };
  onClick?: () => void;
}

export interface ListRowLeagueProps {
  variant: 'league';
  /** Nom de la league */
  name: string;
  /** Date ou période */
  date: string;
  /** Statut (badge) */
  status: string;
  /** Métriques */
  metrics: { matches: number; players: number; format: string };
  onClick?: () => void;
}

export type ListRowProps =
  | ListRowPlayerProps
  | ListRowTournamentProps
  | ListRowLeagueProps;

function getRankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-ping-yellow text-navy';
    case 2:
      return 'bg-cool-gray text-navy';
    case 3:
      return 'bg-signal-red-deep text-white';
    default:
      return 'bg-navy-deep text-cool-gray border border-card';
  }
}

export function ListRow(props: ListRowProps) {
  const baseClasses =
    'flex items-center gap-3 p-4 w-full bg-navy-soft rounded-card border border-card transition-colors hover:border-card-muted';
  const clickableClasses = props.onClick ? ' cursor-pointer' : '';

  const handleClick = () => {
    props.onClick?.();
  };

  const role = props.onClick ? 'button' : undefined;
  const Wrapper = props.onClick ? 'button' : 'div';
  const wrapperProps = props.onClick
    ? { onClick: handleClick, type: 'button' as const }
    : {};

  if (props.variant === 'player') {
    const initials = getInitials(props.name);
    const rankBadgeClass = props.rank
      ? getRankBadgeClass(props.rank)
      : 'bg-navy-deep text-cool-gray border border-card';
    const deltaClass =
      props.delta !== undefined
        ? props.delta >= 0
          ? 'text-lime'
          : 'text-signal-red'
        : '';

    return (
      <Wrapper
        className={baseClasses + clickableClasses}
        data-testid="listrow"
        role={role}
        {...wrapperProps}
      >
        {/* Avatar ou initiales */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-sm font-mono font-bold text-cool-gray overflow-hidden border border-card">
          {props.avatarUrl ? (
            <img
              src={props.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Rang pastille */}
        {props.rank !== undefined && (
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${rankBadgeClass}`}
          >
            {props.rank}
          </div>
        )}

        {/* Nom + sous-texte + cercles derniers matchs */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate">
            {props.name}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-cool-gray truncate">{props.subtitle}</span>
            {props.recentResults && props.recentResults.length > 0 && (
              <div className="flex gap-0.5" role="img" aria-label="Derniers résultats">
                {props.recentResults.slice(0, 5).map((won, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      won ? 'bg-lime' : 'bg-signal-red'
                    }`}
                    title={won ? 'Victoire' : 'Défaite'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ELO/rightLabel + delta */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-base font-mono font-bold tabular-nums text-lime">
            {props.rightLabel ?? props.elo}
          </span>
          {props.delta !== undefined && (
            <span
              className={`text-sm font-mono font-semibold tabular-nums ${deltaClass}`}
              data-testid="listrow-delta"
            >
              {props.delta >= 0 ? '+' : ''}
              {props.delta}
            </span>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight
          size={20}
          className="flex-shrink-0 text-cool-gray"
          data-testid="listrow-chevron"
          aria-hidden
        />
      </Wrapper>
    );
  }

  // variant tournament ou league
  const { name, date, status, metrics } = props;
  return (
    <Wrapper
      className={baseClasses + clickableClasses}
      data-testid="listrow"
      role={role}
      {...wrapperProps}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate">
            {name}
          </span>
          <span
            className={`px-2 py-0.5 rounded-sm text-xs font-archivo font-extrabold uppercase tracking-[0.6px] ${
              status.toLowerCase().includes('terminé') ||
              status.toLowerCase().includes('finished')
                ? 'bg-navy-deep text-cool-gray border border-card'
                : 'bg-lime/20 text-lime'
            }`}
          >
            {status}
          </span>
        </div>
        <div className="text-sm text-cool-gray mt-0.5">{date}</div>
        <div className="flex gap-4 mt-2 text-xs text-cool-gray">
          <span>{metrics.matches} matchs</span>
          <span>{metrics.players} joueurs</span>
          <span>{metrics.format}</span>
        </div>
      </div>

      <ChevronRight
        size={20}
        className="flex-shrink-0 text-cool-gray"
        data-testid="listrow-chevron"
        aria-hidden
      />
    </Wrapper>
  );
}
