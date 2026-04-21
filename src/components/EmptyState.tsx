import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="mb-4 p-4 bg-paper rounded-full">
          <Icon size={48} className="text-ink-soft" />
        </div>
      )}
      <h3 className="text-xl font-bold text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-ink-soft mb-6 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};


