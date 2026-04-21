import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { Player } from '../types';

interface EloChangeDisplayProps {
  players: Player[];
  eloChanges: Record<string, number>;
  onClose: () => void;
}

export const EloChangeDisplay: React.FC<EloChangeDisplayProps> = ({ players, eloChanges, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setShow(true), 100);
    // Auto close after 4 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const playersWithChanges = players
    .filter(p => eloChanges[p.id] !== undefined)
    .map(p => ({
      ...p,
      change: eloChanges[p.id],
      newElo: p.elo
    }))
    .sort((a, b) => b.change - a.change); // Sort by biggest gain first

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700 transform transition-all duration-300 ${
        show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
            <Trophy className="text-primary" size={48} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">MATCH TERMINÉ !</h3>
          <p className="text-slate-400 text-sm">Changements de classement</p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {playersWithChanges.map((player, index) => {
            const isGain = player.change > 0;
            return (
              <div 
                key={player.id}
                className={`bg-slate-800 p-4 rounded-xl border flex items-center justify-between transform transition-all delay-${index * 100} ${
                  show ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                } ${isGain ? 'border-green-500/50' : 'border-red-500/50'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  {isGain ? (
                    <TrendingUp className="text-green-500" size={24} />
                  ) : (
                    <TrendingDown className="text-red-500" size={24} />
                  )}
                  <div>
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-xs text-slate-400">
                      {player.wins}V - {player.losses}D
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-xl ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                    {isGain ? '+' : ''}{player.change}
                  </div>
                  <div className="text-xs text-slate-400">
                    {player.newElo} ELO
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="w-full mt-6 bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          CONTINUER
        </button>
      </div>
    </div>
  );
};



