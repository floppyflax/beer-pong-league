import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Banner } from '../../../../src/components/design-system/Banner';

describe('Banner (Story 14-7)', () => {
  it('should display message (AC: 2)', () => {
    render(<Banner message="Tournoi rejoint ! Redirection…" variant="success" />);
    expect(screen.getByText('Tournoi rejoint ! Redirection…')).toBeInTheDocument();
  });

  it('should have green background for success variant (AC: 1)', () => {
    const { container } = render(<Banner message="Succès" variant="success" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('bg-success');
  });

  it('should have red background for error variant (AC: 1)', () => {
    const { container } = render(<Banner message="Erreur" variant="error" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('bg-error');
  });

  it('should render icon + text (AC: 2)', () => {
    const { container } = render(<Banner message="Message" variant="success" />);
    const banner = container.firstChild as HTMLElement;
    // Icon is present (lucide renders svg)
    expect(banner.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should be inline by default (AC: 3)', () => {
    const { container } = render(<Banner message="Inline" variant="success" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).not.toHaveClass('fixed');
  });

  it('should support position top (AC: 3)', () => {
    const { container } = render(
      <Banner message="Top" variant="success" position="top" />
    );
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('fixed');
    expect(banner).toHaveClass('top-0');
  });

  it('should support position inline (AC: 3)', () => {
    const { container } = render(
      <Banner message="Inline" variant="error" position="inline" />
    );
    const banner = container.firstChild as HTMLElement;
    expect(banner).not.toHaveClass('fixed');
  });

  it('should not show dismiss button when onDismiss is not provided (AC: 4)', () => {
    render(<Banner message="No dismiss" variant="success" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should show dismiss button when onDismiss is provided (AC: 4)', () => {
    const onDismiss = vi.fn();
    render(<Banner message="Dismissable" variant="success" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: /fermer|dismiss|close/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked (AC: 4)', async () => {
    const onDismiss = vi.fn();
    render(<Banner message="Dismissable" variant="success" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: /fermer|dismiss|close/i });
    const user = userEvent.setup();
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should have data-testid for testing', () => {
    const { container } = render(<Banner message="Test" variant="success" />);
    const banner = container.querySelector('[data-testid="banner"]');
    expect(banner).toBeInTheDocument();
  });
});
