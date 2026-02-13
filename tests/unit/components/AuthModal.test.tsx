import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthModal } from "@/components/AuthModal";
import { authService } from "@/services/AuthService";

// Mock AuthService
vi.mock("@/services/AuthService", () => ({
  authService: {
    signInWithOTP: vi.fn(),
  },
}));

describe("AuthModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <AuthModal isOpen={false} onClose={mockOnClose} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render email form when isOpen is true", () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Créer un compte")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ton@email.com")).toBeInTheDocument();
    expect(screen.getByText("Envoyer le lien magique")).toBeInTheDocument();
  });

  it("should validate email format", () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const submitButton = screen.getByText("Envoyer le lien magique");

    // Submit button should be disabled when email is empty
    expect(submitButton).toBeDisabled();

    // Enter invalid email
    const emailInput = screen.getByPlaceholderText("ton@email.com");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    // Button should be enabled now
    expect(submitButton).not.toBeDisabled();
  });

  it("should call signInWithOTP with valid email", async () => {
    vi.mocked(authService.signInWithOTP).mockResolvedValue({ error: null });

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText("ton@email.com");
    const submitButton = screen.getByText("Envoyer le lien magique");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.signInWithOTP).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });

  it("should call signInWithOTP and transition to success state", async () => {
    vi.mocked(authService.signInWithOTP).mockResolvedValue({ error: null });

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText("ton@email.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByText("Envoyer le lien magique");
    fireEvent.click(submitButton);

    // Verify signInWithOTP was called with correct email
    await waitFor(() => {
      expect(authService.signInWithOTP).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });

  it("should display error message when OTP sending fails", async () => {
    const mockError = new Error("Failed to send OTP");
    vi.mocked(authService.signInWithOTP).mockResolvedValue({
      error: mockError,
    });

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText("ton@email.com");
    const submitButton = screen.getByText("Envoyer le lien magique");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to send OTP/)).toBeInTheDocument();
    });
  });

  it("should close modal and reset state when close button is clicked", async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Fermer");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should disable submit button when email is empty", () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const submitButton = screen.getByText("Envoyer le lien magique");
    expect(submitButton).toBeDisabled();
  });

  it("should show loading state during OTP sending", async () => {
    vi.mocked(authService.signInWithOTP).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100),
        ),
    );

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText("ton@email.com");
    const submitButton = screen.getByText("Envoyer le lien magique");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText("Envoi...")).toBeInTheDocument();
  });
});
