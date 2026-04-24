import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep p-4">
      <div className="bg-navy rounded-2xl p-8 max-w-md w-full text-center border border-card">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-ping-yellow/20 rounded-full mb-4">
          <XCircle size={32} className="text-ping-yellow" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
        <p className="text-cool-gray mb-6">
          Tu as annulé le paiement. Aucun montant n'a été débité.
        </p>
        <p className="text-cool-gray text-sm mb-6">
          Tu peux réessayer à tout moment pour débloquer toutes les fonctionnalités Premium.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-signal-red hover:brightness-110 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-navy-deep hover:bg-navy-soft text-white font-bold py-3 rounded-xl transition-colors"
          >
            Réessayer le paiement
          </button>
        </div>
      </div>
    </div>
  );
};
