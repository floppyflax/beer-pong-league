import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Star,
  LayoutGrid,
  Crown,
  Award,
  ChevronRight,
} from "lucide-react";
import { AuthModal } from "../components/AuthModal";

/**
 * LandingPage Component
 *
 * Landing page for non-authenticated users (Story 14.33).
 * No header, no bottom nav. Frame 1 (PongELO) layout.
 * Fits on one phone screen without scroll.
 */
export const LandingPage = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleJoinTournament = () => {
    navigate("/join");
  };

  const handleCreateTournament = () => {
    setShowAuthModal(true);
    sessionStorage.setItem("authReturnTo", "/create-tournament");
  };

  const handleCreateLeague = () => {
    setShowAuthModal(true);
    sessionStorage.setItem("authReturnTo", "/create-league");
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="h-screen min-h-[568px] max-h-[932px] overflow-hidden flex flex-col bg-slate-950 relative">
      {/* Background: gradient + subtle mesh */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.08) 0px, transparent 50%)`,
        }}
        aria-hidden
      />

      {/* Compact content - fits on one screen (responsive spacing for 568px viewport) */}
      <div className="relative flex-1 flex flex-col justify-center px-4 py-3 sm:py-4 overflow-hidden min-h-0">
        <div className="flex-shrink-0 max-w-md mx-auto w-full space-y-3 sm:space-y-4">
          {/* Hero: icon (trophy + star) + PongELO + tagline (Frame 1) */}
          <div className="text-center space-y-2">
            <div
              className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 text-white mb-2"
              aria-hidden="true"
            >
              <Trophy size={28} strokeWidth={2.5} />
              <Star
                size={14}
                className="absolute -top-0.5 -right-0.5 text-amber-300 fill-amber-300"
                strokeWidth={2.5}
              />
            </div>
            <h1 className="text-2xl font-bold text-amber-400">PongELO</h1>
            <p className="text-slate-300 text-sm">
              Ton classement ELO entre amis
            </p>
          </div>

          {/* Participer card — gradient + transparence, titre centré */}
          <div className="bg-gradient-card-transparent rounded-xl p-4 border border-slate-700/50 space-y-3 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/80 flex items-center justify-center">
                <LayoutGrid size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Participer</h2>
            </div>
            <p className="text-slate-400 text-sm text-center">
              Rejoins un tournoi en cours
            </p>
            <button
              onClick={handleJoinTournament}
              className="w-full bg-gradient-cta-alt hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              aria-label="Rejoindre un tournoi"
            >
              <ChevronRight size={20} aria-hidden="true" />
              Rejoindre un tournoi
            </button>
          </div>

          {/* Organiser card — gradient + transparence, titre centré */}
          <div className="bg-gradient-card-transparent rounded-xl p-4 border border-slate-700/50 space-y-3 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Organiser</h2>
            </div>
            <p className="text-slate-400 text-sm text-center">
              Crée tes propres compétitions
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCreateTournament}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                aria-label="Créer un tournoi"
              >
                <Trophy size={18} aria-hidden="true" />
                Créer un tournoi
              </button>
              <button
                onClick={handleCreateLeague}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                aria-label="Créer une league"
              >
                <Award size={18} aria-hidden="true" />
                Créer une league
              </button>
            </div>
          </div>

          {/* Footer: login link */}
          <div className="text-center pt-1">
            <button
              onClick={handleSignIn}
              className="text-slate-400 hover:text-white text-sm underline underline-offset-2 transition-colors"
              aria-label="Se connecter"
            >
              Déjà membre ? Se connecter
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
