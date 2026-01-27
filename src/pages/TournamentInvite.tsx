import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Copy, Check, Share2, Calendar, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const TournamentInvite = () => {
  const { id } = useParams<{ id: string }>();
  const { tournaments, leagues } = useLeague();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const tournament = tournaments.find((t) => t.id === id);
  const league = tournament?.leagueId
    ? leagues.find((l) => l.id === tournament.leagueId)
    : null;

  // Generate invite URL (points to join page)
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

    // Check if Web Share API is available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins le tournoi ${tournament?.name || ""}`,
          text: `Rejoins le tournoi ${tournament?.name || ""} sur Beer Pong League !`,
          url: inviteUrl,
        });
        toast.success("Partagé !");
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          handleCopyLink();
        }
      }
    } else {
      // Fallback to copy if Web Share API is not available
      handleCopyLink();
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournoi introuvable</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const tournamentPlayers = tournament.playerIds.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="p-4 md:p-6">
        <button
          onClick={() => navigate(`/tournament/${tournament.id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Retour au tournoi</span>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Inviter des joueurs
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Partage ce lien pour que d'autres rejoignent le tournoi
          </p>
        </div>
      </div>

      {/* Tournament Info Card */}
      <div className="px-4 md:px-6 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
          <h2 className="text-xl md:text-2xl font-black text-white mb-3">
            {tournament.name}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm md:text-base text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>
                {new Date(tournament.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{tournamentPlayers} joueur{tournamentPlayers > 1 ? "s" : ""}</span>
            </div>
            {league && (
              <div className="flex items-center gap-2">
                <span className="text-primary">Ligue:</span>
                <span>{league.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* QR Code Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-slate-700/50 mb-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg md:text-xl font-black text-white mb-4 text-center">
                Scanne le QR code
              </h3>
              <div className="bg-white p-4 md:p-6 rounded-xl mb-4 shadow-2xl">
                <QRCodeSVG value={inviteUrl} size={200} className="md:hidden" />
                <QRCodeSVG value={inviteUrl} size={280} className="hidden md:block" />
              </div>
              <p className="text-xs md:text-sm text-slate-400 text-center font-medium">
                Scanne avec ton téléphone pour rejoindre
              </p>
            </div>
          </div>

          {/* Link Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-slate-700/50">
            <h3 className="text-lg md:text-xl font-black text-white mb-4 text-center">
              Ou partage le lien
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
                  Lien d'invitation
                </p>
                <p className="text-sm md:text-base text-white font-mono break-all">
                  {inviteUrl}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
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
                {typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function" && (
                  <button
                    onClick={handleShare}
                    className="px-4 md:px-6 py-3 rounded-lg font-bold text-sm md:text-base bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600/50 transition-all flex items-center gap-2"
                  >
                    <Share2 size={18} />
                    <span className="hidden md:inline">Partager</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 md:p-6">
            <h4 className="text-sm md:text-base font-bold text-blue-400 mb-2">
              Comment ça marche ?
            </h4>
            <ul className="text-xs md:text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Partage le QR code ou le lien avec les joueurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Les joueurs cliquent sur le lien ou scannent le QR code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Ils arrivent directement sur la page du tournoi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Ils peuvent voir le classement et les matchs en temps réel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

