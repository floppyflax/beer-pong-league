import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../../src/components/design-system/StatCard';

describe('StatCard (Story 14-2, Epic 15 Arcade palette)', () => {
  it('should display value and label (AC: 1)', () => {
    render(<StatCard value={42} label="Joueurs" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Joueurs')).toBeInTheDocument();
  });

  it('should accept ReactNode as value', () => {
    render(<StatCard value={<span data-testid="custom-value">1,234</span>} label="ELO" />);
    expect(screen.getByTestId('custom-value')).toHaveTextContent('1,234');
    expect(screen.getByText('ELO')).toBeInTheDocument();
  });

  it('should have structure: bg-paper p-3 rounded-card text-center (AC: 3)', () => {
    const { container } = render(<StatCard value={0} label="Matchs" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-paper');
    expect(card).toHaveClass('rounded-card');
    expect(card).toHaveClass('text-center');
    expect(card).toHaveClass('p-3');
  });

  it('should apply primary variant color (AC: 2)', () => {
    render(<StatCard value={10} label="Joueurs" variant="primary" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-cup-blue');
  });

  it('should apply success variant color (AC: 2)', () => {
    render(<StatCard value={75} label="Win rate %" variant="success" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-lime');
  });

  it('should apply accent variant color (AC: 2)', () => {
    render(<StatCard value={1200} label="ELO" variant="accent" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-cup-red');
  });

  it('should use default ink variant when variant prop is omitted', () => {
    render(<StatCard value={5} label="Matchs" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-ink');
  });

  it('should render value with stat font (AC: 4)', () => {
    render(<StatCard value={99} label="Top" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-stat');
    expect(valueEl).toHaveClass('font-bold');
  });

  it('should render label with Arcade archivo extrabold uppercase (AC: 5)', () => {
    render(<StatCard value={1} label="Rang" />);
    const labelEl = screen.getByTestId('statcard-label');
    expect(labelEl).toHaveClass('text-[10px]');
    expect(labelEl).toHaveClass('uppercase');
    expect(labelEl).toHaveClass('font-extrabold');
    expect(labelEl).toHaveClass('font-archivo');
    expect(labelEl).toHaveClass('text-ink-mute');
  });
});
