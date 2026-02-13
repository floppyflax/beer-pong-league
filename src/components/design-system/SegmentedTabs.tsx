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

  const containerClass = isEncapsulated
    ? "bg-slate-800 rounded-xl p-1 flex w-full border border-slate-700"
    : "flex gap-2";

  const getTabClass = (isActive: boolean) => {
    const base = "px-4 py-2 rounded-lg font-semibold transition-colors";
    if (isEncapsulated) {
      const encapsulatedBase = `${base} flex-1 text-center`;
      return isActive
        ? `${encapsulatedBase} bg-gradient-tab-active text-white`
        : `${encapsulatedBase} bg-transparent text-slate-400 hover:text-slate-300`;
    }
    return isActive
      ? `${base} bg-gradient-tab-active text-white`
      : `${base} bg-slate-800 text-slate-400 hover:bg-slate-700`;
  };

  return (
    <div role="tablist" className={containerClass} aria-label="Onglets">
      {tabs.map((tab) => {
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
            className={getTabClass(isActive)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
