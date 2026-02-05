import React, { useState } from 'react';
import { BottomMenuSpecific } from '../components/navigation/BottomMenuSpecific';
import { Modal } from '../components/Modal';
import { Camera, Hash } from 'lucide-react';

// Tournament code format constants
const TOURNAMENT_CODE_LENGTH = 5; // Format: XXXXX (5 alphanumeric characters)

/**
 * Join Page
 * 
 * Page for users to join tournaments via QR code scanning or manual code entry
 * 
 * Features:
 * - QR Scanner action (opens camera)
 * - Code input action (opens modal)
 * - Bottom Menu Specific with 2 actions (mobile only)
 */

export const Join: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-white">
          Rejoindre un Tournoi
        </h1>
        
        <p className="text-slate-300">
          Scannez le QR code du tournoi ou entrez le code manuellement pour rejoindre.
        </p>

        {/* Desktop Actions (shown above lg breakpoint) */}
        <div className="hidden lg:flex gap-4 mt-8">
          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 bg-primary hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Camera size={24} />
            <span>SCANNER QR</span>
          </button>
          
          <button
            onClick={() => setShowCodeInput(true)}
            className="flex-1 bg-primary hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Hash size={24} />
            <span>CODE</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Menu (shown below lg breakpoint) */}
      <BottomMenuSpecific
        actions={[
          {
            label: 'SCANNER QR',
            icon: <Camera size={20} />,
            onClick: () => setShowScanner(true),
          },
          {
            label: 'CODE',
            icon: <Hash size={20} />,
            onClick: () => setShowCodeInput(true),
          },
        ]}
      />

      {/* Scanner QR Modal - PLACEHOLDER: Actual camera integration to be implemented */}
      <Modal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scanner QR"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-slate-300 mb-4">
            La fonctionnalité de scan QR sera implémentée prochainement.
          </p>
          <p className="text-slate-400 text-sm">
            Cette fonctionnalité ouvrira la caméra pour scanner le QR code du tournoi.
          </p>
        </div>
      </Modal>

      {/* Code Input Modal */}
      <Modal
        isOpen={showCodeInput}
        onClose={() => setShowCodeInput(false)}
        title="Entrer le Code"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setShowCodeInput(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                // TODO: Handle code submission and navigation to tournament
                console.log('Code submission not yet implemented');
                setShowCodeInput(false);
              }}
              className="flex-1 bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
            >
              Rejoindre
            </button>
          </div>
        }
      >
        <div>
          <p className="text-slate-300 mb-4">
            Entrez le code à 5 caractères du tournoi que vous souhaitez rejoindre.
          </p>
          <input
            type="text"
            placeholder="XXXXX"
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg uppercase text-center text-2xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={TOURNAMENT_CODE_LENGTH}
            aria-label="Code du tournoi"
          />
        </div>
      </Modal>
    </div>
  );
};
