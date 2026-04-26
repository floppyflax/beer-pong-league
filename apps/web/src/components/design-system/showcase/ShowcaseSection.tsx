/**
 * ShowcaseSection — section wrapper for the /design-system page.
 *
 * Provides a consistent header (eyebrow + title + optional description) and
 * a content slot. Use `subSection` for nested groupings inside a section.
 */

import type { ReactNode } from "react";

export interface ShowcaseSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function ShowcaseSection({
  eyebrow,
  title,
  description,
  children,
}: ShowcaseSectionProps) {
  return (
    <section className="border-t border-card pt-10 pb-6 first:border-t-0 first:pt-0">
      <div className="mb-6 max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-mono uppercase tracking-[2px] text-electric-blue mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl md:text-4xl font-archivo font-black uppercase tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-cool-gray mt-2">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export interface ShowcaseSubSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ShowcaseSubSection({
  title,
  description,
  children,
}: ShowcaseSubSectionProps) {
  return (
    <div className="mt-8 first:mt-0">
      <h3 className="text-lg font-archivo font-extrabold uppercase tracking-tight text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-cool-gray mb-3">{description}</p>
      )}
      {children}
    </div>
  );
}
