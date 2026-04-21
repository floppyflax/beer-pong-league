import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QRScanner } from '../../../src/components/join/QRScanner';
import { Html5Qrcode } from 'html5-qrcode';

// Mock html5-qrcode
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn()
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
}));

describe('QRScanner', () => {
  const mockOnScan = vi.fn();
  const mockOnClose = vi.fn();
  let mockScannerInstance: any;

  beforeEach(() => {
    // Reset mocks
    mockOnScan.mockClear();
    mockOnClose.mockClear();

    // Create mock scanner instance
    mockScannerInstance = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    };

    // Mock Html5Qrcode constructor
    (Html5Qrcode as any).mockImplementation(function(this: any) {
      return mockScannerInstance;
    });

    // Mock Html5Qrcode.getCameras
    (Html5Qrcode as any).getCameras = vi.fn().mockResolvedValue([
      { id: 'camera1', label: 'Front Camera' },
      { id: 'camera2', label: 'Back Camera' },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render scanner header', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Scanner QR Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fermer le scanner/i)).toBeInTheDocument();
  });

  it('should initialize scanner on mount', async () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(Html5Qrcode).toHaveBeenCalledWith('qr-scanner-container');
    });

    await waitFor(() => {
      expect((Html5Qrcode as any).getCameras).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockScannerInstance.start).toHaveBeenCalled();
    });
  });

  it('should use back camera when multiple cameras available', async () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockScannerInstance.start).toHaveBeenCalledWith(
        'camera2', // Back camera (last in array)
        expect.objectContaining({
          fps: 10,
          qrbox: { width: 250, height: 250 },
        }),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should call onScan when QR code is detected', async () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    // Wait for scanner to start
    await waitFor(() => {
      expect(mockScannerInstance.start).toHaveBeenCalled();
    });

    // Get the success callback (3rd argument to start())
    const successCallback = mockScannerInstance.start.mock.calls[0][2];
    
    // Simulate QR code detection
    successCallback('ABC123');

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('ABC123');
    });
  });

  it('should stop scanner after successful scan', async () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockScannerInstance.start).toHaveBeenCalled();
    });

    const successCallback = mockScannerInstance.start.mock.calls[0][2];
    successCallback('TEST99');

    await waitFor(() => {
      expect(mockScannerInstance.stop).toHaveBeenCalled();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /fermer/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display error when no cameras are found', async () => {
    // Mock no cameras
    (Html5Qrcode as any).getCameras = vi.fn().mockResolvedValue([]);

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Aucune caméra détectée/i)).toBeInTheDocument();
    });
  });

  it('should display error when camera permission is denied', async () => {
    // Mock permission denied error
    const permissionError = new Error('NotAllowedError: Permission denied');
    mockScannerInstance.start.mockRejectedValue(permissionError);

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Accès caméra refusé/i)).toBeInTheDocument();
    });
  });

  it('should stop scanner on unmount', async () => {
    const { unmount } = render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockScannerInstance.start).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(mockScannerInstance.stop).toHaveBeenCalled();
    });
  });

  it('should render scanner container element', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />);
    
    const scannerContainer = document.getElementById('qr-scanner-container');
    expect(scannerContainer).toBeInTheDocument();
  });
});
