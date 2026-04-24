/**
 * Podium unit tests — PR3 §5.3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Podium } from '../../../../src/components/ponglo/Podium';

const TOP3 = [
  { id: 'p1', name: 'Marc', elo: 1850 },
  { id: 'p2', name: 'Jean', elo: 1720 },
  { id: 'p3', name: 'Paul', elo: 1600 },
];

describe('Podium', () => {
  it('renders the 3 podium columns', () => {
    render(<Podium top3={TOP3} />);
    expect(screen.getByTestId('podium-rank-1')).toBeInTheDocument();
    expect(screen.getByTestId('podium-rank-2')).toBeInTheDocument();
    expect(screen.getByTestId('podium-rank-3')).toBeInTheDocument();
  });

  it('displays all 3 player names', () => {
    render(<Podium top3={TOP3} />);
    expect(screen.getAllByText('Marc').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Jean').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paul').length).toBeGreaterThanOrEqual(1);
  });

  it('displays ELO values', () => {
    render(<Podium top3={TOP3} />);
    expect(screen.getByText('1850')).toBeInTheDocument();
    expect(screen.getByText('1720')).toBeInTheDocument();
    expect(screen.getByText('1600')).toBeInTheDocument();
  });

  it('shows scope label when provided', () => {
    render(<Podium top3={TOP3} scope="League des Pingouins" />);
    expect(screen.getByText('League des Pingouins')).toBeInTheDocument();
  });

  it('returns null when fewer than 3 players', () => {
    const { container } = render(
      <Podium top3={[{ id: 'p1', name: 'Only', elo: 1000 }]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('has electric-blue background card', () => {
    const { container } = render(<Podium top3={TOP3} />);
    const podium = container.querySelector('[data-testid="podium"]');
    expect(podium?.className).toContain('bg-electric-blue');
  });
});
