import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar, Users, LayoutGrid } from 'lucide-react';
import { InfoCard } from '../../../../src/components/design-system/InfoCard';

describe('InfoCard (Story 14-5, Epic 15 Arcade palette)', () => {
  it('should have structure: bg-navy-soft rounded-card p-4 border border-card (AC: 1)', () => {
    const { container } = render(
      <InfoCard title="Mon Tournoi" statusBadge="En cours" infos={[]} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-navy-soft');
    expect(card).toHaveClass('rounded-card');
    expect(card).toHaveClass('p-4');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-card');
  });

  it('should display title and status badge (AC: 2)', () => {
    render(
      <InfoCard title="Ligue Saison 2025" statusBadge="Terminé" infos={[]} />
    );
    expect(screen.getByText('Ligue Saison 2025')).toBeInTheDocument();
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('should display info line with icons (AC: 3)', () => {
    render(
      <InfoCard
        title="Tournoi"
        statusBadge="Actif"
        infos={[
          { icon: Calendar, text: '15 mars 2025' },
          { icon: Users, text: '8 joueurs' },
          { icon: LayoutGrid, text: '2v2' },
        ]}
      />
    );
    expect(screen.getByText('15 mars 2025')).toBeInTheDocument();
    expect(screen.getByText('8 joueurs')).toBeInTheDocument();
    expect(screen.getByText('2v2')).toBeInTheDocument();
  });

  it('should support children for flexibility (AC: 4)', () => {
    render(
      <InfoCard title="Custom" statusBadge="Badge">
        <div data-testid="custom-content">Contenu personnalisé</div>
      </InfoCard>
    );
    expect(screen.getByTestId('custom-content')).toHaveTextContent(
      'Contenu personnalisé'
    );
  });

  it('should apply status-active variant (cup-red) for active badge', () => {
    render(
      <InfoCard
        title="T"
        statusBadge="En cours"
        statusVariant="active"
        infos={[]}
      />
    );
    const badge = screen.getByText('En cours');
    expect(badge).toHaveClass('bg-signal-red/20');
    expect(badge).toHaveClass('text-signal-red');
  });

  it('should apply status-finished variant (lime) for finished badge', () => {
    render(
      <InfoCard
        title="T"
        statusBadge="Terminé"
        statusVariant="finished"
        infos={[]}
      />
    );
    const badge = screen.getByText('Terminé');
    expect(badge).toHaveClass('bg-lime/20');
    expect(badge).toHaveClass('text-lime');
  });

  it('should apply status-cancelled variant (ink-mute) for cancelled badge', () => {
    render(
      <InfoCard
        title="T"
        statusBadge="Annulé"
        statusVariant="cancelled"
        infos={[]}
      />
    );
    const badge = screen.getByText('Annulé');
    expect(badge).toHaveClass('bg-cool-gray/20');
    expect(badge).toHaveClass('text-cool-gray');
  });

  it('should have data-testid infocard', () => {
    const { container } = render(
      <InfoCard title="T" statusBadge="B" infos={[]} />
    );
    const card = container.querySelector('[data-testid="infocard"]');
    expect(card).toBeInTheDocument();
  });
});
