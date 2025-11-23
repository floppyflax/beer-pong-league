import { useState, FormEvent } from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';
import { authService } from '../services/AuthService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Veuillez entrer un email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email invalide');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await authService.signInWithOTP(email);

      if (authError) {
        setError(authError.message || 'Erreur lors de l\'envoi de l\'email');
        setIsLoading(false);
        return;
      }

      setStep('sent');
      setIsLoading(false);
    } catch (error) {
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setStep('email');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            {step === 'email' ? 'Créer un compte' : 'Email envoyé !'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="ton@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Un lien magique sera envoyé à cette adresse
              </p>
            </div>

            <button
              type="submit"
              disabled={!email.trim() || isLoading}
              className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-colors"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien magique'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <div className="font-bold text-green-500">Email envoyé !</div>
                <div className="text-sm text-slate-400">
                  Vérifie ta boîte mail et clique sur le lien
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-2">
                Email envoyé à :
              </div>
              <div className="font-bold text-white">{email}</div>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Une fois le lien cliqué, tu seras automatiquement connecté
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};



