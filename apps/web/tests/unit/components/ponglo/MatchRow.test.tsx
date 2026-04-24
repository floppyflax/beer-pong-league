/**
 * MatchRow unit tests — PR3 §5.3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchRow } from '../../../../src/components/ponglo/MatchRow';

const MATCH = {
  id: 'm1',
  date: '2026-01-15',
  teamA: ['p1'],
  teamB: ['p2'],
  scoreA: 10,
  scoreB: 7,
  eloChanges: { p1: 18, p2: -18 },
};

const NAMES = { p1: 'Marc', p2: 'Jean' };

describe('MatchRow', () => {
  it('renders history variant with Victoire label (won)', () => {
    render(
      <MatchRow
        match={MATCH}
        variant="history"
        userPerspective="won"
        currentPlayerId="p1"
        playerNames={NAMES}
      />,
    );
    expect(screen.getByTestId('match-row')).toBeInTheDocument();
    expect(screen.getByText('Victoire')).toBeInTheDocument();
  });

  it('renders history variant with Défaite label (lost)', () => {
    render(
      <MatchRow
        match={MATCH}
        variant="history"
        userPerspective="lost"
        currentPlayerId="p2"
        playerNames={NAMES}
      />,
    );
    expect(screen.getByText('Défaite')).toBeInTheDocument();
  });

  it('renders ELO delta in history variant', () => {
    render(
      <MatchRow
        match={MATCH}
        variant="history"
        userPerspective="won"
        currentPlayerId="p1"
        playerNames={NAMES}
      />,
    );
    expect(screen.getByText('+18 ELO')).toBeInTheDocument();
  });

  it('renders match variant without outcome label', () => {
    render(
      <MatchRow match={MATCH} variant="match" playerNames={NAMES} />,
    );
    expect(screen.queryByText('Victoire')).not.toBeInTheDocument();
    expect(screen.queryByText('Défaite')).not.toBeInTheDocument();
  });

  it('displays score', () => {
    render(<MatchRow match={MATCH} variant="match" playerNames={NAMES} />);
    expect(screen.getByText('10 – 7')).toBeInTheDocument();
  });

  it('displays team names', () => {
    render(<MatchRow match={MATCH} variant="match" playerNames={NAMES} />);
    expect(screen.getByText('Marc')).toBeInTheDocument();
    expect(screen.getByText('Jean')).toBeInTheDocument();
  });
});
