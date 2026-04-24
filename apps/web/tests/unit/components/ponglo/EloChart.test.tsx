/**
 * EloChart unit tests — PR3 §5.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EloChart } from '../../../../src/components/ponglo/EloChart';

const POINTS = [
  { date: '2025-01', elo: 1000 },
  { date: '2025-02', elo: 1050 },
  { date: '2025-03', elo: 1100 },
];

describe('EloChart', () => {
  it('renders an SVG chart with ≥2 points', () => {
    render(<EloChart points={POINTS} />);
    expect(screen.getByTestId('elo-chart')).toBeInTheDocument();
  });

  it('shows empty state for fewer than 2 points', () => {
    render(<EloChart points={[{ date: '2025-01', elo: 1000 }]} />);
    expect(screen.getByTestId('elo-chart-empty')).toBeInTheDocument();
  });

  it('renders with default dimensions (330×80)', () => {
    render(<EloChart points={POINTS} />);
    const svg = screen.getByTestId('elo-chart');
    expect(svg).toHaveAttribute('width', '330');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('respects custom dimensions', () => {
    render(<EloChart points={POINTS} width={200} height={60} />);
    const svg = screen.getByTestId('elo-chart');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('renders grid lines (3 horizontal lines)', () => {
    const { container } = render(<EloChart points={POINTS} />);
    const dashedLines = container.querySelectorAll('line[stroke-dasharray]');
    expect(dashedLines.length).toBeGreaterThanOrEqual(3);
  });

  it('marks aria-hidden for decorative SVG', () => {
    render(<EloChart points={POINTS} />);
    expect(screen.getByTestId('elo-chart')).toHaveAttribute('aria-hidden', 'true');
  });
});
