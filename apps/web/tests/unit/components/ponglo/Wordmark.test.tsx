import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PongloGlyph, PongloWordmark } from '../../../../src/components/ponglo/Wordmark';

describe('PongloGlyph', () => {
  it('renders an SVG with default size 32', () => {
    const { container } = render(<PongloGlyph />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('respects custom size prop', () => {
    const { container } = render(<PongloGlyph size={64} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('64');
  });

  it('uses brand colors by default (red + blue cups)', () => {
    const { container } = render(<PongloGlyph />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(3);
    const fills = Array.from(circles).map((c) => c.getAttribute('fill'));
    expect(fills).toContain('#FF4438');
    expect(fills).toContain('#3B8EFF');
  });

  it('renders mono when color override is provided', () => {
    const { container } = render(<PongloGlyph color="#FFFFFF" />);
    const circles = container.querySelectorAll('circle');
    const colored = Array.from(circles).filter(
      (c) => c.getAttribute('fill') === '#FFFFFF',
    );
    expect(colored.length).toBeGreaterThanOrEqual(3);
  });

  it('is aria-hidden (decorative)', () => {
    const { container } = render(<PongloGlyph />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('PongloWordmark', () => {
  it('renders both glyph and "BEER PONG ELO" text by default', () => {
    const { container } = render(<PongloWordmark />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('BEER PONG ELO')).toBeInTheDocument();
  });

  it('hides the text when glyphOnly is true', () => {
    const { container } = render(<PongloWordmark glyphOnly />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('BEER PONG ELO')).not.toBeInTheDocument();
  });

  it('exposes role="img" with default aria-label "Beer Pong ELO"', () => {
    render(<PongloWordmark />);
    expect(screen.getByRole('img', { name: /beer pong elo/i })).toBeInTheDocument();
  });

  it('uses custom aria-label when provided', () => {
    render(<PongloWordmark aria-label="Custom Brand" />);
    expect(screen.getByRole('img', { name: 'Custom Brand' })).toBeInTheDocument();
  });
});
