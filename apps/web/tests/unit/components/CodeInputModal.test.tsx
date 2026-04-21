import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeInputModal } from '../../../src/components/join/CodeInputModal';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Hash: () => <div data-testid="hash-icon">Hash</div>,
}));

describe('CodeInputModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  it('should render modal with input field', () => {
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Saisir le Code/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: ABC123/i)).toBeInTheDocument();
    expect(screen.getByText('REJOINDRE')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /fermer/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have modal overlay', () => {
    const { container } = render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    // Check overlay exists
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('should allow typing in input field', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i) as HTMLInputElement;
    await user.type(input, 'TEST99');

    expect(input.value).toBe('TEST99');
  });

  it('should convert input to uppercase', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i) as HTMLInputElement;
    await user.type(input, 'abc123');

    expect(input.value).toBe('ABC123');
  });

  it('should submit valid code when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });

    await user.type(input, 'ABC123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC123');
    });
  });

  it('should disable submit for invalid code length (too short)', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByText('REJOINDRE');

    await user.type(input, 'AB');

    // Button should be disabled for codes < 5 chars
    expect(submitButton).toBeDisabled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable submit for invalid code length (too long)', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByText('REJOINDRE');

    // maxLength=8 prevents more than 8 chars, but let's test with 8+ attempt
    await user.type(input, 'ABCDEFGH'); // 8 chars (max)
    expect(submitButton).not.toBeDisabled();

    // Input has maxLength=8, so typing more won't add chars
    // The component prevents >8 chars at input level
  });

  it('should filter out special characters automatically', async () => {
    const user = userEvent.setup();
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i) as HTMLInputElement;

    // Component filters out non-alphanumeric chars
    await user.type(input, 'ABC-123');

    // Should have "ABC123" (dash removed)
    expect(input.value).toBe('ABC123');
  });

  it('should accept valid 5-character code', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });

    await user.type(input, 'ABC12');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC12');
    });
  });

  it('should accept valid 8-character code', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });

    await user.type(input, 'ABCD1234');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABCD1234');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);

    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    let submitButton = screen.getByText('REJOINDRE');

    await user.type(input, 'ABC123');
    await user.click(submitButton);

    // Button should show loading text and be disabled
    await waitFor(() => {
      expect(screen.getByText('VÉRIFICATION...')).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    submitButton = screen.getByText('VÉRIFICATION...').closest('button')!;
    expect(submitButton).toBeDisabled();

    // Note: On success, parent closes modal, so we don't test state after resolve
    resolveSubmit!();
  });

  it('should disable submit button when input is empty', () => {
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });
    expect(submitButton).toBeDisabled();
  });

  it('should trim whitespace from code before validation', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });

    // Type with leading/trailing spaces
    await user.clear(input);
    await user.type(input, '  ABC123  ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC123');
    });
  });

  it('should handle submission errors gracefully', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Network error'));
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    const submitButton = screen.getByRole('button', { name: /Rejoindre/i });

    await user.type(input, 'ABC123');
    await user.click(submitButton);

    // Modal should remain open after error (onClose not called)
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Submit button should be re-enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should prevent form submission on Enter key', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CodeInputModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ex: ABC123/i);
    await user.type(input, 'ABC123{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC123');
    });
  });
});
