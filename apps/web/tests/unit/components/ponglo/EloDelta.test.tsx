import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EloDelta } from '../../../../src/components/ponglo/EloDelta';

describe('EloDelta', () => {
  it('renders positive value with up arrow and lime coloring', () => {
    render(<EloDelta value={24} />);
    const el = screen.getByTestId('elo-delta');
    expect(el).toHaveAttribute('data-sign', 'up');
    expect(el).toHaveClass('text-lime');
    expect(el.textContent).toContain('↑');
    expect(el.textContent).toContain('24');
  });

  it('renders negative value with down arrow and ruby coloring', () => {
    render(<EloDelta value={-12} />);
    const el = screen.getByTestId('elo-delta');
    expect(el).toHaveAttribute('data-sign', 'down');
    expect(el).toHaveClass('text-signal-red');
    expect(el.textContent).toContain('↓');
    expect(el.textContent).toContain('12');
  });

  it('treats 0 as positive (up)', () => {
    render(<EloDelta value={0} />);
    expect(screen.getByTestId('elo-delta')).toHaveAttribute('data-sign', 'up');
  });

  it('shows absolute value (no minus sign in visible text)', () => {
    render(<EloDelta value={-48} />);
    const el = screen.getByTestId('elo-delta');
    // The visible number should be "48" without a minus
    expect(el.textContent).not.toContain('-48');
    expect(el.textContent).toContain('48');
  });

  it('hides the arrow when hideArrow is true', () => {
    render(<EloDelta value={10} hideArrow />);
    const el = screen.getByTestId('elo-delta');
    expect(el.textContent).not.toContain('↑');
    expect(el.textContent).not.toContain('↓');
  });

  it('appends ELO unit when showUnit is true', () => {
    render(<EloDelta value={10} showUnit />);
    expect(screen.getByTestId('elo-delta').textContent).toContain('ELO');
  });

  it('provides an accessible SR-only description', () => {
    render(<EloDelta value={24} />);
    expect(screen.getByText(/Gain de 24 ELO/i)).toBeInTheDocument();
  });

  it('announces loss for negative deltas', () => {
    render(<EloDelta value={-7} />);
    expect(screen.getByText(/Perte de 7 ELO/i)).toBeInTheDocument();
  });
});
