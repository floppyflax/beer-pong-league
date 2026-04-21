import { useState } from 'react';
import { X } from 'lucide-react';

interface CodeInputModalProps {
  onSubmit: (code: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Code Input Modal
 * 
 * Modal for manual entry of tournament join codes
 * - Auto-uppercase transformation
 * - Format validation (6-8 chars alphanumeric per AC4)
 * - Submit button disabled until valid format
 */
export const CodeInputModal = ({ onSubmit, onClose }: CodeInputModalProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and filter non-alphanumeric characters
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(filtered);
    setError(''); // Clear error on input change
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setError('');
    setIsLoading(true);

    try {
      await onSubmit(code);
      // Success - modal will be closed by parent after navigation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Validation: 6-8 characters per AC4, alphanumeric
  const isValid = /^[A-Z0-9]{6,8}$/.test(code);

  return (
    <div className="fixed inset-0 bg-cream/95 z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-xl p-6 w-full max-w-md border border-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink">Saisir le Code</h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink transition-colors p-2"
            aria-label="Fermer"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <p className="text-ink-soft text-sm mb-4">
          Entrez le code du tournoi (6 à 8 caractères alphanumériques)
        </p>

        {/* Code Input */}
        <input
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: ABC123"
          maxLength={8}
          className="w-full px-4 py-4 bg-cream border border-card rounded-lg text-ink text-center text-2xl font-bold tracking-wider uppercase focus:border-cup-red focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          autoFocus
          disabled={isLoading}
          aria-label="Code du tournoi"
        />

        {/* Character counter */}
        <div className="text-right mt-2">
          <span className={`text-sm ${code.length >= 6 && code.length <= 8 ? 'text-green-500' : 'text-ink-mute'}`}>
            {code.length}/8
          </span>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full mt-6 py-4 bg-cup-red hover:brightness-110 text-ink font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>VÉRIFICATION...</span>
            </div>
          ) : (
            'REJOINDRE'
          )}
        </button>

        {/* Help text */}
        <p className="text-ink-mute text-xs text-center mt-4">
          Le code vous a été partagé par l'organisateur du tournoi
        </p>
      </div>
    </div>
  );
};
