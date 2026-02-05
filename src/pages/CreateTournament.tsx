/**
 * CreateTournament Page - Story 8.2
 * 
 * Tournament creation form with:
 * - Freemium limit enforcement (2 tournaments max for free users)
 * - Minimal form fields (name, format, max players, private toggle)
 * - Unique tournament code generation
 * - QR code generation for sharing
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useLeague } from "../context/LeagueContext";
import { premiumService } from "../services/PremiumService";
import { databaseService } from "../services/DatabaseService";
import { generateTournamentCode } from "../utils/tournamentCode";
import { PaymentModal } from "../components/PaymentModal";
import toast from "react-hot-toast";
import { ArrowLeft, Info } from "lucide-react";

interface FormatOption {
  value: '2v2' | '1v1' | 'libre';
  label: string;
  description: string;
  formatType: 'fixed' | 'free';
  team1Size: number | null;
  team2Size: number | null;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: '2v2',
    label: '2v2 Strict',
    description: 'Équipes de 2 joueurs',
    formatType: 'fixed',
    team1Size: 2,
    team2Size: 2,
  },
  {
    value: '1v1',
    label: '1v1 Strict',
    description: 'Duel individuel',
    formatType: 'fixed',
    team1Size: 1,
    team2Size: 1,
  },
  {
    value: 'libre',
    label: 'Libre',
    description: 'Équipes flexibles (1v2, 2v3...)',
    formatType: 'free',
    team1Size: null,
    team2Size: null,
  },
];

export const CreateTournament = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const { reloadData } = useLeague();
  
  // Premium status and limits
  const [isLoadingPremium, setIsLoadingPremium] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [tournamentCount, setTournamentCount] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const [remainingTournaments, setRemainingTournaments] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [format, setFormat] = useState<'2v2' | '1v1' | 'libre'>('2v2');
  const [hasPlayerLimit, setHasPlayerLimit] = useState(false);
  const [playerLimit, setPlayerLimit] = useState<string>("16");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check premium status and limits on mount
  useEffect(() => {
    checkPremiumStatus();
  }, [user, localUser]);

  const checkPremiumStatus = async () => {
    setIsLoadingPremium(true);
    
    try {
      const userId = user?.id || null;
      const anonymousUserId = localUser?.anonymousUserId || null;
      
      // Get premium status
      const premiumStatus = await premiumService.isPremium(userId, anonymousUserId);
      setIsPremium(premiumStatus);
      
      // Get tournament count
      const count = await premiumService.getTournamentCount(userId, anonymousUserId);
      setTournamentCount(count);
      
      // Check if can create
      const result = await premiumService.canCreateTournament(userId, anonymousUserId);
      setCanCreate(result.allowed);
      setRemainingTournaments(result.remaining || 0);
      
      // If limit reached, show error and optionally open payment modal
      if (!result.allowed) {
        toast.error(result.message || 'Limite de tournois atteinte');
        // Optionally open payment modal (AC8)
        // setShowPaymentModal(true);
        
        // Redirect to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      toast.error('Erreur lors de la vérification du statut premium');
    } finally {
      setIsLoadingPremium(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Name required and max 50 chars (AC2, AC3)
    if (!name.trim()) {
      newErrors.name = 'Le nom du tournoi est requis';
    } else if (name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }
    
    // Player limit validation (required if toggle is ON)
    if (hasPlayerLimit) {
      const limitNum = parseInt(playerLimit);
      if (!playerLimit || isNaN(limitNum) || limitNum < 2) {
        newErrors.playerLimit = 'Au moins 2 joueurs requis';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUniqueCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = generateTournamentCode();
      const exists = await databaseService.tournamentCodeExists(code);
      
      if (!exists) {
        return code;
      }
      
      attempts++;
    }
    
    // Fallback: append timestamp if still colliding (very unlikely)
    return generateTournamentCode() + Date.now().toString(36).slice(-2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    // Double-check if can create (safeguard, AC8)
    if (!canCreate) {
      toast.error('Limite de tournois atteinte. Passez Premium pour créer sans limite !');
      setShowPaymentModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate unique tournament code (AC4)
      const joinCode = await generateUniqueCode();
      
      // Get selected format configuration
      const selectedFormat = FORMAT_OPTIONS.find(f => f.value === format)!;
      
      // Create tournament in database (AC6)
      const maxPlayersValue = hasPlayerLimit ? parseInt(playerLimit) : null;
      const tournamentId = await databaseService.createTournament({
        name: name.trim(),
        joinCode,
        formatType: selectedFormat.formatType,
        team1Size: selectedFormat.team1Size,
        team2Size: selectedFormat.team2Size,
        maxPlayers: maxPlayersValue || 999, // Use 999 as "unlimited" if null
        isPrivate,
        creatorUserId: user?.id || null,
        creatorAnonymousUserId: localUser?.anonymousUserId || null,
      });
      
      // Success toast (AC7)
      toast.success('Tournoi créé ! 🎉');
      
      // Reload context data to include the new tournament (AC7)
      await reloadData();
      
      // Navigate to tournament dashboard (AC7)
      navigate(`/tournament/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Erreur lors de la création du tournoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking premium status
  if (isLoadingPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification du statut...</p>
        </div>
      </div>
    );
  }

  // If limit reached, show message (will redirect soon)
  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Limite atteinte</h2>
            <p className="text-slate-300 mb-6">
              Tu as créé {tournamentCount} tournoi{tournamentCount > 1 ? 's' : ''}.
              Passe Premium pour créer des tournois illimités !
            </p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              ✨ PASSER PREMIUM - 3€
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white">Créer un Tournoi</h1>
        </div>

        {/* Premium status badge */}
        {!isPremium && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">
                  {remainingTournaments} tournoi{remainingTournaments > 1 ? 's' : ''} restant{remainingTournaments > 1 ? 's' : ''} sur 2 (gratuit)
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Passe Premium pour créer des tournois illimités
                </p>
              </div>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-200 text-sm font-medium flex items-center gap-2">
              <span>✨</span>
              Tournois illimités - Premium actif
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field 1: Tournament Name (AC2) */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-300">
              Nom du tournoi *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => validateForm()}
              placeholder="Ex: Summer Cup 2026"
              className={`w-full bg-slate-800 border ${
                errors.name ? 'border-red-500' : 'border-slate-700'
              } rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all`}
              maxLength={50}
              autoFocus
              aria-label="Nom du tournoi"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
            <p className="text-slate-500 text-xs">
              {name.length}/50 caractères
            </p>
          </div>

          {/* Field 2: Format (AC2) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Format du match *
            </label>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    format === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as '2v2' | '1v1' | 'libre')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-slate-400 text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field 3: Player Limit Toggle + Input (AC2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl">
              <div className="flex-1">
                <div className="text-white font-medium">Limiter le nombre de joueurs</div>
                <div className="text-slate-400 text-sm mt-1">
                  Par défaut : aucune limite
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasPlayerLimit(!hasPlayerLimit);
                  if (!hasPlayerLimit) {
                    setPlayerLimit("16"); // Reset to default when enabling
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hasPlayerLimit ? 'bg-primary' : 'bg-slate-600'
                }`}
                aria-label="Limiter le nombre de joueurs"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hasPlayerLimit ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Show input only when limit is enabled */}
            {hasPlayerLimit && (
              <div className="space-y-2">
                <label htmlFor="playerLimit" className="text-sm font-medium text-slate-300">
                  Nombre maximum de joueurs *
                </label>
                <input
                  id="playerLimit"
                  type="number"
                  value={playerLimit}
                  onChange={(e) => setPlayerLimit(e.target.value)}
                  placeholder="Ex: 16"
                  min={2}
                  max={100}
                  className={`w-full bg-slate-800 border ${
                    errors.playerLimit ? 'border-red-500' : 'border-slate-700'
                  } rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all`}
                  aria-label="Nombre maximum de joueurs"
                  autoFocus
                />
                {errors.playerLimit && (
                  <p className="text-red-500 text-sm">{errors.playerLimit}</p>
                )}
              </div>
            )}
          </div>

          {/* Field 4: Private Toggle (AC2) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl">
              <div className="flex-1">
                <div className="text-white font-medium">🔒 Tournoi privé</div>
                <div className="text-slate-400 text-sm mt-1">
                  Seuls ceux qui ont le code peuvent rejoindre
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPrivate ? 'bg-primary' : 'bg-slate-600'
                }`}
                aria-label="Tournoi privé"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-amber-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg"
          >
            {isSubmitting ? "CRÉATION..." : "CRÉER LE TOURNOI"}
          </button>
        </form>

        {/* Payment Modal (AC8) */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      </div>
    </div>
  );
};
