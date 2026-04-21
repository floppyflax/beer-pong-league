import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaymentModal } from "../../../src/components/PaymentModal";
import { premiumService } from "../../../src/services/PremiumService";
import { supabase } from "../../../src/lib/supabase";

// Mock dependencies
vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => ({
    localUser: { anonymousUserId: "anon-123" },
  }),
}));

vi.mock("../../../src/context/AuthContext", () => ({
  useAuthContext: () => ({
    user: { id: "user-123" },
  }),
}));

vi.mock("../../../src/services/PremiumService", () => ({
  premiumService: {
    isPremium: vi.fn(),
    updatePremiumStatusInLocalStorage: vi.fn(),
  },
}));

vi.mock("../../../src/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  },
}));

describe("PaymentModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Task 1: Modal Structure", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <PaymentModal isOpen={false} onClose={mockOnClose} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when isOpen is true", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText("Passe Premium")).toBeInTheDocument();
    });

    it("should have close button", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText("Fermer");
      expect(closeButton).toBeInTheDocument();
    });

    it("should call onClose when close button clicked", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task 2: Premium Benefits Display", () => {
    it("should display all premium benefits", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Tournois illimités")).toBeInTheDocument();
      expect(screen.getByText("Ligues illimitées")).toBeInTheDocument();
      expect(screen.getByText("Joueurs illimités")).toBeInTheDocument();
    });

    it("should display benefit descriptions", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/Crée autant de tournois/)).toBeInTheDocument();
      expect(screen.getByText(/Crée et gère des ligues/)).toBeInTheDocument();
      expect(
        screen.getByText(/Aucune limite de participants/),
      ).toBeInTheDocument();
    });
  });

  describe("Task 3: Price Display", () => {
    it("should display price prominently", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText("3€")).toBeInTheDocument();
    });

    it("should display payment clarification", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/Paiement unique - À vie/)).toBeInTheDocument();
    });
  });

  describe("Task 5: Payment States", () => {
    it("should start in idle state", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/Débloquer Premium/)).toBeInTheDocument();
    });

    it("should show processing state during payment", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });
    });

    it("should show success state after payment", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Fast-forward through payment simulation
      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Paiement réussi !")).toBeInTheDocument();
      });
    });

    it("should show error state on payment failure", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: new Error("Update failed") })),
          })),
        })),
      };
      vi.mocked(supabase).from = mockSupabase.from;

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Erreur de paiement")).toBeInTheDocument();
      });
    });
  });

  describe("Task 6: Payment Success Handling", () => {
    it("should call onSuccess callback after successful payment", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Fast-forward through payment + success delay
      await vi.advanceTimersByTimeAsync(1500 + 1500);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("should update localStorage on success", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(
          premiumService.updatePremiumStatusInLocalStorage,
        ).toHaveBeenCalledWith(true);
      });
    });

    it("should auto-close modal after success", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Fast-forward through payment + success delay
      await vi.advanceTimersByTimeAsync(1500 + 1500);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Task 7: Payment Error Handling", () => {
    it("should display error message on failure", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: new Error("Update failed") })),
          })),
        })),
      };
      vi.mocked(supabase).from = mockSupabase.from;

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(
          screen.getByText(/Erreur lors de la mise à jour/),
        ).toBeInTheDocument();
      });
    });

    it("should show retry button on error", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: new Error("Update failed") })),
          })),
        })),
      };
      vi.mocked(supabase).from = mockSupabase.from;

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Réessayer")).toBeInTheDocument();
      });
    });

    it("should reset to idle state when retry clicked", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: new Error("Update failed") })),
          })),
        })),
      };
      vi.mocked(supabase).from = mockSupabase.from;

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Réessayer")).toBeInTheDocument();
      });

      const retryButton = screen.getByText("Réessayer");
      fireEvent.click(retryButton);

      expect(screen.getByText(/Débloquer Premium/)).toBeInTheDocument();
    });

    it("should handle authentication error", async () => {
      // Mock no user
      vi.mock("../../../src/context/AuthContext", () => ({
        useAuthContext: () => ({
          user: null,
        }),
      }));

      vi.mock("../../../src/hooks/useIdentity", () => ({
        useIdentity: () => ({
          localUser: null,
        }),
      }));

      const { rerender } = render(
        <PaymentModal isOpen={true} onClose={mockOnClose} />,
      );

      // Force re-render to apply mocks
      rerender(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Vous devez être connecté/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Task 8: Modal Close Handling", () => {
    it("should allow close when idle", () => {
      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should show confirmation when closing during processing", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText("Annuler le paiement ?")).toBeInTheDocument();
      });
    });

    it("should not close modal when clicking continue in confirmation", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText("Annuler le paiement ?")).toBeInTheDocument();
      });

      const continueButton = screen.getByText("Continuer");
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Annuler le paiement ?"),
        ).not.toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it("should dismiss confirmation when X button is clicked", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText("Annuler le paiement ?")).toBeInTheDocument();
      });

      // X button dismisses confirmation (returns to payment modal)
      const xButtons = screen.getAllByLabelText("Fermer");
      const xButtonInConfirmation = xButtons[xButtons.length - 1];
      fireEvent.click(xButtonInConfirmation);

      await waitFor(() => {
        expect(
          screen.queryByText("Annuler le paiement ?"),
        ).not.toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it("should close modal when clicking annuler in confirmation", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Fermer");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText("Annuler le paiement ?")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Annuler");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should have X close button in success state that calls onClose", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Paiement réussi !")).toBeInTheDocument();
      });

      // Story 14.11: Success state must have X button
      const closeButton = screen.getByLabelText("Fermer");
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration: Full Payment Flow", () => {
    it("should complete full successful payment flow", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Initial state
      expect(screen.getByText("Passe Premium")).toBeInTheDocument();
      expect(screen.getByText("3€")).toBeInTheDocument();

      // Click pay
      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Processing state
      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      // Success state
      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText("Paiement réussi !")).toBeInTheDocument();
      });

      // Auto-close
      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  // FIX #9: Additional edge case tests
  describe("Edge Cases and Bug Fixes", () => {
    it("FIX #4: should prevent double-click payment", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);

      // Click twice rapidly
      fireEvent.click(payButton);
      fireEvent.click(payButton); // Second click should be ignored

      // Should only process once
      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      // Verify updatePremiumStatusInLocalStorage called only once
      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(
          premiumService.updatePremiumStatusInLocalStorage,
        ).toHaveBeenCalledTimes(1);
      });
    });

    it("FIX #1 & #3: should cleanup timers on unmount during processing", async () => {
      vi.mocked(premiumService.isPremium).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
      );

      const { unmount } = render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Wait for processing to start
      await waitFor(() => {
        expect(screen.getByText(/Traitement en cours/)).toBeInTheDocument();
      });

      // Unmount during processing
      unmount();

      // Fast-forward all timers
      await vi.advanceTimersByTimeAsync(20000);

      // onSuccess and onClose should NOT be called after unmount
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("FIX #6: should handle null supabase gracefully", async () => {
      // Mock supabase as null
      const originalSupabase = vi.mocked(supabase);
      vi.mocked(supabase).from = null as any;

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument();
      });

      // Restore original mock
      vi.mocked(supabase).from = originalSupabase.from;
    });

    it("FIX #7: should handle polling timeout after 10 seconds", async () => {
      // Mock isPremium to always return false (webhook never confirms)
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      // Fast-forward payment delay + full polling period (1.5s + 10s)
      await vi.advanceTimersByTimeAsync(1500 + 10000);

      await waitFor(() => {
        expect(
          screen.getByText(/n'a pas pu être confirmé/),
        ).toBeInTheDocument();
      });
    });

    it("FIX #8: should generate and log transaction ID", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<PaymentModal isOpen={true} onClose={mockOnClose} />);

      const payButton = screen.getByText(/Débloquer Premium/);
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Payment transaction started:"),
          expect.stringMatching(/^sim_\d+_/),
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
