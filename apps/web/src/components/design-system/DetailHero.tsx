/**
 * DetailHero — Everything ELO, bloc hero bleu pour les pages détail
 *
 * Utilisé sur `LeagueDashboard` et `TournamentDashboard` : regroupe en un seul
 * bloc l'identité de la page (back + titre + admin), les infos clés (statut
 * + meta) et l'action principale (INVITER + overflow menu).
 *
 * Remplace l'ancien empilement `ContextualHeader` + `PageHero` + `InfoCard` +
 * 3×`StatCard` sur ces pages.
 *
 * Le titre tient dans la ligne du back button (archivo extrabold 17px uppercase,
 * comme un eyebrow `Mes événements`). Pas de titre display géant.
 *
 * Palette : fond `bg-electric-blue` plein écran (pas de `rounded`), chips
 * intérieurs `bg-navy/25`, bouton secondaire outline blanc. Voir spec UI mockup
 * "07 — Détail événement".
 */

import { ChevronLeft, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface DetailHeroStat {
  /** Label court (mono uppercase, ex: "ROUND", "JOUEURS"). */
  label: string;
  /** Valeur (ex: "Quarts de finale", "4/16"). */
  value: ReactNode;
}

export interface DetailHeroAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /**
   * - `primary` = pill lime (CTA principal).
   * - `secondary` = pill outline blanc (CTA secondaire).
   * - `iconOnly` = cercle 44px outline blanc, label sert d'aria-label uniquement.
   */
  variant: "primary" | "secondary" | "iconOnly";
  disabled?: boolean;
}

export interface DetailHeroMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export type DetailHeroStatusVariant =
  | "live"
  | "active"
  | "scheduled"
  | "finished"
  | "cancelled";

export interface DetailHeroStatus {
  /** Texte du chip (ex: "EN DIRECT", "TERMINÉ"). */
  label: string;
  variant: DetailHeroStatusVariant;
}

export interface DetailHeroProps {
  /** Callback retour (affiche un back pill en haut à gauche). */
  onBack?: () => void;
  /** Affiche le pill "ADMIN" en haut à droite. */
  adminBadge?: boolean;
  /** Titre de page (archivo extrabold 17px uppercase, à droite du back). */
  title: ReactNode;
  /** Statut principal (chip coloré dans la meta row). */
  status?: DetailHeroStatus;
  /** Infos secondaires (ex: ["Ce soir · 20:30", "Bar Le Spot · Caen"]). */
  meta?: ReactNode[];
  /** Mini-cards stats (1 à 4 cellules). */
  stats?: DetailHeroStat[];
  /** CTA secondaires affichés sous les stats. */
  actions?: DetailHeroAction[];
  /** Overflow menu (3-dots). Affiché à droite des actions. */
  menuItems?: DetailHeroMenuItem[];
  /** Classe additionnelle sur le wrapper. */
  className?: string;
}

// ── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: DetailHeroStatus }) {
  const dotClass = {
    live: "bg-signal-red",
    active: "bg-lime",
    scheduled: "bg-ping-yellow",
    finished: "bg-cool-gray",
    cancelled: "bg-cool-gray",
  }[status.variant];

  const textClass = {
    live: "text-signal-red",
    active: "text-lime",
    scheduled: "text-ping-yellow",
    finished: "text-white/70",
    cancelled: "text-white/70",
  }[status.variant];

  return (
    <span className="inline-flex items-center gap-1.5 font-archivo font-extrabold uppercase text-[11px] tracking-[1px]">
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClass} ${
          status.variant === "live" ? "animate-pulse" : ""
        }`}
        aria-hidden
      />
      <span className={textClass}>{status.label}</span>
    </span>
  );
}

// ── Overflow menu ───────────────────────────────────────────────────────────

function OverflowMenu({ items }: { items: DetailHeroMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="true"
        className={`w-11 h-11 rounded-full border-2 border-white/80 text-white flex items-center justify-center transition-colors ${
          open ? "bg-white/15" : "hover:bg-white/10"
        }`}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-60 bg-navy-deep border border-card rounded-card shadow-modal z-50 overflow-hidden"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left font-archivo font-semibold text-sm hover:bg-navy-soft transition-colors ${
                item.destructive ? "text-signal-red" : "text-white"
              } ${i < items.length - 1 ? "border-b border-card" : ""}`}
            >
              {item.icon && (
                <span
                  className={`flex-shrink-0 ${
                    item.destructive ? "text-signal-red" : "text-cool-gray"
                  }`}
                >
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export const DetailHero = ({
  onBack,
  adminBadge = false,
  title,
  status,
  meta = [],
  stats = [],
  actions = [],
  menuItems = [],
  className = "",
}: DetailHeroProps) => {
  const statColsClass =
    stats.length === 1
      ? "grid-cols-1"
      : stats.length === 2
        ? "grid-cols-2"
        : stats.length === 4
          ? "grid-cols-4"
          : "grid-cols-3";

  return (
    <section
      className={`bg-electric-blue px-5 pt-12 pb-5 text-white shadow-glow-electric ${className}`}
    >
      {/* Top row: back + title + admin badge */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="w-9 h-9 rounded-full border-[1.5px] border-white/60 flex items-center justify-center text-white hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <h1 className="font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px] text-white truncate flex-1">
          {title}
        </h1>
        {adminBadge && (
          <span className="bg-ping-yellow text-navy px-2 py-0.5 rounded-sm font-archivo font-extrabold uppercase text-[10px] tracking-[1px] flex-shrink-0">
            Admin
          </span>
        )}
      </div>

      {/* Meta row: status + infos */}
      {(status || meta.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          {status && <StatusChip status={status} />}
          {meta.map((item, i) => (
            <span key={i} className="font-mono text-white/85">
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Stats mini-grid */}
      {stats.length > 0 && (
        <div className={`mt-4 grid gap-2 ${statColsClass}`}>
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-navy/25 rounded-md px-3 py-2 min-w-0"
            >
              <div className="font-mono uppercase text-[9px] tracking-[1.5px] text-white/70 truncate">
                {stat.label}
              </div>
              <div className="mt-0.5 font-archivo font-bold text-white text-[14px] leading-tight truncate">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions row */}
      {(actions.length > 0 || menuItems.length > 0) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {actions.map((action, i) => {
            if (action.variant === "iconOnly") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  aria-label={action.label}
                  title={action.label}
                  className={`w-11 h-11 rounded-full border-2 border-white/90 text-white flex items-center justify-center transition-colors flex-shrink-0 hover:bg-white/10 ${
                    action.disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {action.icon}
                </button>
              );
            }
            const base =
              "flex items-center justify-center gap-2 px-5 h-11 rounded-full font-archivo font-extrabold uppercase text-[11px] tracking-[1px] transition-colors flex-shrink-0";
            const variantClass =
              action.variant === "primary"
                ? "bg-lime text-navy hover:bg-lime-deep"
                : "border-2 border-white/90 text-white hover:bg-white/10";
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={`${base} ${variantClass} ${
                  action.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
          {menuItems.length > 0 && <OverflowMenu items={menuItems} />}
        </div>
      )}
    </section>
  );
};
