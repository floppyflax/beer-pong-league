import { Player } from '../types';

// K-Factor determines how much ratings change. 
// Spec says: 32 for first 20 matches, 16 afterwards.
const getKFactor = (player: Player): number => {
  return player.matchesPlayed < 20 ? 32 : 16;
};

// Calculate expected score based on ELO difference
// Ra: Rating of Player A, Rb: Rating of Player B
const getExpectedScore = (Ra: number, Rb: number): number => {
  return 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
};

/**
 * Calculates the new ELO ratings for two teams after a match.
 * The logic treats a team as a single entity with an average ELO.
 * The ELO change is then distributed to all players in the team.
 * 
 * @param teamA List of players in Team A
 * @param teamB List of players in Team B
 * @param winner 'A' or 'B'
 * @returns A map of Player ID -> New ELO
 */
export const calculateEloChange = (
  teamA: Player[], 
  teamB: Player[], 
  winner: 'A' | 'B'
): Record<string, number> => {
  // Calculate average team ratings
  const avgEloA = teamA.reduce((sum, p) => sum + p.elo, 0) / teamA.length;
  const avgEloB = teamB.reduce((sum, p) => sum + p.elo, 0) / teamB.length;

  // Expected scores
  const expectedA = getExpectedScore(avgEloA, avgEloB);
  const expectedB = getExpectedScore(avgEloB, avgEloA);

  // Actual scores (1 for win, 0 for loss)
  const actualA = winner === 'A' ? 1 : 0;
  const actualB = winner === 'B' ? 1 : 0;

  const newRatings: Record<string, number> = {};

  // Update Team A players
  teamA.forEach(player => {
    const k = getKFactor(player);
    // Spec says: "The delta of points ELO is distributed equally among the members"
    // Standard ELO usually updates each player based on their own K but the team's outcome.
    // If we strictly follow "Delta distributed equally", we might need to calculate a total Team Delta and split it.
    // However, "Rating équipe = moyenne" implies we calculate the delta for the 'Team Entity' then apply it.
    // Usually in multiplayer ELO, each player gets the full delta calculated for the team average.
    // Let's use the standard approach: Each player's ELO moves as if they played a 1v1 against the other team's average.
    
    const change = Math.round(k * (actualA - expectedA));
    newRatings[player.id] = player.elo + change;
  });

  // Update Team B players
  teamB.forEach(player => {
    const k = getKFactor(player);
    const change = Math.round(k * (actualB - expectedB));
    newRatings[player.id] = player.elo + change;
  });

  return newRatings;
};

