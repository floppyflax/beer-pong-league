import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useRequireIdentity } from "../hooks/useRequireIdentity";
import { CreateIdentityModal } from "../components/CreateIdentityModal";
import toast from "react-hot-toast";
import { createTournamentInputSchema } from "../utils/validation";
import { z } from "zod";

export const CreateTournament = () => {
  const { createTournament } = useLeague();
  const { ensureIdentity, showModal, handleIdentityCreated, handleCancel } = useRequireIdentity();
  const navigate = useNavigate();

  // Form state (3-5 fields max as per AC)
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [format, setFormat] = useState<'1v1' | '2v2' | '3v3' | 'libre'>('2v2');
  const [location, setLocation] = useState("");
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    try {
      // Validate using Zod schema
      createTournamentInputSchema.parse({
        name,
        date: new Date(date).toISOString(),
        format,
        location: location.trim() || undefined,
        leagueId: null, // Simplified form doesn't support league selection
        playerIds: [],
        isFinished: false,
        anti_cheat_enabled: antiCheatEnabled,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        // Note: Toast removed - inline errors are sufficient
        // Toast only shown on submit failure (see handleSubmit)
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Ensure user has an identity (just-in-time)
    const identity = await ensureIdentity();
    if (!identity) {
      // User cancelled identity creation
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to localStorage first (optimistic)
      const localTournament = {
        id: crypto.randomUUID(),
        name,
        date: new Date(date).toISOString(),
        format,
        location: location.trim() || undefined,
        leagueId: null,
        playerIds: [],
        matches: [],
        isFinished: false,
        createdAt: new Date().toISOString(),
        synced: false,
      };
      
      const tournaments = JSON.parse(localStorage.getItem('bpl_tournaments') || '[]');
      tournaments.push(localTournament);
      localStorage.setItem('bpl_tournaments', JSON.stringify(tournaments));

      // Create tournament (syncs to Supabase and shows success toast)
      const tournamentId = await createTournament(
        name,
        date,
        format,
        location.trim() || undefined,
        null, // leagueId - simplified form doesn't support league selection
        [], // playerIds - will be added when participants join
        antiCheatEnabled
      );

      // Redirect to tournament dashboard
      navigate(`/tournament/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Erreur lors de la création du tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Nouveau Tournoi</h2>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        {/* Field 1: Tournament Name (Required) */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-400">
            Nom du Tournoi *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateForm()}
            placeholder="Ex: Méchoui de Thomas, Soirée BBQ..."
            className={`w-full bg-slate-800 border ${
              errors.name ? 'border-red-500' : 'border-slate-700'
            } rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all`}
            maxLength={200}
            autoFocus
            aria-label="Nom du tournoi"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        {/* Field 2: Date (Required) */}
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium text-slate-400">
            Date *
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full bg-slate-800 border ${
              errors.date ? 'border-red-500' : 'border-slate-700'
            } rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none`}
            aria-label="Date"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "date-error" : undefined}
          />
          {errors.date && (
            <p id="date-error" className="text-red-500 text-sm">{errors.date}</p>
          )}
        </div>

        {/* Field 3: Format (Required) */}
        <div className="space-y-2">
          <label htmlFor="format" className="text-sm font-medium text-slate-400">
            Format *
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as '1v1' | '2v2' | '3v3' | 'libre')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none"
            aria-label="Format"
          >
            <option value="1v1">1v1 (Solo)</option>
            <option value="2v2">2v2 (Équipes de 2)</option>
            <option value="3v3">3v3 (Équipes de 3)</option>
            <option value="libre">Libre (Équipes flexibles)</option>
          </select>
        </div>

        {/* Field 4: Location (Optional) */}
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-slate-400">
            Lieu (optionnel)
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Plage, Jardin, Bar..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            maxLength={200}
            aria-label="Lieu"
          />
        </div>

        {/* Field 5: Anti-Cheat (Optional) */}
        <div className="flex items-center space-x-3">
          <input
            id="antiCheat"
            type="checkbox"
            checked={antiCheatEnabled}
            onChange={(e) => setAntiCheatEnabled(e.target.checked)}
            className="w-5 h-5 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-primary"
            aria-label="Anti-Cheat"
          />
          <label htmlFor="antiCheat" className="text-sm font-medium text-slate-400">
            Activer l'anti-cheat (confirmation des matchs requise)
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg mt-auto"
        >
          {isSubmitting ? "CRÉATION..." : "CRÉER LE TOURNOI"}
        </button>
      </form>

      {/* Just-in-time identity creation modal */}
      <CreateIdentityModal
        isOpen={showModal}
        onClose={handleCancel}
        onIdentityCreated={handleIdentityCreated}
      />
    </div>
  );
};
