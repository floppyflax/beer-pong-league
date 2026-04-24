import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, ChevronLeft } from "lucide-react";
import { QRScanner } from "@/components/join/QRScanner";
import { useJoinTournament } from "@/hooks/useJoinTournament";
import { extractCodeFromQR } from "@/utils/extractCodeFromQR";
import { PButton } from "@/components/ponglo/PButton";
import { StickyCTA } from "@/components/design-system";

const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-Z0-9]{6,8}$/;

export const Join = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { joinByCode } = useJoinTournament();

  const handleCodeChange = (value: string) => {
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setCode(filtered);
  };

  const handleSubmit = async () => {
    if (!CODE_REGEX.test(code) || isJoining) return;
    setIsJoining(true);
    try {
      await joinByCode(code);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la jonction à l'événement";
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleScanCode = async (scannedCode: string) => {
    setShowScanner(false);
    const extracted = extractCodeFromQR(scannedCode);
    if (!extracted) {
      toast.error("QR invalide. Saisis le code manuellement.");
      inputRef.current?.focus();
      return;
    }
    setCode(extracted.toUpperCase());
    setIsJoining(true);
    try {
      await joinByCode(extracted);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la jonction à l'événement";
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const isValid = CODE_REGEX.test(code);

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* Top nav */}
      <div className="flex items-center gap-2.5 px-[18px] pt-6 pb-3.5">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="w-9 h-9 rounded-full border-[1.5px] border-card flex items-center justify-center hover:bg-navy-soft transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px]">
          Rejoindre
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-[160px] flex flex-col">
        {/* Headline */}
        <h1
          className="font-archivo font-black uppercase text-white"
          style={{
            fontSize: 34,
            lineHeight: 0.95,
            letterSpacing: "-1.2px",
            textWrap: "balance",
          }}
        >
          Scanne le QR
          <br />
          ou tape le code.
        </h1>

        {/* Scanner CTA card */}
        <button
          onClick={() => setShowScanner(true)}
          className="mt-6 relative w-full aspect-square bg-white rounded-xl p-5 flex items-center justify-center overflow-hidden group"
          aria-label="Ouvrir le scanner QR"
        >
          {/* deco QR pattern */}
          <div
            className="absolute inset-5 rounded-md bg-navy grid pointer-events-none"
            style={{
              gridTemplateColumns: "repeat(21, 1fr)",
              gap: 1,
            }}
            aria-hidden
          >
            {Array.from({ length: 441 }).map((_, i) => {
              const r = Math.floor(i / 21);
              const c = i % 21;
              const corner =
                (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
              const cornerCenter =
                corner &&
                ((r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                  (r >= 2 && r <= 4 && c >= 16 && c <= 18) ||
                  (r >= 16 && r <= 18 && c >= 2 && c <= 4));
              const cornerRing =
                corner &&
                !cornerCenter &&
                ((r === 1 || r === 5 || c === 1 || c === 5) ||
                  (r === 1 || r === 5 || c === 15 || c === 19) ||
                  (r === 15 || r === 19));
              const fill =
                cornerCenter ||
                cornerRing ||
                ((i * 7 + r * c) % 3 === 0);
              return (
                <span
                  key={i}
                  className={fill ? "bg-white" : ""}
                  style={{ borderRadius: 1 }}
                />
              );
            })}
          </div>
          {/* center badge: camera */}
          <div className="relative z-10 w-16 h-16 rounded-md bg-navy flex items-center justify-center shadow-card">
            <Camera size={32} className="text-white" />
          </div>
          <span className="absolute bottom-3 left-0 right-0 text-center font-archivo font-bold uppercase text-[12px] tracking-[1px] text-navy">
            Ouvrir le scanner
          </span>
        </button>

        {/* separator */}
        <div className="text-center mt-4 font-mono text-xs text-cool-gray uppercase tracking-[1px]">
          — ou —
        </div>

        {/* Code input (6 slots, driven by hidden input) */}
        <div className="mt-3">
          <label
            htmlFor="tournament-code"
            className="block font-mono text-[10px] tracking-[1.5px] uppercase text-cool-gray mb-2"
          >
            Code d'accès
          </label>
          <div
            className="relative"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              id="tournament-code"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) handleSubmit();
              }}
              className="absolute inset-0 opacity-0 w-full h-full"
              aria-label="Code de l'événement (6 à 8 caractères)"
              maxLength={8}
              disabled={isJoining}
            />
            <div className="flex gap-2">
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const ch = code[i] ?? "";
                const isFocused = code.length === i;
                return (
                  <div
                    key={i}
                    className={`flex-1 aspect-[0.8] bg-navy-soft rounded-md flex items-center justify-center font-archivo font-black text-[28px] text-white border-2 transition-colors ${
                      isFocused
                        ? "border-electric-blue"
                        : ch
                          ? "border-card"
                          : "border-card-muted"
                    }`}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      {/* Sticky bottom CTA — DS primitive */}
      <StickyCTA>
        <PButton
          variant="primary"
          size="lg"
          full
          onClick={handleSubmit}
          disabled={!isValid || isJoining}
        >
          {isJoining ? "Vérification…" : "Rejoindre l'événement"}
        </PButton>
      </StickyCTA>

      {showScanner && (
        <QRScanner
          onScan={handleScanCode}
          onClose={() => setShowScanner(false)}
          onFallbackToCodeInput={() => {
            setShowScanner(false);
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
