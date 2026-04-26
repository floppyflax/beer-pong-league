/**
 * Re-export of the design-system `EmptyState` atom with a backwards-compatible
 * shim that accepts a Lucide icon as a class component (legacy callers passed
 * `icon={Trophy}`). Internally we wrap it in the same circle the legacy
 * component used so existing pages render unchanged.
 */

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState as DSEmptyState } from "./design-system/atoms/EmptyState";

interface EmptyStateProps {
  /** Lucide icon class (legacy) — wrapped in a circle automatically. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  const iconNode = Icon ? (
    <div className="p-4 bg-navy-soft rounded-full">
      <Icon size={48} className="text-cool-gray" />
    </div>
  ) : (
    <span aria-hidden>·</span>
  );

  return (
    <DSEmptyState
      icon={iconNode}
      title={title}
      description={description}
      action={action}
    />
  );
};
