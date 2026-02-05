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
 * - Format validation (5-8 chars alphanumeric)
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
      // Error is handled in the hook and displayed via toast
      // We keep the modal open so user can try again
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      handleSubmit();
    }
  };

  // Validation: 5-8 characters, alphanumeric
  const isValid = /^[A-Z0-9]{5,8}$/.test(code);

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Saisir le Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
            aria-label="Fermer"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-4">
          Entrez le code du tournoi (5 à 8 caractères alphanumériques)
        </p>

        {/* Code Input */}
        <input
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: ABC123"
          maxLength={8}
          className="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-bold tracking-wider uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          autoFocus
          disabled={isLoading}
          aria-label="Code du tournoi"
        />

        {/* Character counter */}
        <div className="text-right mt-2">
          <span className={`text-sm ${code.length >= 5 && code.length <= 8 ? 'text-green-500' : 'text-slate-500'}`}>
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
          className="w-full mt-6 py-4 bg-primary hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
        <p className="text-slate-500 text-xs text-center mt-4">
          Le code vous a été partagé par l'organisateur du tournoi
        </p>
      </div>
    </div>
  );
};
