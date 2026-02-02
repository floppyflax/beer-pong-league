import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
          <XCircle size={32} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
        <p className="text-slate-400 mb-6">
          Tu as annulé le paiement. Aucun montant n'a été débité.
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Tu peux réessayer à tout moment pour débloquer toutes les fonctionnalités Premium.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Réessayer le paiement
          </button>
        </div>
      </div>
    </div>
  );
};
