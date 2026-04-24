/**
 * Sparkline unit tests — PR3 §5.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from '../../../../src/components/ponglo/Sparkline';

describe('Sparkline', () => {
  it('renders an SVG when given ≥2 points', () => {
    render(<Sparkline points={[1000, 1050, 1100]} />);
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });

  it('returns null for fewer than 2 points', () => {
    const { container } = render(<Sparkline points={[1000]} />);
    expect(container.firstChild).toBeNull();
  });

  it('uses default dimensions (44×18)', () => {
    render(<Sparkline points={[1000, 1100]} />);
    const svg = screen.getByTestId('sparkline');
    expect(svg).toHaveAttribute('width', '44');
    expect(svg).toHaveAttribute('height', '18');
  });

  it('respects custom dimensions', () => {
    render(<Sparkline points={[1000, 1050, 1100]} width={80} height={28} />);
    const svg = screen.getByTestId('sparkline');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '28');
  });

  it('renders correctly with flat points (no range)', () => {
    // Should not throw with all-equal points
    expect(() => render(<Sparkline points={[1000, 1000, 1000]} />)).not.toThrow();
  });

  it('marks aria-hidden for decorative SVG', () => {
    render(<Sparkline points={[1000, 1050]} />);
    expect(screen.getByTestId('sparkline')).toHaveAttribute('aria-hidden', 'true');
  });
});
