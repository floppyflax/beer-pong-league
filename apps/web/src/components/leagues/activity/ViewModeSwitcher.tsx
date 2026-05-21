/**
 * ViewModeSwitcher — toggle compact entre les modes "Par event" (grouped)
 * et "Timeline" du tab Activité d'une ligue.
 *
 * Réutilise `SegmentedTabs` en variant `default` (chips séparés) — plus
 * léger visuellement que le variant `encapsulated` des tabs principaux,
 * pour bien marquer la subordination hiérarchique.
 */

import { SegmentedTabs } from "@/components/design-system";
import type { ActivityViewMode } from "@/hooks/useViewModePref";

export interface ViewModeSwitcherProps {
  value: ActivityViewMode;
  onChange: (mode: ActivityViewMode) => void;
}

export const ViewModeSwitcher = ({ value, onChange }: ViewModeSwitcherProps) => {
  return (
    <div className="w-fit" aria-label="Mode d'affichage">
      <SegmentedTabs
        variant="default"
        tabs={[
          { id: "grouped", label: "Par event" },
          { id: "timeline", label: "Timeline" },
        ]}
        activeId={value}
        onChange={(id) => onChange(id as ActivityViewMode)}
      />
    </div>
  );
};
