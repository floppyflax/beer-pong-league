import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { TournamentCard } from "../components/tournaments/TournamentCard";
import { HelpCard } from "../components/design-system/HelpCard";

/**
 * TournamentInvite — Story 14-14
 *
 * Page d'invitation alignée avec le design system (design-system-convergence.md 5.5).
 * - Header: titre + retour
 * - Carte récap tournoi (TournamentCard, même que Mes Tournois, gradient)
 * - QR code (grand, lisible)
 * - Lien + Copier / Partager
 * - Bloc « Comment ça marche ? » (HelpCard)
 * - Bottom nav visible
 */
export const TournamentInvite = () => {
  const { id } = useParams<{ id: string }>();
  const { tournaments } = useLeague();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const tournament = tournaments.find((t) => t.id === id);
  const inviteUrl = tournament
    ? `${window.location.origin}/tournament/${tournament.id}/join`
    : "";

  const handleCopyLink = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Erreur lors de la copie");
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) {
      handleCopyLink();
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins le tournoi ${tournament?.name || ""}`,
          text: `Rejoins le tournoi ${tournament?.name || ""} sur Beer Pong League !`,
          url: inviteUrl,
        });
        toast.success("Partagé !");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Tournoi introuvable
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <ContextualHeader
        title="Inviter des joueurs"
        showBackButton={true}
        onBack={() => navigate(`/tournament/${tournament.id}`)}
      />

      <div className="p-4 md:p-6">
        {/* Tournament recap card (AC 2) — TournamentCard comme sur Mes Tournois, gradient */}
        <TournamentCard tournament={tournament} />

        {/* QR code section (AC 3) — large, readable */}
        <div className="mt-6 bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700/50">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-white mb-4 text-center">
              Scanne le QR code
            </h3>
            <div className="bg-white p-4 md:p-6 rounded-xl mb-4 shadow-lg">
              <QRCodeSVG
                value={inviteUrl}
                size={220}
                className="md:hidden"
                aria-label="QR code pour rejoindre le tournoi"
              />
              <QRCodeSVG
                value={inviteUrl}
                size={300}
                className="hidden md:block"
                aria-label="QR code pour rejoindre le tournoi"
              />
            </div>
            <p className="text-sm text-slate-400 text-center">
              Scanne avec ton téléphone pour rejoindre
            </p>
          </div>
        </div>

        {/* Link + Copy / Share (AC 4) */}
        <div className="mt-6 bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 text-center">
            Ou partage le lien
          </h3>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
                Lien d&apos;invitation
              </p>
              <p className="text-sm md:text-base text-white font-mono break-all">
                {inviteUrl}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                aria-label={copied ? "Lien copié" : "Copier le lien d'invitation"}
                className={`px-4 md:px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    <span className="hidden md:inline">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span className="hidden md:inline">Copier</span>
                  </>
                )}
              </button>
              {typeof navigator !== "undefined" &&
                "share" in navigator &&
                typeof navigator.share === "function" && (
                  <button
                    onClick={handleShare}
                    aria-label="Partager le lien d'invitation"
                    className="px-4 md:px-6 py-3 rounded-lg font-bold text-sm md:text-base bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600/50 transition-all flex items-center gap-2"
                  >
                    <Share2 size={18} />
                    <span className="hidden md:inline">Partager</span>
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* How does it work? block (AC 5) — HelpCard variante aide/tuto */}
        <div className="mt-6">
          <HelpCard
            title="Comment ça marche ?"
            steps={[
              { number: 1, text: "Partage le QR code ou le lien avec les joueurs" },
              {
                number: 2,
                text: "Les joueurs cliquent sur le lien ou scannent le QR code",
              },
              { number: 3, text: "Ils arrivent directement sur la page du tournoi" },
              {
                number: 4,
                text: "Ils peuvent voir le classement et les matchs en temps réel",
              },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>
    </div>
  );
};
