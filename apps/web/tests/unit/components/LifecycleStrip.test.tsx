import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LifecycleStrip } from '@/components/design-system/LifecycleStrip';

describe('LifecycleStrip', () => {
  it('renders title + description with the requested tone', () => {
    render(
      <LifecycleStrip
        tone="paused"
        title="Ligue en pause"
        description="Reprends pour réautoriser les matchs."
        testId="strip-test"
      />,
    );
    const strip = screen.getByTestId('strip-test');
    expect(strip).toHaveTextContent('Ligue en pause');
    expect(strip).toHaveTextContent('Reprends pour réautoriser les matchs.');
    // role=status pour les ATs
    expect(strip).toHaveAttribute('role', 'status');
  });

  it('uses sticky positioning so it stays visible while scrolling', () => {
    render(
      <LifecycleStrip
        tone="not_started"
        title="Événement non démarré"
        description="Démarre pour commencer."
        testId="strip-test"
      />,
    );
    const strip = screen.getByTestId('strip-test');
    expect(strip.className).toContain('sticky');
    expect(strip.className).toContain('top-0');
  });

  it('supports the finished tone', () => {
    render(
      <LifecycleStrip
        tone="finished"
        title="Ligue terminée"
        description="Le classement est figé."
        testId="strip-test"
      />,
    );
    expect(screen.getByTestId('strip-test')).toHaveTextContent('Ligue terminée');
  });

  it('supports the reminder tone (mig 029) with a slightly more saturated background', () => {
    render(
      <LifecycleStrip
        tone="reminder"
        title="Saison 1 échue"
        description="Démarre la Saison 2."
        testId="strip-test"
      />,
    );
    const strip = screen.getByTestId('strip-test');
    expect(strip).toHaveTextContent('Saison 1 échue');
    // Reminder utilise un bg légèrement plus saturé pour se différencier
    expect(strip.className).toContain('bg-ping-yellow/15');
  });
});
