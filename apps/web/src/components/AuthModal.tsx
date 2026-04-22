import { useState, useCallback, FormEvent } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { authService } from "../services/AuthService";
import { Modal } from "./Modal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
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
        console.log("🧪 Test account logged in with password, closing modal");
        setIsLoading(false);
        handleClose();

        setTimeout(() => {
          onSuccess?.();
        }, 500);
        return;
      }

      setStep("sent");
      setIsLoading(false);
    } catch (error) {
      setError("Une erreur est survenue");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "email" ? "Créer un compte" : "Email envoyé !"}
      maxWidth="max-w-sm"
    >
      {step === "email" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-tertiary mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="ton@email.com"
                className="w-full bg-background-tertiary border border-card rounded-input pl-10 pr-4 py-4 text-white focus:ring-2 focus:ring-primary outline-none"
                autoFocus
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-error text-sm mt-2">{error}</p>}
            {isTestAccount(email) ? (
              <div className="bg-success/20 border border-success/50 rounded-button p-2 mt-2">
                <p className="text-xs text-success font-semibold">
                  🧪 Compte test détecté - Connexion directe
                </p>
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-2">
                Un lien magique sera envoyé à cette adresse
              </p>
            )}
          </div>

          {import.meta.env.DEV && !email && (
            <div className="bg-info/10 border border-info/30 rounded-button p-3">
              <p className="text-xs text-info mb-1 font-semibold">
                🧪 Mode développement
              </p>
              <p className="text-xs text-text-tertiary">
                Comptes test disponibles :<br />•{" "}
                <span className="text-white">devadmin@test.com</span>
                <br />• <span className="text-white">devtest@test.com</span>
                <br />
                <span className="text-text-muted">
                  (connexion instantanée)
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || isLoading}
            className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-input transition-colors"
          >
            {isLoading
              ? isTestAccount(email)
                ? "Connexion..."
                : "Envoi..."
              : isTestAccount(email)
                ? "Se connecter"
                : "Envoyer le lien magique"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-success/20 border border-success/50 rounded-input p-4 flex items-center gap-3">
            <CheckCircle size={24} className="text-success" />
            <div>
              <div className="font-bold text-success">Email envoyé !</div>
              <div className="text-sm text-text-tertiary">
                Vérifie ta boîte mail et clique sur le lien
              </div>
            </div>
          </div>

          <div className="bg-background-tertiary p-4 rounded-input">
            <div className="text-sm text-text-tertiary mb-2">
              Email envoyé à :
            </div>
            <div className="font-bold text-white">{email}</div>
          </div>

          <div className="text-xs text-text-muted text-center">
            Une fois le lien cliqué, tu seras automatiquement connecté
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-background-tertiary hover:bg-slate-600 text-white font-bold py-3 rounded-input transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
};
