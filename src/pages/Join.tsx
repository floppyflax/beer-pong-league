import { useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { BottomMenuSpecific } from "@/components/navigation/BottomMenuSpecific";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { QRScanner } from "@/components/join/QRScanner";
import { CodeInputModal } from "@/components/join/CodeInputModal";
import { HelpCard } from "@/components/design-system/HelpCard";
import { ScreenLayout } from "@/components/design-system/ScreenLayout";
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

  const paddingBottomClass =
    getContentPaddingBottom(location.pathname) || "pb-36 lg:pb-6";

  return (
    <ScreenLayout
      header={
        <ContextualHeader
          title="Rejoindre un Tournoi"
          showBackButton={true}
          onBack={() => window.history.back()}
        />
      }
      maxWidth="narrow"
      contentClassName={paddingBottomClass}
      overlay={
        <>
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
          {showCodeInput && (
            <CodeInputModal
              onSubmit={handleJoinByCode}
              onClose={() => setShowCodeInput(false)}
            />
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="bg-paper rounded-card p-6 border border-card text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-cup-blue/15 rounded-full flex items-center justify-center border border-cup-blue/30">
              <Target size={40} className="text-cup-blue" />
            </div>
          </div>
          <p className="text-ink-soft leading-relaxed">
            Scanne le QR code affiché par l'organisateur ou saisis le code
            manuellement pour rejoindre un tournoi existant.
          </p>

          <div className="hidden lg:flex gap-3 mt-6">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-1 bg-cup-blue text-ink border-[1.5px] border-cup-blue-deep shadow-[0_3px_0_#0052D4] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#0052D4] font-archivo font-bold uppercase tracking-tight py-3 px-4 rounded-full transition-[transform,box-shadow,filter] duration-75 flex items-center justify-center gap-3"
              aria-label="Scanner un QR code"
            >
              <Camera size={22} />
              <span>Scanner QR</span>
            </button>
            <button
              onClick={() => setShowCodeInput(true)}
              className="flex-1 bg-paper text-ink border-[1.5px] border-card hover:border-card-muted font-archivo font-bold uppercase tracking-tight py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-3"
              aria-label="Saisir un code"
            >
              <Hash size={22} />
              <span>Saisir code</span>
            </button>
          </div>
        </div>

        <HelpCard
          title="Comment ça marche ?"
          steps={[
            {
              number: 1,
              text: "Scanne le QR code affiché par l'organisateur ou demande le code",
            },
            { number: 2, text: "Saisis le code si tu ne peux pas scanner" },
            {
              number: 3,
              text: "Tu rejoins le tournoi et accèdes au classement",
            },
          ]}
          successMessage="C'est parti pour la compétition !"
        />
      </div>
    </ScreenLayout>
  );
};
