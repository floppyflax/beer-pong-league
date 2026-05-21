import { useState, useCallback, FormEvent } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { authService } from "../services/AuthService";
import { Sheet } from "./design-system/Sheet";
import { PButton } from "./ponglo/PButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** "signup" (default) titles "Créer un compte", "signin" titles "Se connecter". */
  mode?: "signup" | "signin";
}

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode = "signup",
}: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setEmail("");
    setStep("email");
    setError(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const isTestAccount = (email: string): boolean => {
    if (!import.meta.env.DEV) return false;
    const testAccounts = [
      "admin@admin.com",
      "test@test.com",
      "devadmin@test.com",
      "devtest@test.com",
    ];
    return testAccounts.includes(email.toLowerCase());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Veuillez entrer un email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError, usedOTP } =
        await authService.signInWithOTP(email);

      if (authError) {
        setError(authError.message || "Erreur lors de l'envoi de l'email");
        setIsLoading(false);
        return;
      }

      if (isTestAccount(email) && usedOTP === false) {
        setIsLoading(false);
        handleClose();

        setTimeout(() => {
          onSuccess?.();
        }, 500);
        return;
      }

      setStep("sent");
      setIsLoading(false);
    } catch {
      setError("Une erreur est survenue");
      setIsLoading(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "email"
          ? mode === "signin"
            ? "Se connecter"
            : "Créer un compte"
          : "Email envoyé !"
      }
      maxWidth="sm"
      mobileExpanded
    >
      {step === "email" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-cool-gray mb-2 block">Email</label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="ton@email.com"
                className="w-full bg-navy border border-card rounded-input pl-10 pr-4 py-4 text-white focus:ring-2 focus:ring-electric-blue outline-none"
                autoFocus
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-signal-red text-sm mt-2">{error}</p>}
            {isTestAccount(email) ? (
              <div className="bg-lime/20 border border-lime/50 rounded-button p-2 mt-2">
                <p className="text-xs text-lime font-semibold">
                  🧪 Compte test détecté — Connexion directe
                </p>
              </div>
            ) : (
              <p className="text-xs text-cool-gray mt-2">
                Un lien magique sera envoyé à cette adresse
              </p>
            )}
          </div>

          {import.meta.env.DEV && !email && (
            <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-button p-3">
              <p className="text-xs text-electric-blue mb-1 font-semibold">
                🧪 Mode développement
              </p>
              <p className="text-xs text-cool-gray">
                Comptes test disponibles :<br />•{" "}
                <span className="text-white">devadmin@test.com</span>
                <br />• <span className="text-white">devtest@test.com</span>
                <br />
                <span className="text-cool-gray">(connexion instantanée)</span>
              </p>
            </div>
          )}

          <PButton
            type="submit"
            variant="accent"
            full
            disabled={!email.trim() || isLoading}
          >
            {isLoading
              ? isTestAccount(email)
                ? "Connexion..."
                : "Envoi..."
              : isTestAccount(email)
                ? "Se connecter"
                : "Envoyer le lien magique"}
          </PButton>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-lime/15 border border-lime/40 rounded-card p-4 flex items-center gap-3">
            <CheckCircle size={24} className="text-lime flex-shrink-0" />
            <div>
              <div className="font-archivo font-extrabold uppercase text-lime text-[13px] tracking-tight">
                Email envoyé !
              </div>
              <div className="text-[12px] text-cool-gray mt-0.5">
                Vérifie ta boîte mail et clique sur le lien
              </div>
            </div>
          </div>

          <div className="bg-navy border border-card p-4 rounded-card">
            <div className="text-[11px] uppercase tracking-[0.5px] text-cool-gray mb-1 font-mono">
              Email envoyé à
            </div>
            <div className="font-bold text-white break-all">{email}</div>
          </div>

          <p className="text-xs text-cool-gray text-center">
            Une fois le lien cliqué, tu seras automatiquement connecté
          </p>

          <PButton variant="ghost" full onClick={handleClose}>
            Fermer
          </PButton>
        </div>
      )}
    </Sheet>
  );
};
