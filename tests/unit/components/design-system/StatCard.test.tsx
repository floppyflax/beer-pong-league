import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../../src/components/design-system/StatCard';

describe('StatCard (Story 14-2)', () => {
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

  it('should have structure: bg-slate-800 p-3 rounded-xl text-center (AC: 3)', () => {
    const { container } = render(<StatCard value={0} label="Matchs" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-slate-800');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('text-center');
    expect(card).toHaveClass('p-3');
  });

  it('should apply primary variant color (AC: 2)', () => {
    render(<StatCard value={10} label="Joueurs" variant="primary" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-info');
  });

  it('should apply success variant color (AC: 2)', () => {
    render(<StatCard value={75} label="Win rate %" variant="success" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-success');
  });

  it('should apply accent variant color (AC: 2)', () => {
    render(<StatCard value={1200} label="ELO" variant="accent" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-primary');
  });

  it('should use default variant when variant prop is omitted', () => {
    render(<StatCard value={5} label="Matchs" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-text-primary');
  });

  it('should render value with text-2xl font-bold (AC: 4)', () => {
    render(<StatCard value={99} label="Top" />);
    const valueEl = screen.getByTestId('statcard-value');
    expect(valueEl).toHaveClass('text-2xl');
    expect(valueEl).toHaveClass('font-bold');
  });

  it('should render label with text-[10px] uppercase font-bold (AC: 5)', () => {
    render(<StatCard value={1} label="Rang" />);
    const labelEl = screen.getByTestId('statcard-label');
    expect(labelEl).toHaveClass('text-[10px]');
    expect(labelEl).toHaveClass('uppercase');
    expect(labelEl).toHaveClass('font-bold');
    expect(labelEl).toHaveClass('text-slate-400');
  });
});
