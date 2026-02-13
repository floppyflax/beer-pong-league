import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertCircle } from 'lucide-react';

const SCANNER_FPS = 10;
const SCANNER_BOX_SIZE = 250;

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  /** Called when user chooses "Saisir le code manuellement" - closes scanner and opens code input */
  onFallbackToCodeInput?: () => void;
}

/**
 * QR Scanner Component
 * 
 * Full-screen camera scanner for reading tournament QR codes
 * Uses html5-qrcode library for QR code detection
 * 
 * Features:
 * - Camera access with permission handling
 * - Real-time QR code scanning
 * - Error handling and fallback to manual code input
 * - Mobile-optimized (uses back camera)
 */
export const QRScanner = ({ onScan, onClose, onFallbackToCodeInput }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-scanner-container';
    let scanner: Html5Qrcode | null = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        // Initialize scanner
        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        
        if (!isMounted) return;

        if (cameras.length === 0) {
          setHasPermission(false);
          setError('Aucune caméra détectée sur votre appareil.');
          return;
        }

        // Prefer back camera on mobile
        const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

        setHasPermission(true);
        setIsScanning(true);

        // Start scanning
        await scanner.start(
          cameraId,
          {
            fps: SCANNER_FPS,
            qrbox: { width: SCANNER_BOX_SIZE, height: SCANNER_BOX_SIZE },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback - QR code detected
            if (isMounted && scanner) {
              // Stop scanner immediately to save battery
              scanner.stop().then(() => {
                scanner?.clear();
                onScan(decodedText);
              }).catch((err) => {
                console.error('Error stopping scanner after scan:', err);
                onScan(decodedText);
              });
            }
          },
          (errorMessage) => {
            // Error callback - QR code not detected (not an actual error, just no QR found in frame)
            // We don't need to do anything here, scanner keeps trying
          }
        );
      } catch (err) {
        console.error('Scanner initialization error:', err);
        if (!isMounted) return;
        
        setHasPermission(false);
        setIsScanning(false);
        
        if (err instanceof Error) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission denied')) {
            setError('Accès caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.');
          } else if (err.message.includes('NotFoundError') || err.message.includes('Requested device not found')) {
            setError('Aucune caméra détectée sur votre appareil.');
          } else {
            setError('Impossible d\'accéder à la caméra. Veuillez réessayer.');
          }
        }
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      isMounted = false;
      if (scanner) {
        scanner.stop().then(() => {
          scanner?.clear();
        }).catch((err) => {
          console.error('Error stopping scanner:', err);
        });
      }
    };
  }, []); // ✓ FIXED: Empty deps - only run once on mount

  const handleClose = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    onClose();
  };

  // Fallback to code input if camera fails - close scanner and optionally open code input
  const handleFallbackToCodeInput = async () => {
    await handleClose();
    onFallbackToCodeInput?.();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <h2 className="text-lg font-bold text-white">Scanner QR Code</h2>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white transition-colors p-2"
          aria-label="Fermer le scanner"
        >
          <X size={24} />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        {hasPermission === false || error ? (
          <div className="text-center max-w-md">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <p className="text-white font-bold text-xl mb-2">Accès caméra requis</p>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={handleFallbackToCodeInput}
              className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95"
            >
              Saisir le code manuellement
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* Scanner container - html5-qrcode will inject video here */}
            <div id="qr-scanner-container" className="w-full rounded-lg overflow-hidden" />
          </div>
        )}
      </div>

      {/* Instructions */}
      {hasPermission === true && !error && (
        <div className="p-6 text-center bg-slate-800 border-t border-slate-700">
          <p className="text-slate-300 text-sm mb-2">
            Placez le QR code dans le cadre pour le scanner automatiquement
          </p>
          <p className="text-slate-500 text-xs mb-4">
            Le scan se fera automatiquement dès qu'un QR code valide est détecté
          </p>
          <button
            onClick={handleFallbackToCodeInput}
            className="text-primary hover:text-amber-600 text-sm font-medium transition-colors"
          >
            Saisir le code manuellement
          </button>
        </div>
      )}
    </div>
  );
};
