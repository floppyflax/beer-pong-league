/**
 * SegmentedTabs — Story 14-3, 14-30
 *
 * Composant d'onglets segmentés pour filtres (Tous/Actifs/Terminés)
 * et onglets (Classement/Matchs/Paramètres).
 *
 * @see design-system-convergence.md section 4.2
 */

export interface SegmentedTab {
  id: string;
  label: string;
}

export type SegmentedTabsVariant = "default" | "encapsulated";

export interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeId: string;
  onChange: (id: string) => void;
  /** default: onglets séparés (flex gap-2). encapsulated: bloc unique (Frame 3 Mes tournois) */
  variant?: SegmentedTabsVariant;
}

export const SegmentedTabs = ({
  tabs,
  activeId,
  onChange,
  variant = "default",
}: SegmentedTabsProps) => {
  const isEncapsulated = variant === "encapsulated";
  const isDuel = tabs.length === 2;
  const isTrio = tabs.length === 3;

  const containerClass = isEncapsulated
    ? "bg-navy-soft rounded-card p-1 flex w-full border border-card"
    : "flex gap-2";

  const getActiveColor = (index: number) => {
    if (isDuel && index === 1) return "bg-signal-red text-white shadow-glow-red";
    if (isTrio) {
      if (index === 1) return "bg-lime text-navy";
      if (index === 2) return "bg-cool-gray text-navy";
    }
    return "bg-electric-blue text-white shadow-glow-electric";
  };

  const getTabClass = (isActive: boolean, index: number) => {
    const base =
      "px-4 py-2 rounded-sm font-archivo font-extrabold uppercase tracking-tight text-sm transition-colors";
    const activeColor = getActiveColor(index);
    if (isEncapsulated) {
      const encapsulatedBase = `${base} flex-1 text-center`;
      return isActive
        ? `${encapsulatedBase} ${activeColor}`
        : `${encapsulatedBase} bg-transparent text-cool-gray hover:text-white`;
    }
    return isActive
      ? `${base} ${activeColor}`
      : `${base} bg-navy-soft text-cool-gray border border-card hover:border-card-muted hover:text-white`;
  };

  return (
    <div role="tablist" className={containerClass} aria-label="Onglets">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            onClick={() => onChange(tab.id)}
            className={getTabClass(isActive, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
