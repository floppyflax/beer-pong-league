import { describe, it, expect } from 'vitest';
import { calculateEloChange } from '@/utils/elo';
import type { Player } from '@/types';

describe('ELO Calculation', () => {
  it('should calculate ELO change for equal players', () => {
    const teamA: Player[] = [{
      id: '1',
      leagueId: 'league1',
      name: 'Player A',
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const teamB: Player[] = [{
      id: '2',
      leagueId: 'league1',
      name: 'Player B',
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const result = calculateEloChange(teamA, teamB, 'A');
    expect(result['1']).toBe(1508); // 1500 + 8 (k=16, 50% expected win)
    expect(result['2']).toBe(1492); // 1500 - 8
  });

  it('should calculate larger ELO change for underdog win', () => {
    const teamA: Player[] = [{
      id: '1',
      leagueId: 'league1',
      name: 'Underdog',
      elo: 1400,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const teamB: Player[] = [{
      id: '2',
      leagueId: 'league1',
      name: 'Favorite',
      elo: 1600,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const result = calculateEloChange(teamA, teamB, 'A');
    expect(result['1']).toBeGreaterThan(1400 + 8); // Underdog wins, larger gain
    expect(result['2']).toBeLessThan(1600 - 8); // Favorite loses, larger loss
  });

  it('should calculate smaller ELO change for favorite win', () => {
    const teamA: Player[] = [{
      id: '1',
      leagueId: 'league1',
      name: 'Favorite',
      elo: 1600,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const teamB: Player[] = [{
      id: '2',
      leagueId: 'league1',
      name: 'Underdog',
      elo: 1400,
      wins: 0,
      losses: 0,
      matchesPlayed: 25,
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const result = calculateEloChange(teamA, teamB, 'A');
    expect(result['1']).toBeLessThan(1600 + 8); // Favorite wins, smaller gain
    expect(result['2']).toBeGreaterThan(1400 - 8); // Underdog loses, smaller loss
  });

  it('should use higher K-factor for new players', () => {
    const teamA: Player[] = [{
      id: '1',
      leagueId: 'league1',
      name: 'New Player',
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 5, // Less than 20 matches
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const teamB: Player[] = [{
      id: '2',
      leagueId: 'league1',
      name: 'Experienced Player',
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 25, // More than 20 matches
      winStreak: 0,
      createdAt: '2026-01-27'
    }];
    
    const result = calculateEloChange(teamA, teamB, 'A');
    
    // New player (k=32) should gain more than experienced player (k=16)
    const newPlayerGain = result['1'] - 1500;
    const experiencedPlayerLoss = 1500 - result['2'];
    
    expect(newPlayerGain).toBeGreaterThan(8);
    expect(newPlayerGain).toBe(16); // k=32, 50% expected = 32 * 0.5 = 16
    expect(experiencedPlayerLoss).toBe(8); // k=16, 50% expected = 16 * 0.5 = 8
  });
});
