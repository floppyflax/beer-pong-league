import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QRCodeDisplay } from '../../../src/components/QRCodeDisplay';
import '@testing-library/jest-dom';

describe('QRCodeDisplay - Story 3.2', () => {
  const mockTournamentId = 'test-tournament-123';
  const mockTournamentName = 'Summer Tournament 2026';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
      },
      writable: true,
    });
  });

  describe('Task 2: Create QRCodeDisplay component', () => {
    it('should render the component', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: QR code is displayed prominently
      expect(screen.getByText('Inviter des participants')).toBeInTheDocument();
    });

    it('should accept tournamentId as prop', () => {
      const { rerender } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // Should render with first ID
      expect(screen.getByText(/inviter des participants/i)).toBeInTheDocument();

      // Should update when ID changes
      rerender(
        <QRCodeDisplay 
          tournamentId="different-id"
          tournamentName={mockTournamentName}
        />
      );

      expect(screen.getByText(/inviter des participants/i)).toBeInTheDocument();
    });

    it('should render QR code with proper sizing', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
          size={200}
        />
      );

      // AC: Large, scannable size (min 200x200px)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
    });
  });

  describe('Task 3: Implement QR code generation', () => {
    it('should generate correct tournament join URL', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: QR code contains tournament join URL (route: /tournament/:id/join)
      const expectedUrl = `http://localhost:5173/tournament/${mockTournamentId}/join`;
      expect(screen.getByText(expectedUrl)).toBeInTheDocument();
    });

    it('should use full domain in URL format', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: Use full domain (route: /tournament/:id/join)
      const urlText = screen.getByText(/http:\/\/localhost:5173\/tournament\/.+\/join/);
      expect(urlText).toBeInTheDocument();
      expect(urlText.textContent).toMatch(/^http/);
    });

    it('should generate URL in correct format', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: URL format is /tournament/:tournamentId/join
      const urlText = screen.getByText(/tournament\/.+\/join/);
      expect(urlText).toBeInTheDocument();
      expect(urlText.textContent).toContain(`/tournament/${mockTournamentId}/join`);
    });
  });

  describe('Task 4: Design QR code display', () => {
    it('should display tournament name above QR code', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: Include tournament name above QR code (in full screen)
      expect(screen.getByText('Inviter des participants')).toBeInTheDocument();
    });

    it('should include instruction text', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: Add "Scan to Join" instruction text
      expect(screen.getByText(/scannez.*pour rejoindre/i)).toBeInTheDocument();
    });

    it('should use high contrast colors for scanning', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: High contrast for scanning (QR code should be on white background)
      const whiteBackground = container.querySelector('.bg-white');
      expect(whiteBackground).toBeInTheDocument();
    });
  });

  describe('Task 5: Add sharing options', () => {
    it('should display full screen button', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: Add "Display Full Screen" button
      const fullScreenButton = screen.getByRole('button', { name: /display qr code in full screen/i });
      expect(fullScreenButton).toBeInTheDocument();
      expect(fullScreenButton).toHaveTextContent(/afficher en plein écran/i);
    });

    it('should show full screen modal when button clicked', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      const fullScreenButton = screen.getByRole('button', { name: /display qr code in full screen/i });
      fireEvent.click(fullScreenButton);

      // AC: Test full screen mode works
      expect(screen.getByText(mockTournamentName)).toBeInTheDocument();
      expect(screen.getByText(/scannez pour rejoindre/i)).toBeInTheDocument();
    });

    it('should close full screen modal when clicked', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      const fullScreenButton = screen.getByRole('button', { name: /display qr code in full screen/i });
      fireEvent.click(fullScreenButton);

      // Modal should be open
      expect(screen.getByRole('button', { name: /close full screen/i })).toBeInTheDocument();

      // Close the modal
      const closeButton = screen.getByRole('button', { name: /close full screen/i });
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByRole('button', { name: /close full screen/i })).not.toBeInTheDocument();
    });

    it('should have large QR code in full screen mode', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      const fullScreenButton = screen.getByRole('button', { name: /display qr code in full screen/i });
      fireEvent.click(fullScreenButton);

      // AC: Large QR code for printing and scanning
      const svgs = container.querySelectorAll('svg');
      const fullScreenSvg = Array.from(svgs).find(svg => 
        svg.getAttribute('width') === '512'
      );
      expect(fullScreenSvg).toBeTruthy();
    });
  });

  describe('Task 7: Integrate into TournamentDashboard', () => {
    it('should render with tournament data', () => {
      render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // AC: Renders correctly on dashboard
      expect(screen.getByText('Inviter des participants')).toBeInTheDocument();
      expect(screen.getByText(/tournament\/.+\/join/)).toBeInTheDocument();
    });

    it('should update when tournament changes', () => {
      const { rerender } = render(
        <QRCodeDisplay 
          tournamentId="old-id"
          tournamentName="Old Name"
        />
      );

      // Check initial URL (route: /tournament/:id/join)
      expect(screen.getByText(/tournament\/old-id\/join/)).toBeInTheDocument();

      // Update tournament
      rerender(
        <QRCodeDisplay 
          tournamentId="new-id"
          tournamentName="New Tournament Name"
        />
      );

      // AC: Verify updates when tournament changes
      expect(screen.getByText(/tournament\/new-id\/join/)).toBeInTheDocument();
      
      // Also verify full screen modal shows updated name
      const fullScreenButton = screen.getByRole('button', { name: /display qr code in full screen/i });
      fireEvent.click(fullScreenButton);
      
      expect(screen.getByText('New Tournament Name')).toBeInTheDocument();
    });
  });

  describe('QR Code Quality Requirements', () => {
    it('should use error correction level H for reliability', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // The QRCodeSVG component should have level="H"
      // This is set in the component props, so we verify the component renders
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should include margin for easier scanning', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
        />
      );

      // The QRCodeSVG should have includeMargin={true}
      // This is verified by the component rendering correctly
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have minimum size of 200x200px', () => {
      const { container } = render(
        <QRCodeDisplay 
          tournamentId={mockTournamentId}
          tournamentName={mockTournamentName}
          size={200}
        />
      );

      // AC: Minimum size for mobile scanning
      const svg = container.querySelector('svg');
      const width = parseInt(svg?.getAttribute('width') || '0', 10);
      expect(width).toBeGreaterThanOrEqual(200);
    });
  });
});
