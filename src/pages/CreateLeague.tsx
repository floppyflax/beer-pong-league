import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Trophy, Calendar } from "lucide-react";

export const CreateLeague = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"event" | "season">("event");
  const { createLeague } = useLeague();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const newLeagueId = await createLeague(name, type);
    navigate(`/league/${newLeagueId}`);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Nouvelle Ligue</h2>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">
            Nom de la ligue
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Soirée chez Tom, Ligue d'été..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-400">
            Type de compétition
          </label>

          <button
            type="button"
            onClick={() => setType("event")}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
              type === "event"
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                type === "event" ? "bg-primary text-white" : "bg-slate-700"
              }`}
            >
              <Calendar size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold">League Continue</div>
              <div className="text-xs opacity-80">
                Classement persistant dans le temps.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setType("season")}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
              type === "season"
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                type === "season" ? "bg-primary text-white" : "bg-slate-700"
              }`}
            >
              <Trophy size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold">League par Saison</div>
              <div className="text-xs opacity-80">
                Classement par saison avec reset périodique.
              </div>
            </div>
          </button>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !isAuthenticated}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg mt-auto"
        >
          {!isAuthenticated ? "CONNEXION REQUISE" : "C'EST PARTI !"}
        </button>
      </form>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (isAuthenticated) {
            setShowAuthModal(false);
          } else {
            navigate("/");
          }
        }}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};
