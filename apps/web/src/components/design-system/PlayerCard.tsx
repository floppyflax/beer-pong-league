/**
 * PlayerCard — Carte joueur
 *
 * Variantes:
 * - compact: infos minimales (avatar + nom) — pour sélection dans TournamentJoin
 * - full: infos complètes (avatar, nom, ELO, W/L, etc.) — pour classements, profils
 */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const first = parts[0] || "";
  return first.slice(0, 2).toUpperCase() || "?";
}

export interface PlayerCardCompactProps {
  variant: "compact";
  name: string;
  avatarUrl?: string;
  selected?: boolean;
  onClick?: () => void;
}

export interface PlayerCardFullProps {
  variant: "full";
  name: string;
  subtitle?: string;
  elo?: number;
  avatarUrl?: string;
  onClick?: () => void;
}

export type PlayerCardProps = PlayerCardCompactProps | PlayerCardFullProps;

export function PlayerCard(props: PlayerCardProps) {
  const initials = getInitials(props.name);

  if (props.variant === "compact") {
    const baseClasses =
      "flex items-center gap-3 p-4 rounded-card border transition-colors text-left w-full";
    const stateClasses = props.selected
      ? "bg-electric-blue/15 border-electric-blue text-white"
      : "bg-navy-soft border-card text-cool-gray hover:border-card-muted hover:text-white";

    const content = (
      <>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-sm font-mono font-bold overflow-hidden border border-card">
          {props.avatarUrl ? (
            <img
              src={props.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-cool-gray">{initials}</span>
          )}
        </div>
        <span className="font-semibold truncate flex-1">{props.name}</span>
      </>
    );

    if (props.onClick) {
      return (
        <button
          type="button"
          onClick={props.onClick}
          className={`${baseClasses} ${stateClasses} cursor-pointer`}
          data-testid="playercard-compact"
        >
          {content}
        </button>
      );
    }

    return (
      <div
        className={`${baseClasses} ${stateClasses}`}
        data-testid="playercard-compact"
      >
        {content}
      </div>
    );
  }

  // variant full
  const fullProps = props as PlayerCardFullProps;
  const baseClasses =
    "flex items-center gap-3 p-4 bg-navy-soft rounded-card border border-card transition-colors text-left w-full";
  const clickableClasses = fullProps.onClick
    ? " cursor-pointer hover:border-card-muted"
    : "";

  const Wrapper = fullProps.onClick ? "button" : "div";
  const wrapperProps = fullProps.onClick
    ? { onClick: fullProps.onClick, type: "button" as const }
    : {};

  return (
    <Wrapper
      className={baseClasses + clickableClasses}
      data-testid="playercard-full"
      {...wrapperProps}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-sm font-mono font-bold overflow-hidden border border-card">
        {fullProps.avatarUrl ? (
          <img
            src={fullProps.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-cool-gray">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate">
          {fullProps.name}
        </div>
        {fullProps.subtitle && (
          <div className="text-sm text-cool-gray truncate">
            {fullProps.subtitle}
          </div>
        )}
      </div>
      {fullProps.elo !== undefined && (
        <div className="flex-shrink-0 text-base font-mono font-bold tabular-nums text-lime">
          {fullProps.elo}
        </div>
      )}
    </Wrapper>
  );
}
