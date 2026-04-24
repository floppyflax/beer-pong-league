import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { PongloWordmark } from "../components/ponglo/Wordmark";
import { PButton } from "../components/ponglo/PButton";

/**
 * LandingPage — Ponglo Arcade auth/onboarding screen.
 * Ref: /tmp/bpl-design/mobile-screens-1.jsx > ScreenAuth
 */
export const LandingPage = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCreateAccount = () => {
    setShowAuthModal(true);
    sessionStorage.setItem("authReturnTo", "/");
  };

  const handleJoinByCode = () => {
    navigate("/join");
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-electric-blue relative overflow-hidden">
      {/* Decorative cup pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 67) % 400}
            cy={(i * 93) % 800}
            r="18"
            fill="white"
          />
        ))}
      </svg>

      {/* Wordmark */}
      <div className="relative z-10 pt-14 px-6 pb-5">
        <PongloWordmark size={22} color="#FFFFFF" />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-2">
        <h1
          className="font-archivo font-black uppercase text-white"
          style={{
            fontSize: "clamp(32px, 10vw, 48px)",
            lineHeight: 0.92,
            letterSpacing: "-1.8px",
            textWrap: "balance",
          }}
        >
          Le beer pong. Enfin avec un{" "}
          <span className="text-lime">vrai classement.</span>
        </h1>
        <p className="mt-[18px] text-[15px] leading-[1.4] text-white/70">
          Ligues, événements, ELO. Pour les amis, les assos, les semi-pros du
          mercredi soir.
        </p>
      </div>

      {/* CTAs */}
      <div className="relative z-10 px-6 pt-5 pb-12 flex flex-col gap-2.5">
        <PButton variant="lime" size="lg" full onClick={handleCreateAccount}>
          Créer un compte
        </PButton>
        <PButton
          variant="ghost"
          size="md"
          full
          onClick={handleJoinByCode}
          className="!text-white !border-[rgba(244,242,232,0.25)]"
        >
          J'ai un code d'événement →
        </PButton>
        <button
          onClick={handleSignIn}
          className="text-center mt-1.5 text-[13px] text-white/60 hover:text-white/80 transition-colors"
        >
          Déjà membre ?{" "}
          <span className="text-lime font-bold">Se connecter</span>
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
