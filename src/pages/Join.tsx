import { useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { BottomMenuSpecific } from "@/components/navigation/BottomMenuSpecific";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { QRScanner } from "@/components/join/QRScanner";
import { CodeInputModal } from "@/components/join/CodeInputModal";
import { HelpCard } from "@/components/design-system/HelpCard";
import { useJoinTournament } from "@/hooks/useJoinTournament";
import { extractCodeFromQR } from "@/utils/extractCodeFromQR";
import { getContentPaddingBottom } from "@/utils/navigationHelpers";
import { Camera, Hash, Target } from "lucide-react";

/**
 * Join Page
 *
 * Page for users to join tournaments via QR code scanning or manual code entry.
 * Story 14-23: Aligned with design system Frame 2.
 */
export const Join = () => {
  const location = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const { joinByCode } = useJoinTournament();

  const handleScanCode = async (scannedCode: string) => {
    setShowScanner(false);
    const code = extractCodeFromQR(scannedCode);
    if (!code) {
      setShowCodeInput(true);
      return;
    }
    try {
      await handleJoinByCode(code);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la jonction au tournoi";
      toast.error(message);
      setShowCodeInput(true);
    }
  };

  const handleJoinByCode = async (code: string) => {
    try {
      await joinByCode(code);
      // Navigation happens inside the hook
      setShowCodeInput(false);
    } catch (err) {
      // Re-throw so CodeInputModal can display error inline (AC3/AC4)
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Contextual Header (Story 13.2) */}
      <ContextualHeader
        title="Rejoindre un Tournoi"
        showBackButton={true}
        onBack={() => window.history.back()}
      />

      <div
        className={`flex flex-col px-4 md:px-6 ${getContentPaddingBottom(location.pathname) || "pb-36 lg:pb-6"}`}
      >
        <div className="max-w-md mx-auto w-full space-y-6">
          {/* Icon + Instructions (Frame 2) */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-violet-600/20 rounded-full flex items-center justify-center">
                <Target size={40} className="text-blue-400" />
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Scannez le QR code affiché par l'organisateur ou saisissez le code
              manuellement pour rejoindre un tournoi existant.
            </p>

            {/* Desktop Actions (AC6 - shown above lg breakpoint) */}
            <div className="hidden lg:flex gap-4 mt-6">
              <button
                onClick={() => setShowScanner(true)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3"
                aria-label="Scanner un QR code"
                title="Utilisez votre mobile"
              >
                <Camera size={24} />
                <span>SCANNER QR</span>
              </button>
              <button
                onClick={() => setShowCodeInput(true)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3"
                aria-label="Saisir un code"
              >
                <Hash size={24} />
                <span>SAISIR CODE</span>
              </button>
            </div>
          </div>

          {/* Comment ça marche ? */}
          <HelpCard
            title="Comment ça marche ?"
            steps={[
              {
                number: 1,
                text: "Scanne le QR code affiché par l'organisateur ou demande le code",
              },
              {
                number: 2,
                text: "Saisis le code si tu ne peux pas scanner",
              },
              {
                number: 3,
                text: "Tu rejoins le tournoi et accèdes au classement",
              },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>

      {/* Mobile Bottom Menu (AC1 - shown below lg breakpoint) */}
      <BottomMenuSpecific
        variant="gradient"
        actions={[
          {
            label: "SCANNER QR",
            icon: <Camera size={20} />,
            onClick: () => setShowScanner(true),
          },
          {
            label: "SAISIR CODE",
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
