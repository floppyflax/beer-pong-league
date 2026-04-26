import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check } from "lucide-react";
import { Sheet } from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";

export interface WebcamCaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export function WebcamCaptureSheet({ isOpen, onClose, onCapture }: WebcamCaptureSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
      } catch (err) {
        const name = (err as { name?: string } | null)?.name;
        if (name === "NotAllowedError") {
          setError("Accès à la caméra refusé. Autorise-le dans les paramètres du navigateur.");
        } else if (name === "NotFoundError") {
          setError("Aucune caméra détectée sur cet appareil.");
        } else {
          setError("Impossible d'accéder à la caméra.");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const video = videoRef.current;
      if (video) video.srcObject = null;
      setSnapshot(null);
      setError(null);
    };
  }, [isOpen]);

  const handleSnap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    if (size === 0) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Effet miroir (comportement selfie)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handleRetake = () => setSnapshot(null);

  const handleValidate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(blob);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Prendre une photo" maxWidth="md">
      <div className="flex flex-col gap-4">
        <div className="aspect-square w-full rounded-card overflow-hidden bg-navy-deep relative">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-signal-red text-sm p-4 text-center">
              {error}
            </div>
          ) : snapshot ? (
            <img src={snapshot} alt="Aperçu de la photo" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {!error && (
          <div className="flex flex-col gap-2">
            {snapshot ? (
              <>
                <PButton
                  variant="primary"
                  size="md"
                  full
                  icon={<Check size={18} />}
                  onClick={handleValidate}
                >
                  Utiliser cette photo
                </PButton>
                <PButton
                  variant="ghost"
                  size="md"
                  full
                  icon={<RefreshCw size={18} />}
                  onClick={handleRetake}
                >
                  Reprendre
                </PButton>
              </>
            ) : (
              <PButton
                variant="primary"
                size="md"
                full
                icon={<Camera size={18} />}
                onClick={handleSnap}
              >
                Capturer
              </PButton>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
