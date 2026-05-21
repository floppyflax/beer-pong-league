/**
 * PhotoFinishWizard — orchestrateur du flow Photo Finish ouvert depuis
 * `RecordMatch.handleSubmit` une fois le match enregistré.
 *
 * Steps (state interne) :
 *   1. "prompt"          — Sheet "Tenter la photo finish ?" — 2 CTA
 *   2. "capture-winner"  — WebcamCaptureSheet (réutilise composant existant)
 *   3. "loser-prompt"    — Sheet "Photo de l'équipe perdante ?" — 2 CTA
 *   4. "capture-loser"   — WebcamCaptureSheet
 *   5. "preview"         — Canvas 9:16 + actions (Partager / Enregistrer / Refaire)
 *
 * Le composant est *contrôlé* : `isOpen` + `onClose`. `onClose` est appelé
 * dans tous les cas où l'utilisateur quitte le flow (skip, fermeture, succès
 * après enregistrement). Le parent (RecordMatch) déclenche la navigation
 * dans le `onClose`.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Trophy, Share2, RefreshCw, Check, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { Sheet } from "@/components/design-system/Sheet";
import { PButton } from "@/components/ponglo/PButton";
import { WebcamCaptureSheet } from "@/components/WebcamCaptureSheet";
import {
  composePhotoFinishCollage,
  loadImage,
  type PhotoFinishCollageInput,
  type TeamSummary,
} from "@/utils/photoFinishComposer";
import { matchPhotoService } from "@/services/MatchPhotoService";
import { matchesRepository } from "@/services/repositories/MatchesRepository";

export interface PhotoFinishWizardProps {
  isOpen: boolean;
  matchId: string;
  winnerTeam: TeamSummary;
  loserTeam: TeamSummary;
  score: { winner: number; loser: number };
  cupsRemaining?: number | null;
  contextLabel?: string;
  onClose: () => void;
  /** Called once the collage has been uploaded and `photo_url` persisted. */
  onSaved?: (photoUrl: string) => void;
}

type Step = "prompt" | "capture-winner" | "loser-prompt" | "capture-loser" | "preview";

/** Convert a Blob to an object URL that's revoked when the React effect tears down. */
function useBlobObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function PhotoFinishWizard({
  isOpen,
  matchId,
  winnerTeam,
  loserTeam,
  score,
  cupsRemaining,
  contextLabel,
  onClose,
  onSaved,
}: PhotoFinishWizardProps) {
  const [step, setStep] = useState<Step>("prompt");
  const [winnerBlob, setWinnerBlob] = useState<Blob | null>(null);
  const [loserBlob, setLoserBlob] = useState<Blob | null>(null);
  const [collageBlob, setCollageBlob] = useState<Blob | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const composeAbortRef = useRef(0);

  // Reset state every time the wizard re-opens.
  useEffect(() => {
    if (!isOpen) return;
    setStep("prompt");
    setWinnerBlob(null);
    setLoserBlob(null);
    setCollageBlob(null);
    setIsComposing(false);
    setIsSaving(false);
  }, [isOpen]);

  const collageUrl = useBlobObjectUrl(collageBlob);

  // (Re)compose the collage whenever we have at least the winner photo and
  // we're entering the preview step.
  useEffect(() => {
    if (step !== "preview") return;
    if (!winnerBlob) return;
    const ticket = ++composeAbortRef.current;
    setIsComposing(true);
    setCollageBlob(null);
    (async () => {
      try {
        const [winnerImg, loserImg] = await Promise.all([
          loadImage(URL.createObjectURL(winnerBlob)),
          loserBlob ? loadImage(URL.createObjectURL(loserBlob)) : Promise.resolve(null),
        ]);
        if (!winnerImg) throw new Error("Winner image failed to load");
        const input: PhotoFinishCollageInput = {
          winnerPhoto: winnerImg,
          loserPhoto: loserImg,
          winnerTeam,
          loserTeam,
          score,
          cupsRemaining,
          contextLabel,
          date: new Date().toISOString(),
        };
        const blob = await composePhotoFinishCollage(input);
        if (composeAbortRef.current === ticket) setCollageBlob(blob);
      } catch (error) {
        console.error("composePhotoFinishCollage failed:", error);
        if (composeAbortRef.current === ticket) {
          toast.error("Impossible de générer le collage");
        }
      } finally {
        if (composeAbortRef.current === ticket) setIsComposing(false);
      }
    })();
  }, [step, winnerBlob, loserBlob, winnerTeam, loserTeam, score, cupsRemaining, contextLabel]);

  const winnerLabel = useMemo(
    () => winnerTeam.players.map((p) => p.name).join(" & ") || "Vainqueur",
    [winnerTeam.players],
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAcceptPrompt = () => setStep("capture-winner");
  const handleSkipAll = () => onClose();
  const handleSkipLoser = () => setStep("preview");

  const handleWinnerCaptured = (blob: Blob) => {
    setWinnerBlob(blob);
    setStep("loser-prompt");
  };
  const handleLoserCaptured = (blob: Blob) => {
    setLoserBlob(blob);
    setStep("preview");
  };

  const handleRetake = () => {
    setWinnerBlob(null);
    setLoserBlob(null);
    setCollageBlob(null);
    setStep("capture-winner");
  };

  const handleShare = async () => {
    if (!collageBlob) return;
    const file = new File([collageBlob], `photo-finish-${matchId}.jpg`, {
      type: "image/jpeg",
    });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    const shareData: ShareData = {
      files: [file],
      title: `Beer Pong ELO — ${winnerLabel} gagne ${score.winner}–${score.loser}`,
      text: contextLabel ? `Photo finish — ${contextLabel}` : "Photo finish",
    };
    if (nav.share && nav.canShare?.(shareData)) {
      try {
        await nav.share(shareData);
      } catch {
        /* user dismissed */
      }
      return;
    }
    // Fallback : download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(collageBlob);
    a.download = `photo-finish-${matchId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast.success("Photo téléchargée");
  };

  const handleSaveAndClose = async () => {
    if (!collageBlob || isSaving) return;
    setIsSaving(true);
    try {
      const url = await matchPhotoService.uploadMatchPhoto(matchId, collageBlob);
      if (!url) {
        toast.error("Impossible d'enregistrer la photo");
        return;
      }
      const ok = await matchesRepository.updateMatchPhotoUrl(matchId, url);
      if (!ok) {
        toast.error("Photo uploadée mais lien non sauvegardé");
        return;
      }
      onSaved?.(url);
      toast.success("Photo finish enregistrée !");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // ── Render branches ───────────────────────────────────────────────────────
  if (step === "capture-winner") {
    return (
      <WebcamCaptureSheet
        isOpen
        onClose={onClose}
        onCapture={handleWinnerCaptured}
      />
    );
  }

  if (step === "capture-loser") {
    return (
      <WebcamCaptureSheet
        isOpen
        onClose={handleSkipLoser}
        onCapture={handleLoserCaptured}
      />
    );
  }

  if (step === "loser-prompt") {
    return (
      <Sheet isOpen onClose={onClose} title="Photo de l'équipe perdante ?" maxWidth="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-cool-gray">
            On peut aussi capturer leur tête (optionnel). Sinon, on passe direct au collage.
          </p>
          <div className="flex flex-col gap-2">
            <PButton
              variant="accent"
              size="md"
              full
              icon={<Camera size={18} />}
              onClick={() => setStep("capture-loser")}
            >
              Prendre la photo
            </PButton>
            <PButton variant="ghost" size="md" full onClick={handleSkipLoser}>
              Skip
            </PButton>
          </div>
        </div>
      </Sheet>
    );
  }

  if (step === "preview") {
    return (
      <Sheet
        isOpen
        onClose={isSaving ? () => undefined : onClose}
        title="Photo finish"
        maxWidth="md"
        mobileExpanded
        disableClose={isSaving}
      >
        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-card overflow-hidden bg-navy-deep border border-card">
            {isComposing || !collageUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-cool-gray text-sm">
                <Loader2 size={28} className="animate-spin" />
                <span>Génération du collage…</span>
              </div>
            ) : (
              <img
                src={collageUrl}
                alt="Collage photo finish"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <PButton
              variant="tertiary"
              size="md"
              full
              icon={<Share2 size={18} />}
              onClick={handleShare}
              disabled={!collageBlob || isComposing || isSaving}
            >
              Partager
            </PButton>
            <PButton
              variant="primary"
              size="md"
              full
              icon={isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              onClick={handleSaveAndClose}
              disabled={!collageBlob || isComposing || isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer dans le match"}
            </PButton>
            <PButton
              variant="ghost"
              size="md"
              full
              icon={<RefreshCw size={18} />}
              onClick={handleRetake}
              disabled={isSaving}
            >
              Refaire les photos
            </PButton>
            <PButton variant="ghost" size="md" full onClick={onClose} disabled={isSaving}>
              <span className="inline-flex items-center gap-2">
                <Download size={16} />
                Quitter sans enregistrer
              </span>
            </PButton>
          </div>
        </div>
      </Sheet>
    );
  }

  // step === "prompt"
  return (
    <Sheet isOpen onClose={onClose} title="Photo finish ?" maxWidth="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-full bg-lime/15 border border-lime/40 flex items-center justify-center">
            <Trophy size={26} className="text-lime" />
          </div>
          <p className="text-base font-semibold text-white text-center">
            On immortalise la victoire ?
          </p>
          <p className="text-sm text-cool-gray text-center">
            Photo de l'équipe gagnante (et perdante, optionnel) → on génère un collage
            partageable sur Insta.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <PButton
            variant="tertiary"
            size="md"
            full
            icon={<Camera size={18} />}
            onClick={handleAcceptPrompt}
          >
            On la fait
          </PButton>
          <PButton variant="ghost" size="md" full onClick={handleSkipAll}>
            Plus tard
          </PButton>
        </div>
      </div>
    </Sheet>
  );
}
