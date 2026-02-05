import { useState, useEffect } from 'react';
import { z } from 'zod';
import { createMatchInputSchema, type Match } from '@/utils/validation';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import type { Player } from '@/types';

interface MatchRecordingFormProps {
  tournamentId: string;
  leagueId: string | null;
  format: '1v1' | '2v2' | '3v3' | 'libre';
  participants: Player[];
  onSuccess: (match: Match) => void;
  onClose: () => void;
}

export function MatchRecordingForm({
  tournamentId,
  leagueId,
  format,
  participants,
  onSuccess,
  onClose,
}: MatchRecordingFormProps) {
  const playersPerTeam = format === '1v1' ? 1 : format === '2v2' ? 2 : format === '3v3' ? 3 : 1;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [teamA, setTeamA] = useState<string[]>(Array(playersPerTeam).fill(''));
  const [teamB, setTeamB] = useState<string[]>(Array(playersPerTeam).fill(''));
  const [teamAScore, setTeamAScore] = useState(10);
  const [teamBScore, setTeamBScore] = useState(0);

  // Update team arrays when format changes
  useEffect(() => {
    const newPlayersPerTeam = format === '1v1' ? 1 : format === '2v2' ? 2 : format === '3v3' ? 3 : 1;
    setTeamA(prev => {
      const newTeam = Array(newPlayersPerTeam).fill('');
      // Preserve existing selections if possible
      prev.slice(0, newPlayersPerTeam).forEach((id, i) => {
        if (id && i < newPlayersPerTeam) newTeam[i] = id;
      });
      return newTeam;
    });
    setTeamB(prev => {
      const newTeam = Array(newPlayersPerTeam).fill('');
      prev.slice(0, newPlayersPerTeam).forEach((id, i) => {
        if (id && i < newPlayersPerTeam) newTeam[i] = id;
      });
      return newTeam;
    });
  }, [format]);

  // Get available players for a position (exclude already selected players)
  const getAvailablePlayers = (currentTeam: 'A' | 'B', positionIndex: number): Player[] => {
    const otherTeam = currentTeam === 'A' ? teamB : teamA;
    const currentTeamPlayers = currentTeam === 'A' ? teamA : teamB;
    const otherPositionsInSameTeam = currentTeamPlayers.filter((_, i) => i !== positionIndex);
    
    return participants.filter((p) => {
      // Exclude players already in the other team
      if (otherTeam.includes(p.id)) return false;
      // Exclude players already selected in other positions of the same team
      if (otherPositionsInSameTeam.includes(p.id)) return false;
      return true;
    });
  };

  const updateTeamPlayer = (team: 'A' | 'B', positionIndex: number, playerId: string) => {
    if (team === 'A') {
      const newTeam = [...teamA];
      newTeam[positionIndex] = playerId;
      setTeamA(newTeam);
    } else {
      const newTeam = [...teamB];
      newTeam[positionIndex] = playerId;
      setTeamB(newTeam);
    }
    // Clear errors when user makes changes
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate team A players
    if (teamA.length !== playersPerTeam || teamA.some(id => !id)) {
      newErrors.teamA = `Sélectionnez ${playersPerTeam} joueur${playersPerTeam > 1 ? 's' : ''} pour l'équipe A`;
    }

    // Validate team B players
    if (teamB.length !== playersPerTeam || teamB.some(id => !id)) {
      newErrors.teamB = `Sélectionnez ${playersPerTeam} joueur${playersPerTeam > 1 ? 's' : ''} pour l'équipe B`;
    }

    // Check for duplicates between teams
    const hasDuplicates = teamA.some(id => id && teamB.includes(id));
    if (hasDuplicates) {
      newErrors.duplicate = 'Un joueur ne peut pas être dans les deux équipes';
    }

    // Validate scores
    if (teamAScore < 0 || teamAScore > 10) {
      newErrors.teamAScore = 'Le score doit être entre 0 et 10';
    }
    if (teamBScore < 0 || teamBScore > 10) {
      newErrors.teamBScore = 'Le score doit être entre 0 et 10';
    }

    // At least one team must have score 10 (winner in beer pong)
    if (teamAScore !== 10 && teamBScore !== 10) {
      newErrors.scores = 'Une équipe doit avoir 10 points pour gagner';
    }

    // Both teams can't have 10
    if (teamAScore === 10 && teamBScore === 10) {
      newErrors.scores = 'Une seule équipe peut gagner (avoir 10 points)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create match object
      const match: Match = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        teamA: teamA.filter(id => id !== ''),
        teamB: teamB.filter(id => id !== ''),
        scoreA: teamAScore,
        scoreB: teamBScore,
        status: 'pending',
      };

      // Validate with Zod schema
      try {
        createMatchInputSchema.parse({
          date: match.date,
          teamA: match.teamA,
          teamB: match.teamB,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Match validation failed:', error.issues);
          toast.error('Erreur de validation du match');
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      // Call onSuccess - this will handle optimistic update and save
      // The parent component (TournamentDashboard) will call recordTournamentMatch
      // which handles both optimistic UI update and Supabase save
      onSuccess(match);
      
      // Close form - success toast will be shown by recordTournamentMatch
      onClose();
    } catch (error) {
      console.error('Error recording match:', error);
      toast.error('Erreur lors de l\'enregistrement du match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Nouveau Match</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-grow space-y-6">
        {/* Team A */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Équipe A</h3>
          
          {Array.from({ length: playersPerTeam }).map((_, i) => {
            const availablePlayers = getAvailablePlayers('A', i);
            
            return (
              <div key={i} className="mb-4">
                <select
                  value={teamA[i] || ''}
                  onChange={(e) => updateTeamPlayer('A', i, e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-lg border ${
                    errors.teamA ? 'border-red-500' : 'border-slate-600'
                  }`}
                >
                  <option value="">Sélectionner joueur {i + 1}</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          
          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Score Équipe A</label>
            <input
              type="number"
              value={teamAScore}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setTeamAScore(Math.max(0, Math.min(10, value)));
                if (errors.teamAScore) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.teamAScore;
                    return newErrors;
                  });
                }
              }}
              min="0"
              max="10"
              className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-3xl text-center font-bold border ${
                errors.teamAScore ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {errors.teamAScore && (
              <p className="text-red-500 text-sm mt-1">{errors.teamAScore}</p>
            )}
          </div>
        </div>

        <div className="text-center text-slate-500 font-bold text-xl">VS</div>

        {/* Team B */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Équipe B</h3>
          
          {Array.from({ length: playersPerTeam }).map((_, i) => {
            const availablePlayers = getAvailablePlayers('B', i);
            
            return (
              <div key={i} className="mb-4">
                <select
                  value={teamB[i] || ''}
                  onChange={(e) => updateTeamPlayer('B', i, e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-lg border ${
                    errors.teamB ? 'border-red-500' : 'border-slate-600'
                  }`}
                >
                  <option value="">Sélectionner joueur {i + 1}</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          
          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Score Équipe B</label>
            <input
              type="number"
              value={teamBScore}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setTeamBScore(Math.max(0, Math.min(10, value)));
                if (errors.teamBScore) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.teamBScore;
                    return newErrors;
                  });
                }
              }}
              min="0"
              max="10"
              className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-3xl text-center font-bold border ${
                errors.teamBScore ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {errors.teamBScore && (
              <p className="text-red-500 text-sm mt-1">{errors.teamBScore}</p>
            )}
          </div>
        </div>

        {/* Error messages */}
        {errors.teamA && (
          <p className="text-red-500 text-sm">{errors.teamA}</p>
        )}
        {errors.teamB && (
          <p className="text-red-500 text-sm">{errors.teamB}</p>
        )}
        {errors.duplicate && (
          <p className="text-red-500 text-sm">{errors.duplicate}</p>
        )}
        {errors.scores && (
          <p className="text-red-500 text-sm">{errors.scores}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-amber-500 text-slate-900 rounded-lg font-bold text-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Match'}
        </button>
      </form>
    </div>
  );
}
