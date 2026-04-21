import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PRankBadge,
  rankOf,
  RANKS,
} from '../../../../src/components/ponglo/PRankBadge';

describe('rankOf', () => {
  it('returns MOUSSE for ELO below first threshold', () => {
    expect(rankOf(0).name).toBe('MOUSSE');
    expect(rankOf(899).name).toBe('MOUSSE');
  });

  it('returns PICHET at 900', () => {
    expect(rankOf(900).name).toBe('PICHET');
    expect(rankOf(1099).name).toBe('PICHET');
  });

  it('returns DEMI at 1100', () => {
    expect(rankOf(1100).name).toBe('DEMI');
  });

  it('returns PINTE at 1300', () => {
    expect(rankOf(1300).name).toBe('PINTE');
  });

  it('returns MAGNUM at 1500', () => {
    expect(rankOf(1500).name).toBe('MAGNUM');
  });

  it('returns METEORE at 1700', () => {
    expect(rankOf(1700).name).toBe('METEORE');
  });

  it('returns LEGENDE at 1900+', () => {
    expect(rankOf(1900).name).toBe('LEGENDE');
    expect(rankOf(2500).name).toBe('LEGENDE');
  });

  it('always returns a tier (never undefined)', () => {
    expect(rankOf(-100).name).toBe('MOUSSE');
  });

  it('tier order is strictly ascending by min', () => {
    for (let i = 1; i < RANKS.length; i += 1) {
      expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min);
    }
  });
});

describe('PRankBadge', () => {
  it('renders the tier name for a given ELO', () => {
    render(<PRankBadge elo={1350} />);
    const badge = screen.getByTestId('rank-badge');
    expect(badge).toHaveAttribute('data-tier', 'PINTE');
    expect(badge.textContent).toContain('PINTE');
  });

  it('shows the star by default', () => {
    render(<PRankBadge elo={1000} />);
    expect(screen.getByTestId('rank-badge').textContent).toContain('★');
  });

  it('hides the star when showStar is false', () => {
    render(<PRankBadge elo={1000} showStar={false} />);
    expect(screen.getByTestId('rank-badge').textContent).not.toContain('★');
  });

  it('applies the tier background color inline', () => {
    render(<PRankBadge elo={1900} />);
    const badge = screen.getByTestId('rank-badge') as HTMLElement;
    // LEGENDE tier — gold background
    expect(badge.style.background.toLowerCase()).toContain('#ffb800');
  });

  it('supports all declared sizes without throwing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<PRankBadge elo={1000} size={size} />);
      expect(screen.getByTestId('rank-badge')).toBeInTheDocument();
      unmount();
    }
  });
});
