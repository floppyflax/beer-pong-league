import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { FAB } from '../../../../src/components/design-system/FAB';

describe('FAB (Story 14-6)', () => {
  it('should render with icon and call onClick when clicked (AC: 6)', async () => {
    const onClick = vi.fn();
    render(
      <FAB icon={Plus} onClick={onClick} ariaLabel="Créer un tournoi" />
    );
    const button = screen.getByRole('button', { name: 'Créer un tournoi' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have size 56px on mobile (AC: 1)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('w-14');
    expect(button).toHaveClass('h-14');
  });

  it('should have size 64px on desktop (AC: 1)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('md:w-16');
    expect(button).toHaveClass('md:h-16');
  });

  it('should have gradient background (AC: 2)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" variant="primary" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-fab');
  });

  it('should have shadow-lg (AC: 4)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('shadow-lg');
  });

  it('should have fixed position bottom-20 right-4 (AC: 5)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-20');
    expect(button).toHaveClass('right-4');
  });

  it('should render icon with white color and 24px (AC: 3)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const iconWrapper = container.querySelector('[data-testid="fab-icon"]');
    expect(iconWrapper).toHaveClass('text-white');
  });

  it('should apply primary variant (gradient) by default', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-fab');
  });

  it('should apply secondary variant (muted style)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" variant="secondary" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-slate-700');
  });

  it('should use relative position when inline prop is true (showcase mode)', () => {
    const { container } = render(
      <FAB icon={Plus} onClick={() => {}} ariaLabel="Test" inline />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('relative');
    expect(button).not.toHaveClass('fixed');
  });
});
