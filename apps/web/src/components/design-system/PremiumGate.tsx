import type { ReactNode } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from './Button';

export interface PremiumGateProps {
  locked: boolean;
  featureName: string;
  onUpgrade: () => void;
  children: ReactNode;
}

export function PremiumGate({ locked, featureName, onUpgrade, children }: PremiumGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative" data-testid="ds-premium-gate">
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-[2px] rounded-card">
        <div className="p-3 bg-amber-500/20 rounded-full">
          <Lock size={24} className="text-amber-400" />
        </div>
        <p className="text-sm text-slate-300 text-center px-4">
          <span className="font-semibold text-white">{featureName}</span> est réservé aux membres Premium
        </p>
        <Button
          variant="premium"
          size="sm"
          icon={Crown}
          onClick={onUpgrade}
        >
          Passer Premium
        </Button>
      </div>
    </div>
  );
}
