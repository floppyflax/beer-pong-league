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
      "flex items-center gap-3 p-4 rounded-xl border transition-all text-left w-full";
    const stateClasses = props.selected
      ? "bg-primary/20 border-primary text-white"
      : "bg-slate-800 border-slate-700/50 text-slate-300 hover:border-slate-600";

    const content = (
      <>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold overflow-hidden">
          {props.avatarUrl ? (
            <img
              src={props.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-300">{initials}</span>
          )}
        </div>
        <span className="font-medium truncate flex-1">{props.name}</span>
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
    "flex items-center gap-3 p-4 bg-slate-800 rounded-xl border border-slate-700/50 transition-all text-left w-full";
  const clickableClasses = fullProps.onClick
    ? " cursor-pointer hover:border-slate-600"
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
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold overflow-hidden">
        {fullProps.avatarUrl ? (
          <img
            src={fullProps.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-300">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-white truncate">
          {fullProps.name}
        </div>
        {fullProps.subtitle && (
          <div className="text-sm text-slate-400 truncate">
            {fullProps.subtitle}
          </div>
        )}
      </div>
      {fullProps.elo !== undefined && (
        <div className="flex-shrink-0 text-base font-bold text-primary">
          {fullProps.elo}
        </div>
      )}
    </Wrapper>
  );
}
