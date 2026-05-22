import { describe, it, expect } from 'vitest';
import { calculateEloChange } from '@/utils/elo';
import type { Player } from '@/types';

const mkPlayer = (over: Partial<Player> & Pick<Player, 'id' | 'elo' | 'matchesPlayed'>): Player => ({
  leagueId: 'league1',
  name: 'Player',
  wins: 0,
  losses: 0,
  winStreak: 0,
  createdAt: '2026-01-27',
  ...over,
});

describe('ELO Calculation — league context (tiered 32/16)', () => {
  it('should calculate ELO change for equal players', () => {
    const teamA: Player[] = [mkPlayer({ id: '1', elo: 1500, matchesPlayed: 25 })];
    const teamB: Player[] = [mkPlayer({ id: '2', elo: 1500, matchesPlayed: 25 })];

    const result = calculateEloChange(teamA, teamB, 'A', 'league');
    expect(result['1']).toBe(1508); // 1500 + 8 (k=16, 50% expected win)
    expect(result['2']).toBe(1492); // 1500 - 8
  });

  it('should calculate larger ELO change for underdog win', () => {
    const teamA: Player[] = [mkPlayer({ id: '1', elo: 1400, matchesPlayed: 25 })];
    const teamB: Player[] = [mkPlayer({ id: '2', elo: 1600, matchesPlayed: 25 })];

    const result = calculateEloChange(teamA, teamB, 'A', 'league');
    expect(result['1']).toBeGreaterThan(1400 + 8); // Underdog wins, larger gain
    expect(result['2']).toBeLessThan(1600 - 8); // Favorite loses, larger loss
  });

  it('should calculate smaller ELO change for favorite win', () => {
    const teamA: Player[] = [mkPlayer({ id: '1', elo: 1600, matchesPlayed: 25 })];
    const teamB: Player[] = [mkPlayer({ id: '2', elo: 1400, matchesPlayed: 25 })];

    const result = calculateEloChange(teamA, teamB, 'A', 'league');
    expect(result['1']).toBeLessThan(1600 + 8); // Favorite wins, smaller gain
    expect(result['2']).toBeGreaterThan(1400 - 8); // Underdog loses, smaller loss
  });

  it('should use higher K-factor for new players (<20 matches)', () => {
    const teamA: Player[] = [mkPlayer({ id: '1', elo: 1500, matchesPlayed: 5 })]; // new
    const teamB: Player[] = [mkPlayer({ id: '2', elo: 1500, matchesPlayed: 25 })]; // established

    const result = calculateEloChange(teamA, teamB, 'A', 'league');

    const newPlayerGain = result['1'] - 1500;
    const experiencedPlayerLoss = 1500 - result['2'];

    expect(newPlayerGain).toBe(16); // k=32, 50% expected = 32 * 0.5 = 16
    expect(experiencedPlayerLoss).toBe(8); // k=16, 50% expected = 16 * 0.5 = 8
  });
});

describe('ELO Calculation — event context (flat K=64)', () => {
  it('uses a flat K=64 regardless of matches played (established player)', () => {
    const teamA: Player[] = [mkPlayer({ id: '1', elo: 1500, matchesPlayed: 25 })];
    const teamB: Player[] = [mkPlayer({ id: '2', elo: 1500, matchesPlayed: 25 })];

    const result = calculateEloChange(teamA, teamB, 'A', 'event');
    expect(result['1']).toBe(1532); // 1500 + 32 (k=64, 50% expected)
    expect(result['2']).toBe(1468); // 1500 - 32
  });

  it('ignores the 20-match tier — a beginner gets the same K=64 as a veteran', () => {
    const beginner: Player[] = [mkPlayer({ id: '1', elo: 1500, matchesPlayed: 3 })];
    const veteran: Player[] = [mkPlayer({ id: '2', elo: 1500, matchesPlayed: 80 })];

    const result = calculateEloChange(beginner, veteran, 'A', 'event');
    // Both move by 32 — no tier distinction in event context.
    expect(result['1'] - 1500).toBe(32);
    expect(1500 - result['2']).toBe(32);
  });

  it('spreads ratings ~2x more than league for the same matchup', () => {
    const a = mkPlayer({ id: '1', elo: 1500, matchesPlayed: 25 });
    const b = mkPlayer({ id: '2', elo: 1500, matchesPlayed: 25 });

    const league = calculateEloChange([a], [b], 'A', 'league');
    const event = calculateEloChange([a], [b], 'A', 'event');

    expect(event['1'] - 1500).toBe((league['1'] - 1500) * 4); // 32 vs 8 (K=64 vs 16)
  });
});
