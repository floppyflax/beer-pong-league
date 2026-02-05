import { useNavigate } from 'react-router-dom';
import { QrCode, Trophy, Sparkles } from 'lucide-react';

interface NewUserWelcomeProps {
  onUpgradeClick?: () => void;
}

export const NewUserWelcome = ({ onUpgradeClick }: NewUserWelcomeProps) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <QrCode size={24} className="text-primary" />,
      title: 'Rejoindre un tournoi',
      description: 'Scannez un QR code ou entrez un code pour rejoindre',
      action: () => navigate('/join'),
    },
    {
      icon: <Trophy size={24} className="text-accent" />,
      title: 'Créer un tournoi',
      description: 'Lancez votre premier tournoi entre amis',
      action: () => navigate('/tournament/create'),
    },
    {
      icon: <Sparkles size={24} className="text-primary" />,
      title: 'Voir les avantages Premium',
      description: 'Débloquez toutes les fonctionnalités avancées',
      action: onUpgradeClick,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-3">
          Bienvenue sur Beer Pong League! 🍺
        </h1>
        <p className="text-slate-400">
          Prêt à dominer les tournois de Beer Pong ? Commencez par une de ces actions :
        </p>
      </div>

      <div className="space-y-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-6 border border-slate-700 hover:border-primary/50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
