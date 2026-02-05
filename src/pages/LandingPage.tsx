import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Award, User } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';

/**
 * LandingPage Component
 * 
 * Landing page for non-authenticated users
 * Displays 4 action buttons:
 * 1. Join Tournament (public access)
 * 2. Create Tournament (requires auth)
 * 3. Create League (requires auth)
 * 4. Sign In
 * 
 * Story 9.1: Landing Page (Non Connecté)
 */
export const LandingPage = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleJoinTournament = () => {
    setIsNavigating(true);
    navigate('/join');
  };

  const handleCreateTournament = () => {
    // Note: In future, we'll handle returnTo properly via AuthModal
    // For now, navigate to auth callback which should redirect
    setShowAuthModal(true);
    // Store intended destination in sessionStorage for post-auth redirect
    sessionStorage.setItem('authReturnTo', '/create-tournament');
  };

  const handleCreateLeague = () => {
    setShowAuthModal(true);
    sessionStorage.setItem('authReturnTo', '/create-league');
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-10">
        {/* App Branding + Tagline */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-primary">
            <span className="inline-block">🍺</span> BEER PONG LEAGUE
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Ton classement ELO entre amis
          </p>
        </div>

        {/* Action Sections */}
        <div className="space-y-8">
          {/* Section 1: Participe (Hero CTA) */}
          <div className="space-y-3">
            <p className="text-slate-500 text-sm uppercase tracking-wide font-semibold">
              ▸ Participe
            </p>
            <button
              onClick={handleJoinTournament}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-7 px-6 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95"
              aria-label="Rejoindre un tournoi"
            >
              <Trophy size={24} aria-hidden="true" />
              <span className="text-xl">REJOINDRE UN TOURNOI</span>
            </button>
          </div>

          {/* Section 2: Organise (Secondary CTAs) */}
          <div className="space-y-3">
            <p className="text-slate-500 text-sm uppercase tracking-wide font-semibold">
              ▸ Organise
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCreateTournament}
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-5 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                aria-label="Créer un nouveau tournoi"
              >
                <Plus size={24} aria-hidden="true" />
                <span className="text-sm">TOURNOI</span>
              </button>

              <button
                onClick={handleCreateLeague}
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-5 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                aria-label="Créer une nouvelle league"
              >
                <Award size={24} aria-hidden="true" />
                <span className="text-sm">LEAGUE</span>
              </button>
            </div>
          </div>

          {/* Section 3: Login (Tertiary, discrete) */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleSignIn}
              className="w-full text-slate-400 hover:text-primary py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              aria-label="Se connecter"
            >
              <span className="text-base">Déjà membre?</span>
              <span className="text-base font-semibold">Se connecter →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};
