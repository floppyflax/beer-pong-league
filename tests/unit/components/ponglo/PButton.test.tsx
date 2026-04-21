import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { PButton } from '../../../../src/components/ponglo/PButton';

describe('PButton', () => {
  it('renders children', () => {
    render(<PButton>Jouer</PButton>);
    expect(screen.getByRole('button', { name: 'Jouer' })).toBeInTheDocument();
  });

  it('defaults to type="button" to avoid accidental form submit', () => {
    render(<PButton>Go</PButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('allows overriding the button type', () => {
    render(<PButton type="submit">Submit</PButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies primary variant by default via data attribute', () => {
    render(<PButton>X</PButton>);
    expect(screen.getByTestId('pbutton')).toHaveAttribute('data-variant', 'primary');
  });

  it('supports all declared variants', () => {
    const variants = ['primary', 'accent', 'tertiary', 'lime', 'dark', 'ghost'] as const;
    for (const v of variants) {
      const { unmount } = render(<PButton variant={v}>{v}</PButton>);
      expect(screen.getByTestId('pbutton')).toHaveAttribute('data-variant', v);
      unmount();
    }
  });

  it('applies full-width class when full prop is set', () => {
    render(<PButton full>Wide</PButton>);
    expect(screen.getByTestId('pbutton')).toHaveClass('w-full');
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<PButton onClick={onClick}>Tap</PButton>);
    await userEvent.setup().click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled attribute', () => {
    render(<PButton disabled>Disabled</PButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<PButton ref={ref}>Ref</PButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders an icon slot before children', () => {
    render(
      <PButton icon={<span data-testid="icon">★</span>}>Label</PButton>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
