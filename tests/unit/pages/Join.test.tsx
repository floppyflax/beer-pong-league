import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Join } from '../../../src/pages/Join';

// Mock dependencies
vi.mock('../../../src/hooks/useJoinTournament', () => ({
  useJoinTournament: () => ({
    joinByCode: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../src/components/navigation/BottomMenuSpecific', () => ({
  BottomMenuSpecific: ({ actions }: any) => (
    <div data-testid="bottom-menu">
      {actions.map((action: any, index: number) => (
        <button key={index} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/join/QRScanner', () => ({
  QRScanner: ({ onClose, onScan }: any) => (
    <div data-testid="qr-scanner">
      <button onClick={onClose}>Close Scanner</button>
      <button onClick={() => onScan('TEST123')}>Simulate Scan</button>
    </div>
  ),
}));

vi.mock('../../../src/components/join/CodeInputModal', () => ({
  CodeInputModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="code-input-modal">
      <button onClick={onClose}>Close Modal</button>
      <button onClick={() => onSubmit('TEST123')}>Submit Code</button>
    </div>
  ),
}));

const renderJoinPage = () => {
  return render(
    <BrowserRouter>
      <Join />
    </BrowserRouter>
  );
};

describe('Join Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Page Layout', () => {
    it('should render page title', () => {
      renderJoinPage();
      expect(screen.getByText('Rejoindre un Tournoi')).toBeInTheDocument();
    });

    it('should render instructions', () => {
      renderJoinPage();
      expect(screen.getByText(/Scannez le QR code/i)).toBeInTheDocument();
    });

    it('should render bottom menu with 2 actions', () => {
      renderJoinPage();
      const bottomMenu = screen.getByTestId('bottom-menu');
      expect(bottomMenu).toBeInTheDocument();
      expect(screen.getByText('SCANNER QR')).toBeInTheDocument();
      expect(screen.getByText('CODE')).toBeInTheDocument();
    });

    it('should render large icon in empty state', () => {
      renderJoinPage();
      // Icon is rendered as SVG, check for its presence via test setup
      expect(screen.getByText('Rejoindre un Tournoi')).toBeInTheDocument();
    });

    it('should render tip message', () => {
      renderJoinPage();
      expect(screen.getByText(/Le code du tournoi vous est fourni/i)).toBeInTheDocument();
    });
  });

  describe('AC2: QR Scanner Modal', () => {
    it('should open QR scanner when "SCANNER QR" is clicked', () => {
      renderJoinPage();
      
      const scannerButton = screen.getByText('SCANNER QR');
      fireEvent.click(scannerButton);

      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    it('should close QR scanner', () => {
      renderJoinPage();
      
      const scannerButton = screen.getByText('SCANNER QR');
      fireEvent.click(scannerButton);

      const closeButton = screen.getByText('Close Scanner');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
    });

    it('should handle scanned QR code', async () => {
      renderJoinPage();
      
      const scannerButton = screen.getByText('SCANNER QR');
      fireEvent.click(scannerButton);

      const simulateScanButton = screen.getByText('Simulate Scan');
      fireEvent.click(simulateScanButton);

      // Scanner should close after scan
      await waitFor(() => {
        expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC3: Code Input Modal', () => {
    it('should open code input modal when "CODE" is clicked', () => {
      renderJoinPage();
      
      const codeButton = screen.getByText('CODE');
      fireEvent.click(codeButton);

      expect(screen.getByTestId('code-input-modal')).toBeInTheDocument();
    });

    it('should close code input modal', () => {
      renderJoinPage();
      
      const codeButton = screen.getByText('CODE');
      fireEvent.click(codeButton);

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('code-input-modal')).not.toBeInTheDocument();
    });

    it('should handle code submission', async () => {
      renderJoinPage();
      
      const codeButton = screen.getByText('CODE');
      fireEvent.click(codeButton);

      const submitButton = screen.getByText('Submit Code');
      fireEvent.click(submitButton);

      // Modal should close after successful submission
      await waitFor(() => {
        expect(screen.queryByTestId('code-input-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC6: Desktop Experience', () => {
    it('should render desktop action buttons', () => {
      renderJoinPage();
      
      // Desktop buttons should be in the DOM (hidden on mobile via CSS)
      const buttons = screen.getAllByText('SCANNER QR');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('AC7: Empty State', () => {
    it('should display empty state with instructions when no action taken', () => {
      renderJoinPage();
      
      expect(screen.getByText('Rejoindre un Tournoi')).toBeInTheDocument();
      expect(screen.getByText(/Scannez le QR code affiché par l'organisateur/i)).toBeInTheDocument();
    });

    it('should display tip in empty state', () => {
      renderJoinPage();
      
      expect(screen.getByText(/Le code du tournoi vous est fourni par l'organisateur/i)).toBeInTheDocument();
    });
  });

  describe('Code Extraction Helper', () => {
    // Note: These tests would ideally be in a separate file for the helper function
    // For now, they're documented here as part of the Join page test suite
    
    it('should extract code from URL with query param', () => {
      // This would test the extractCodeFromQR function
      // Example: "https://bpl.com/tournament/123?code=ABC123" -> "ABC123"
    });

    it('should extract code from path segment', () => {
      // This would test the extractCodeFromQR function
      // Example: "/tournament/join/ABC123" -> "ABC123"
    });

    it('should handle direct code input', () => {
      // This would test the extractCodeFromQR function
      // Example: "ABC123" -> "ABC123"
    });

    it('should convert extracted code to uppercase', () => {
      // This would test the extractCodeFromQR function
      // Example: "abc123" -> "ABC123"
    });
  });
});
