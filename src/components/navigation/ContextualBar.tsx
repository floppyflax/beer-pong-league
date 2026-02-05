import { useIsDesktop } from '../../hooks/useBreakpoint';

export interface ContextualAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  visible?: boolean;
  disabled?: boolean;
}

export interface ContextualBarProps {
  actions: ContextualAction[];
}

export const ContextualBar = ({ actions }: ContextualBarProps) => {
  const isDesktop = useIsDesktop();
  const visibleActions = actions.filter(a => a.visible !== false);
  
  if (visibleActions.length === 0) return null;
  
  // Desktop: Inline header buttons
  if (isDesktop) {
    return (
      <div className="flex gap-2" role="toolbar" aria-label="Actions contextuelles">
        {visibleActions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
            className="px-4 py-2 bg-primary hover:bg-amber-600 text-white font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  }
  
  // Mobile: Fixed bottom bar (z-40 to avoid conflicts with modals at z-50)
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 z-40"
      role="toolbar"
      aria-label="Actions contextuelles"
    >
      <div className={`flex max-w-md mx-auto ${
        visibleActions.length === 1 ? '' : 'gap-3'
      }`}>
        {visibleActions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
            className={`${
              visibleActions.length === 1 ? 'w-full' : 'flex-1'
            } bg-primary hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {action.icon}
            <span className="text-sm uppercase">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
