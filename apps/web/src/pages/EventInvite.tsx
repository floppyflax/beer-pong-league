import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { EventCard } from "../components/events/EventCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { PButton } from "../components/ponglo/PButton";

/**
 * EventInvite — partage QR + lien + code du tournoi.
 * B.1 redesign: bannière code Everything ELO, PButton pour actions, tokens canoniques.
 */
export const EventInvite = () => {
  const { id } = useParams<{ id: string }>();
  const { events } = useLeague();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const event = events.find((t) => t.id === id);
  const inviteUrl = event
    ? `${window.location.origin}/event/${event.id}/join`
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
          title: `Rejoins l'événement ${event?.name || ""}`,
          text: `Rejoins l'événement ${event?.name || ""} sur Beer Pong ELO !`,
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

  if (!event) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Événement introuvable</h1>
          <PButton variant="primary" onClick={() => navigate("/")}>
            Retour à l&apos;accueil
          </PButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title="Inviter des joueurs"
        showBackButton={true}
        onBack={() => navigate(`/event/${event.id}`)}
      />

      <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
        {/* Event recap */}
        <EventCard event={event} />

        {/* ── Code bannière (Everything ELO pattern) ──────────────────── */}
        {event.joinCode && (
          <div className="bg-electric-blue rounded-card p-4 md:p-5 text-center">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-white/70 mb-1.5">
              Code de l'événement
            </p>
            <p
              className="font-archivo font-black text-white"
              style={{ fontSize: 32, letterSpacing: "6px" }}
            >
              {event.joinCode}
            </p>
            <p className="text-xs text-white/70 mt-1.5">
              Tape-le pour rejoindre sans scanner
            </p>
          </div>
        )}

        {/* ── QR code ─────────────────────────────────────────────────── */}
        <div className="bg-navy-soft rounded-card p-6 md:p-8 border border-card">
          <h3 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm text-center mb-5">
            Scanne le QR code
          </h3>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-card shadow-lg">
              <QRCodeSVG
                value={inviteUrl}
                size={220}
                className="md:hidden"
                aria-label="QR code pour rejoindre l'événement"
              />
              <QRCodeSVG
                value={inviteUrl}
                size={280}
                className="hidden md:block"
                aria-label="QR code pour rejoindre l'événement"
              />
            </div>
          </div>
          <p className="text-sm text-cool-gray text-center mt-4">
            Scanne avec ton téléphone pour rejoindre
          </p>
        </div>

        {/* ── Lien + actions ──────────────────────────────────────────── */}
        <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
          <h3 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm text-center mb-4">
            Ou partage le lien
          </h3>

          {/* URL display */}
          <div className="bg-navy rounded-input p-3 border border-card mb-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray mb-1">
              Lien d&apos;invitation
            </p>
            <p className="text-sm text-white font-mono break-all leading-snug">
              {inviteUrl}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <PButton
              variant={copied ? "lime" : "accent"}
              size="md"
              className="flex-1"
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={handleCopyLink}
              aria-label={copied ? "Lien copié" : "Copier le lien d'invitation"}
            >
              {copied ? "Copié !" : "Copier"}
            </PButton>

            {typeof navigator !== "undefined" &&
              "share" in navigator &&
              typeof navigator.share === "function" && (
                <PButton
                  variant="ghost"
                  size="md"
                  icon={<Share2 size={16} />}
                  onClick={handleShare}
                  aria-label="Partager le lien d'invitation"
                >
                  Partager
                </PButton>
              )}
          </div>
        </div>

        {/* ── Comment ça marche ? ──────────────────────────────────────── */}
        <HelpCard
          title="Comment ça marche ?"
          steps={[
            { number: 1, text: "Partage le QR code, le lien ou le code court" },
            {
              number: 2,
              text: "Les joueurs cliquent sur le lien ou scannent le QR code",
            },
            { number: 3, text: "Ils arrivent directement sur la page de l'événement" },
            {
              number: 4,
              text: "Ils peuvent voir le classement et les matchs en temps réel",
            },
          ]}
          successMessage="C'est parti pour la compétition !"
        />
      </div>
    </div>
  );
};
