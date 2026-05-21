/**
 * InviteSheet — Bottom sheet "Inviter des joueurs"
 *
 * S'ouvre depuis le bas en mobile (slide-up), centré sur desktop.
 * Deux tabs (masqués s'il n'y a qu'un seul mode dispo) :
 *
 *  1. **Partager** — QR code + Code événement + bouton Partager natif
 *     (Web Share API), fallback copie dans le presse-papier. Actif uniquement
 *     si `shareData` est fourni (ex: Event avec `joinCode`).
 *
 *  2. **Ajouter** — Deux modes combinés dans un seul tab :
 *     - Sélection d'un joueur depuis la ligue rattachée (si `leaguePlayers`
 *       non vide).
 *     - Saisie manuelle d'un pseudo (`onAddManual`).
 *
 * Pour League : pas de `shareData`, pas de `leaguePlayers` → le sheet affiche
 * uniquement le formulaire de saisie.
 */

import { QRCodeSVG } from "qrcode.react";
import { Share2, UserPlus, X, Copy, Check, Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "react-hot-toast";
import { SegmentedTabs } from "./SegmentedTabs";

export interface InviteSheetShareData {
  /** Code court à afficher (ex: "PG1847"). Optionnel. */
  joinCode?: string;
  /** URL encodée dans le QR code et partagée. */
  joinUrl: string;
  /** Titre passé à `navigator.share` (fallback clipboard). */
  shareTitle: string;
  /** Texte passé à `navigator.share`. */
  shareText: string;
}

export interface InviteSheetLeaguePlayer {
  id: string;
  name: string;
  /** ELO affiché à droite du chip (optionnel). */
  elo?: number;
  /** URL d'avatar (optionnel) — sinon initiale. */
  avatarUrl?: string | null;
}

export interface InviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Titre du sheet (ex: "Inviter"). */
  title?: ReactNode;
  /** Données de partage (QR + code + bouton Partager). Omis si indispo. */
  shareData?: InviteSheetShareData;
  /** Joueurs de la ligue (pour le picker multi-select). Omis si pas de ligue. */
  leaguePlayers?: InviteSheetLeaguePlayer[];
  /** Callback : ajouter un joueur manuellement (saisie d'un pseudo). */
  onAddManual?: (name: string) => void | Promise<void>;
  /**
   * Callback : ajouter en bulk N joueurs de la ligue (multi-select).
   * Reçoit la liste des `id` (= league_memberships.id) sélectionnés.
   */
  onAddFromLeagueBulk?: (playerIds: string[]) => void | Promise<void>;
  /**
   * Nombre maximum de joueurs supplémentaires que l'event peut accepter
   * (ex: maxPlayers - currentParticipants). `undefined` = pas de limite.
   * Si défini : on bloque l'ajout au-delà et on affiche un message.
   */
  remainingSlots?: number;
}

type InviteTab = "share" | "add";

export const InviteSheet = ({
  isOpen,
  onClose,
  title = "Nouveau Joueur",
  shareData,
  leaguePlayers = [],
  onAddManual,
  onAddFromLeagueBulk,
  remainingSlots,
}: InviteSheetProps) => {
  const hasShare = Boolean(shareData);
  const hasAdd = Boolean(onAddManual || onAddFromLeagueBulk);
  const hasBothTabs = hasShare && hasAdd;

  const [activeTab, setActiveTab] = useState<InviteTab>(
    hasShare ? "share" : "add",
  );
  const [manualName, setManualName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset state each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(hasShare ? "share" : "add");
      setManualName("");
      setSelectedIds(new Set());
      setSearchQuery("");
      setIsSubmittingBulk(false);
    }
  }, [isOpen, hasShare]);

  // Filter league players by search query.
  const filteredLeaguePlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaguePlayers;
    return leaguePlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [leaguePlayers, searchQuery]);

  const showSearch = leaguePlayers.length >= 8;
  const canAddMore =
    remainingSlots === undefined || remainingSlots > selectedIds.size;
  const exceedsLimit =
    remainingSlots !== undefined && selectedIds.size > remainingSlots;

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleShare = async () => {
    if (!shareData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.shareTitle,
          text: shareData.shareText,
          url: shareData.joinUrl,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.joinUrl);
        toast.success("Lien copié !");
      } catch {
        toast.error("Impossible de partager le lien");
      }
    }
  };

  const handleCopyCode = async () => {
    if (!shareData?.joinCode) return;
    try {
      await navigator.clipboard.writeText(shareData.joinCode);
      toast.success("Code copié !");
    } catch {
      toast.error("Impossible de copier le code");
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(shareData.joinUrl);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleSubmitManual = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualName.trim();
    if (!trimmed || !onAddManual) return;
    await onAddManual(trimmed);
    setManualName("");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitBulk = async () => {
    if (selectedIds.size === 0 || !onAddFromLeagueBulk) return;
    if (exceedsLimit) return;
    setIsSubmittingBulk(true);
    try {
      await onAddFromLeagueBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-sheet-title"
    >
      <div
        ref={sheetRef}
        className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[66dvh] md:max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header — titre centré + croix overlay à droite */}
        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id="invite-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[17px] tracking-[-0.3px]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs (hidden if only one section) — DS SegmentedTabs encapsulated */}
        {hasBothTabs && (
          <div className="px-5 pb-3">
            <SegmentedTabs
              variant="encapsulated"
              tabs={[
                { id: "share", label: "Inviter" },
                { id: "add", label: "Ajouter" },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as InviteTab)}
            />
          </div>
        )}

        {/* Content — grid stack quand 2 tabs (évite tout resize entre tabs).
            Les deux panels occupent la même zone grid ; seul l'actif est opaque. */}
        <div
          className={`px-5 pb-6 overflow-y-auto ${hasBothTabs ? "pt-5 grid [grid-template-areas:'stack']" : ""}`}
        >
          {/* --- Share tab --- */}
          {hasShare && shareData && (
            <div
              role="tabpanel"
              aria-hidden={hasBothTabs && activeTab !== "share"}
              className={`flex flex-col items-center gap-5 ${
                hasBothTabs
                  ? `[grid-area:stack] transition-opacity duration-150 ${
                      activeTab === "share"
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`
                  : ""
              }`}
            >
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG
                  value={shareData.joinUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {shareData.joinCode && (
                <div className="text-center">
                  <div className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                    Code
                  </div>
                  <div className="mt-1 font-archivo font-black text-white text-[32px] tracking-[6px]">
                    {shareData.joinCode}
                  </div>
                </div>
              )}

              <div className="w-full flex flex-col gap-2 mt-auto">
                {/* Secondary actions row: Copier code / Copier lien */}
                <div className="flex gap-2">
                  {shareData.joinCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex-1 h-11 rounded-full border-2 border-white/30 text-white font-archivo font-extrabold uppercase text-[11px] tracking-[1px] flex items-center justify-center gap-2 hover:bg-white/10 transition"
                    >
                      <Copy size={14} />
                      <span>Code</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 h-11 rounded-full border-2 border-white/30 text-white font-archivo font-extrabold uppercase text-[11px] tracking-[1px] flex items-center justify-center gap-2 hover:bg-white/10 transition"
                  >
                    <Copy size={14} />
                    <span>Lien</span>
                  </button>
                </div>

                {/* Primary CTA: Partager (en bas) */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full h-12 rounded-full bg-ping-yellow text-navy font-archivo font-extrabold uppercase text-[12px] tracking-[1px] flex items-center justify-center gap-2 hover:brightness-110 transition"
                >
                  <Share2 size={16} />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          )}

          {/* --- Add tab --- */}
          {hasAdd && (
            <div
              role="tabpanel"
              aria-hidden={hasBothTabs && activeTab !== "add"}
              className={`flex flex-col gap-5 ${
                hasBothTabs
                  ? `[grid-area:stack] transition-opacity duration-150 ${
                      activeTab === "add"
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`
                  : ""
              }`}
            >
              {onAddFromLeagueBulk && leaguePlayers.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                      Depuis la ligue
                    </span>
                    <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                      {leaguePlayers.length} dispo
                      {leaguePlayers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {showSearch && (
                    <div className="mt-2 relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Chercher un joueur…"
                        aria-label="Filtrer les joueurs de la ligue"
                        className="w-full h-10 bg-navy-deep border border-card rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-cool-gray/60 focus:outline-none focus:ring-2 focus:ring-electric-blue/40"
                      />
                    </div>
                  )}

                  <div
                    role="listbox"
                    aria-label="Joueurs de la ligue"
                    aria-multiselectable="true"
                    className="mt-2 flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1"
                  >
                    {filteredLeaguePlayers.length === 0 && (
                      <p className="text-cool-gray text-xs text-center py-4">
                        Aucun joueur ne correspond.
                      </p>
                    )}
                    {filteredLeaguePlayers.map((p) => {
                      const selected = selectedIds.has(p.id);
                      const initial = p.name.charAt(0).toUpperCase() || "?";
                      const disabled =
                        !selected && !canAddMore;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => toggleSelected(p.id)}
                          disabled={disabled}
                          className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-colors ${
                            selected
                              ? "border-electric-blue bg-electric-blue/15"
                              : "border-card bg-navy-deep hover:border-card-muted"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-navy-soft border border-card flex items-center justify-center flex-shrink-0">
                              <span className="font-archivo font-extrabold text-white text-xs">
                                {initial}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-archivo font-extrabold uppercase text-white text-sm tracking-tight truncate">
                              {p.name}
                            </div>
                            {p.elo !== undefined && (
                              <div className="text-cool-gray text-[11px] font-mono">
                                ELO {p.elo}
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected
                                ? "border-electric-blue bg-electric-blue"
                                : "border-cool-gray/40"
                            }`}
                            aria-hidden="true"
                          >
                            {selected && (
                              <Check size={12} className="text-navy" strokeWidth={3} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {remainingSlots !== undefined && remainingSlots <= 0 && (
                    <p className="mt-2 text-signal-red text-xs">
                      Limite de joueurs atteinte pour cet événement.
                    </p>
                  )}
                  {remainingSlots !== undefined &&
                    remainingSlots > 0 &&
                    !canAddMore && (
                      <p className="mt-2 text-cool-gray text-xs">
                        Maximum {remainingSlots} ajout
                        {remainingSlots > 1 ? "s" : ""} en une fois.
                      </p>
                    )}

                  <button
                    type="button"
                    onClick={handleSubmitBulk}
                    disabled={
                      selectedIds.size === 0 ||
                      exceedsLimit ||
                      isSubmittingBulk
                    }
                    className="mt-3 w-full h-12 rounded-full bg-lime text-navy font-archivo font-extrabold uppercase text-[11px] tracking-[1px] hover:bg-lime-deep transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <UserPlus size={14} />
                    <span>
                      {selectedIds.size === 0
                        ? "Sélectionne des joueurs"
                        : `Ajouter ${selectedIds.size} joueur${
                            selectedIds.size > 1 ? "s" : ""
                          }`}
                    </span>
                  </button>
                </div>
              )}

              {onAddFromLeagueBulk &&
                leaguePlayers.length === 0 &&
                onAddManual && (
                  <p className="text-cool-gray text-xs text-center">
                    Tous les joueurs de la ligue sont déjà dans cet
                    événement.
                  </p>
                )}

              {onAddFromLeagueBulk &&
                leaguePlayers.length > 0 &&
                onAddManual && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-card" />
                    <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray">
                      ou
                    </span>
                    <div className="flex-1 h-px bg-card" />
                  </div>
                )}

              {onAddManual && (
                <form onSubmit={handleSubmitManual}>
                  <label
                    htmlFor="invite-manual-input"
                    className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray"
                  >
                    Nouveau joueur
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="invite-manual-input"
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Pseudo du joueur"
                      maxLength={50}
                      className="flex-1 h-12 bg-navy-deep border border-card rounded-xl px-3 text-white placeholder:text-cool-gray/60 focus:outline-none focus:ring-2 focus:ring-electric-blue/40"
                      autoFocus={!hasShare}
                    />
                    <button
                      type="submit"
                      disabled={!manualName.trim()}
                      className="h-12 px-5 rounded-full bg-lime text-navy font-archivo font-extrabold uppercase text-[11px] tracking-[1px] hover:bg-lime-deep transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      <UserPlus size={14} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
