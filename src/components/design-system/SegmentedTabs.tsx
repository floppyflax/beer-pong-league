/**
 * SegmentedTabs — Story 14-3
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

export interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedTabs = ({
  tabs,
  activeId,
  onChange,
}: SegmentedTabsProps) => {
  return (
    <div
      role="tablist"
      className="flex gap-2"
      aria-label="Onglets"
    >
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
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isActive
                ? "bg-gradient-tab-active text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
