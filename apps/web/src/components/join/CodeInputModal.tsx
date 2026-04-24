import { useState } from 'react';
import { Modal } from '../Modal';

interface CodeInputModalProps {
  onSubmit: (code: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal for manual entry of tournament join codes.
 * Auto-uppercases, filters non-alphanumeric, validates 6-8 chars.
 */
export const CodeInputModal = ({ onSubmit, onClose }: CodeInputModalProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (value: string) => {
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(filtered);
    setError('');
  };

  const isValid = /^[A-Z0-9]{6,8}$/.test(code);

  const handleSubmit = async () => {
    if (!isValid) return;

    setError('');
    setIsLoading(true);

    try {
      await onSubmit(code);
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Saisir le Code"
      disableClose={isLoading}
    >
      <p className="text-cool-gray text-sm mb-4">
        Entrez le code du tournoi (6 à 8 caractères alphanumériques)
      </p>

      <input
        type="text"
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ex: ABC123"
        maxLength={8}
        className="w-full px-4 py-4 bg-navy border border-card rounded-button text-white text-center text-2xl font-bold tracking-wider uppercase focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
        autoFocus
        disabled={isLoading}
        aria-label="Code du tournoi"
      />

      <div className="text-right mt-2">
        <span className={`text-sm ${code.length >= 6 && code.length <= 8 ? 'text-lime' : 'text-cool-gray'}`}>
          {code.length}/8
        </span>
      </div>

      {error && (
        <p className="text-signal-red text-sm mt-3 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full mt-6 py-4 bg-electric-blue hover:bg-amber-600 text-white font-bold rounded-input transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

      <p className="text-cool-gray text-xs text-center mt-4">
        Le code vous a été partagé par l'organisateur du tournoi
      </p>
    </Modal>
  );
};
