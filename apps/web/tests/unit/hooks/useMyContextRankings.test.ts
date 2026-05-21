import { describe, it, expect } from 'vitest';
import { computeContextRank } from '../../../src/hooks/useMyContextRankings';

describe('computeContextRank', () => {
  it('returns null when myId is not in the rows', () => {
    const rows = [
      { id: 'a', elo: 1200 },
      { id: 'b', elo: 1100 },
    ];
    expect(computeContextRank(rows, 'missing')).toBeNull();
  });

  it('computes rank 1 for the highest ELO', () => {
    const rows = [
      { id: 'a', elo: 1300 },
      { id: 'b', elo: 1200 },
      { id: 'c', elo: 1100 },
    ];
    expect(computeContextRank(rows, 'a')).toEqual({ rank: 1, total: 3 });
  });

  it('computes rank 3 for the lowest ELO', () => {
    const rows = [
      { id: 'a', elo: 1300 },
      { id: 'b', elo: 1200 },
      { id: 'c', elo: 1100 },
    ];
    expect(computeContextRank(rows, 'c')).toEqual({ rank: 3, total: 3 });
  });

  it('returns null when several rows share my exact ELO (tie)', () => {
    const rows = [
      { id: 'a', elo: 1000 },
      { id: 'b', elo: 1000 },
      { id: 'c', elo: 1000 },
    ];
    expect(computeContextRank(rows, 'b')).toBeNull();
  });

  it('returns null even with just one other tied at the same ELO', () => {
    const rows = [
      { id: 'a', elo: 1200 },
      { id: 'b', elo: 1100 },
      { id: 'c', elo: 1100 },
    ];
    expect(computeContextRank(rows, 'b')).toBeNull();
    expect(computeContextRank(rows, 'c')).toBeNull();
  });

  it('returns rank for unique ELOs even if others are tied between themselves', () => {
    const rows = [
      { id: 'a', elo: 1300 },
      { id: 'b', elo: 1100 },
      { id: 'c', elo: 1100 },
    ];
    expect(computeContextRank(rows, 'a')).toEqual({ rank: 1, total: 3 });
  });

  it('handles a single member (rank 1/1)', () => {
    const rows = [{ id: 'a', elo: 1200 }];
    expect(computeContextRank(rows, 'a')).toEqual({ rank: 1, total: 1 });
  });

  it('counts total correctly when myId is alone at top with others tied below', () => {
    const rows = [
      { id: 'me', elo: 1500 },
      { id: 'b', elo: 1000 },
      { id: 'c', elo: 1000 },
      { id: 'd', elo: 1000 },
    ];
    expect(computeContextRank(rows, 'me')).toEqual({ rank: 1, total: 4 });
  });
});
