/**
 * EmptyState — centered "nothing to show" panel with icon + title + body.
 *
 * Used wherever a list/section has zero items. Optional CTA renders below
 * the description.
 */

import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Big icon at the top — typically an emoji or a sized lucide icon. */
  icon: ReactNode;
  title: string;
  description?: string;
  /** Optional action node, usually a `<PButton>`. */
  action?: ReactNode;
  /** Default `min-h-[40vh]`; override for tight slots. */
  minHeight?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  minHeight = "min-h-[40vh]",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 space-y-4 ${minHeight}`}
    >
      <div className="text-5xl" aria-hidden>
        {icon}
      </div>
      <h2 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="text-cool-gray max-w-xs text-sm">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
