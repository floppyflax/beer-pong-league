import { useState } from 'react';
import { BottomMenuSpecific } from '../components/navigation/BottomMenuSpecific';
import { ContextualHeader } from '../components/navigation/ContextualHeader';
import { QRScanner } from '../components/join/QRScanner';
import { CodeInputModal } from '../components/join/CodeInputModal';
import { useJoinTournament } from '../hooks/useJoinTournament';
import { extractCodeFromQR } from '../utils/extractCodeFromQR';
import { Camera, Hash, Target } from 'lucide-react';

/**
 * Join Page
 * 
 * Page for users to join tournaments via QR code scanning or manual code entry
 * 
 * Features:
 * - QR Scanner (opens full-screen camera)
 * - Code input modal (validates and submits code)
 * - Bottom Menu Specific with 2 actions (mobile only)
 * - Works for both authenticated and anonymous users
 * 
 * Acceptance Criteria:
 * - AC1: Page layout with header, instructions, and bottom menu
 * - AC2: QR scanner modal with camera access
 * - AC3: Code input modal with validation
 * - AC4: Code validation and navigation
 * - AC5: Anonymous user support
 * - AC6: Desktop experience (inline actions)
 * - AC7: Empty state with instructions
 */
export const Join = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const { joinByCode } = useJoinTournament();

  const handleScanCode = (scannedCode: string) => {
    setShowScanner(false);
    // Extract code from QR data (could be URL or direct code)
    const code = extractCodeFromQR(scannedCode);
    handleJoinByCode(code);
  };

  const handleJoinByCode = async (code: string) => {
    try {
      await joinByCode(code);
      // Navigation happens inside the hook
      setShowCodeInput(false);
    } catch (err) {
      // Error is handled and displayed by the hook
      // Modal stays open so user can try again
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Contextual Header (Story 13.2) */}
      <ContextualHeader 
        title="Rejoindre" 
        showBackButton={true}
        onBack={() => window.history.back()}
      />

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
        {/* Empty State / Default View (AC7) */}
        <div className="max-w-md w-full space-y-6 text-center">
        {/* Large icon */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
            <Target size={48} className="text-primary" />
          </div>
        </div>

        {/* Instructions title (removed main h1 as it's now in header) */}
        <h2 className="text-2xl font-bold text-white">
          Rejoindre un Tournoi
        </h2>
        
        {/* Instructions (AC1) */}
        <p className="text-slate-300 leading-relaxed">
          Scannez le QR code affiché par l'organisateur ou saisissez le code manuellement pour rejoindre un tournoi existant.
        </p>

        {/* Desktop Actions (AC6 - shown above lg breakpoint) */}
        <div className="hidden lg:flex gap-4 mt-8">
          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 bg-primary hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            aria-label="Scanner un QR code"
            title="Utilisez votre mobile"
          >
            <Camera size={24} />
            <span>SCANNER QR</span>
          </button>
          
          <button
            onClick={() => setShowCodeInput(true)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            aria-label="Saisir un code"
          >
            <Hash size={24} />
            <span>SAISIR CODE</span>
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <p className="text-slate-500 text-sm">
            💡 Astuce : Le code du tournoi vous est fourni par l'organisateur
          </p>
        </div>
      </div>
      </div>

      {/* Mobile Bottom Menu (AC1 - shown below lg breakpoint) */}
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

      {/* QR Scanner Modal (AC2 - full-screen camera) */}
      {showScanner && (
        <QRScanner
          onScan={handleScanCode}
          onClose={() => setShowScanner(false)}
          onFallbackToCodeInput={() => {
            setShowScanner(false);
            setShowCodeInput(true);
          }}
        />
      )}

      {/* Code Input Modal (AC3 - validation & submission) */}
      {showCodeInput && (
        <CodeInputModal
          onSubmit={handleJoinByCode}
          onClose={() => setShowCodeInput(false)}
        />
      )}
    </div>
  );
};
