/**
 * GhostManagementSheet — admin-only sheet to manage ghost players.
 *
 * Lists every unclaimed (anonymous) player in a event/league and exposes
 * three per-row actions:
 *
 *   - **Renommer** — inline edit, calls back `onRename(playerId, newPseudo)`.
 *   - **Lien d'invitation** — generates a `?ghost=TOKEN` URL via the parent's
 *     `onGenerateInvite(playerId)`, then displays the QR + copy/share UI.
 *   - **Supprimer** — confirms, then calls `onDelete(playerId)`. The parent
 *     handles the "blocked because matches were played" toast.
 *
 * Like the other sheets in the system, this is purely presentational —
 * persistence, RPCs and toasts live in the parent. The component only owns
 * the per-row UI state (which row is being renamed, which has its invite
 * panel open, which is pending).
 */

import { useEffect, useMemo, useState } from "react";
import { Users, Pencil, Trash2, Share2, X, Copy, Loader2, Check, Archive, ArchiveRestore, ShieldCheck, ShieldOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import type { UnclaimedGuest } from "../../hooks/useUnclaimedGuests";

export interface GhostManagementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Active (non-archived) ghosts. */
  guests: UnclaimedGuest[];
  /** Archived ghosts — listed in the "archivés" view with an Unarchive action. */
  archivedGuests?: UnclaimedGuest[];
  /** Origin URL used to build invite links (defaults to window.location.origin). */
  origin?: string;
  /** Path prefix for the join page (e.g. "/event/<id>/join" or "/league/<id>/join"). */
  joinPath: string;
  /** Rename a ghost. Resolve to apply, throw to keep editor open. */
  onRename: (playerId: string, newPseudo: string) => Promise<void>;
  /**
   * Delete a ghost. Resolve to remove from list. Reject with an Error whose
   * message contains "match" (case-insensitive) to trigger the silent archive
   * fallback — the server blocks delete when the ghost has played matches,
   * so we archive instead and surface a single toast.
   */
  onDelete: (playerId: string) => Promise<void>;
  /**
   * Archive (soft-delete) a ghost — hides from future pickers but keeps
   * existing matches. Surfaced as a direct per-row action and as the
   * automatic fallback when delete is blocked.
   */
  onArchive: (playerId: string) => Promise<void>;
  /**
   * Restore an archived ghost back to the active list. Optional — if absent,
   * the archived view shows ghosts read-only.
   */
  onUnarchive?: (playerId: string) => Promise<void>;
  /** Generate an invite token. Returns the raw token (caller assembles URL). */
  onGenerateInvite: (playerId: string) => Promise<{ token: string }>;
  /**
   * Mig 037 — Promote / demote a member to/from co-admin. Pass the membership
   * id + the desired role. Resolve to apply, throw to keep UI in place. Only
   * shown when defined AND `isOwnerViewing` is true (only the creator can
   * change roles). Hidden on ghost rows.
   */
  onSetAdminRole?: (playerId: string, role: 'admin' | 'member') => Promise<void>;
  /**
   * True if the user viewing this sheet is the context creator (not a
   * co-admin). Co-admins can manage players but cannot promote/demote others —
   * cf. server-side check in `set_*_membership_role`.
   */
  isOwnerViewing?: boolean;
  /** Optional title override. */
  title?: string;
}

interface InviteState {
  playerId: string;
  url: string;
}

export function GhostManagementSheet({
  isOpen,
  onClose,
  guests,
  archivedGuests = [],
  origin,
  joinPath,
  onRename,
  onDelete,
  onArchive,
  onUnarchive,
  onGenerateInvite,
  onSetAdminRole,
  isOwnerViewing = false,
  title = "Joueurs",
}: GhostManagementSheetProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteState | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");

  const baseOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : "");

  // Reset all transient state when the sheet closes.
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditingValue("");
      setPendingId(null);
      setInvite(null);
      setView("active");
    }
  }, [isOpen]);

  // Escape closes (unless an action is pending).
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pendingId) return;
      if (invite) {
        setInvite(null);
        return;
      }
      if (editingId) {
        setEditingId(null);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, pendingId, invite, editingId]);

  const handleStartRename = (g: UnclaimedGuest) => {
    setEditingId(g.playerId);
    setEditingValue(g.pseudo);
  };

  const handleConfirmRename = async (playerId: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.error("Le pseudo ne peut pas être vide");
      return;
    }
    if (trimmed.length > 100) {
      toast.error("Pseudo trop long (max 100)");
      return;
    }
    setPendingId(playerId);
    try {
      await onRename(playerId, trimmed);
      setEditingId(null);
      setEditingValue("");
    } catch {
      // Parent already toasted; keep editor open so user can retry.
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (g: UnclaimedGuest) => {
    if (
      !confirm(
        `Retirer "${g.pseudo}" ? S'il a déjà joué des matchs, il sera archivé ` +
          `(matchs et ELO conservés). Sinon, supprimé définitivement.`,
      )
    )
      return;
    setPendingId(g.playerId);
    try {
      await onDelete(g.playerId);
    } catch (err) {
      // Server blocks delete when matches exist — fall back to archive
      // automatically, without a second confirm.
      const msg = err instanceof Error ? err.message : "";
      if (/match/i.test(msg)) {
        try {
          await onArchive(g.playerId);
        } catch {
          // Parent toasts.
        }
      }
      // Other errors already toasted by the parent.
    } finally {
      setPendingId(null);
    }
  };

  const handleUnarchive = async (g: UnclaimedGuest) => {
    if (!onUnarchive) return;
    setPendingId(g.playerId);
    try {
      await onUnarchive(g.playerId);
    } catch {
      // Parent toasts.
    } finally {
      setPendingId(null);
    }
  };

  const handleArchive = async (g: UnclaimedGuest) => {
    if (
      !confirm(
        `Archiver "${g.pseudo}" ? Il ne pourra plus être ajouté à de nouveaux matchs, ` +
          `mais les matchs existants restent inchangés.`,
      )
    )
      return;
    setPendingId(g.playerId);
    try {
      await onArchive(g.playerId);
    } catch {
      // Parent toasts.
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleAdmin = async (g: UnclaimedGuest) => {
    if (!onSetAdminRole) return;
    const nextRole: 'admin' | 'member' = g.role === 'admin' ? 'member' : 'admin';
    const confirmMsg = nextRole === 'admin'
      ? `Promouvoir "${g.pseudo}" en co-admin ? Il pourra gérer ce contexte (paramètres, joueurs, scores) mais pas le supprimer.`
      : `Retirer "${g.pseudo}" des admins ? Il redeviendra un joueur normal.`;
    if (!confirm(confirmMsg)) return;
    setPendingId(g.playerId);
    try {
      await onSetAdminRole(g.playerId, nextRole);
    } catch {
      // Parent toasts.
    } finally {
      setPendingId(null);
    }
  };

  const handleGenerateInvite = async (g: UnclaimedGuest) => {
    setPendingId(g.playerId);
    try {
      const { token } = await onGenerateInvite(g.playerId);
      const url = `${baseOrigin}${joinPath}?ghost=${encodeURIComponent(token)}`;
      setInvite({ playerId: g.playerId, url });
    } catch {
      // Parent toasts.
    } finally {
      setPendingId(null);
    }
  };

  const handleCopyInvite = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleShareInvite = async () => {
    if (!invite) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins l'événement",
          text: "Voici ton lien pour réclamer ton joueur.",
          url: invite.url,
        });
      } catch {
        // User cancelled or share failed — silent.
      }
    } else {
      handleCopyInvite();
    }
  };

  const inviteGuest = useMemo(
    () => (invite ? guests.find((g) => g.playerId === invite.playerId) : null),
    [invite, guests],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pendingId) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ghost-mgmt-sheet-title"
    >
      <div
        className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id="ghost-mgmt-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[15px] tracking-[-0.3px] text-center px-8 flex items-center gap-2"
          >
            <Users size={16} className="text-cool-gray" />
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={!!pendingId}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 overflow-y-auto">
          {invite && inviteGuest ? (
            // Invite panel — replaces the list while open.
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setInvite(null)}
                className="text-[12px] text-cool-gray hover:text-white transition-colors"
              >
                ← Retour à la liste
              </button>
              <div className="text-center">
                <div className="text-cool-gray text-[12px] mb-1">
                  Lien d'invitation pour
                </div>
                <div className="text-white font-archivo font-extrabold uppercase text-[14px]">
                  {inviteGuest.pseudo}
                </div>
              </div>
              <div className="bg-white p-4 rounded-card flex items-center justify-center">
                <QRCodeSVG value={invite.url} size={180} />
              </div>
              <div className="bg-navy/60 rounded-xl border border-card px-3 py-2.5 flex items-center gap-2">
                <code className="text-[11px] text-cool-gray font-mono truncate flex-1">
                  {invite.url}
                </code>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Copier le lien"
                >
                  <Copy size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleShareInvite}
                className="w-full h-11 rounded-full bg-electric-blue text-navy font-archivo font-extrabold uppercase text-[12px] tracking-[1px] flex items-center justify-center gap-2 hover:brightness-110 transition"
              >
                <Share2 size={14} />
                Partager
              </button>
              <p className="text-cool-gray text-[11px] text-center">
                Lien valide 30 jours, usage unique. La personne qui l'ouvre
                récupère automatiquement ce joueur.
              </p>
            </div>
          ) : view === "archived" ? (
            <>
              <p className="text-cool-gray text-[13px] mb-4 text-center">
                Joueurs archivés. Désarchive pour les rendre à nouveau
                disponibles dans les pickers de match.
              </p>

              {archivedGuests.length === 0 ? (
                <div className="text-center py-6 text-cool-gray text-[13px]">
                  Aucun joueur archivé.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {archivedGuests.map((g) => {
                    const isPending = pendingId === g.playerId;
                    const isOtherPending = !!pendingId && !isPending;
                    return (
                      <li
                        key={g.playerId}
                        className="bg-navy/60 rounded-xl border border-card px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-archivo font-bold text-[14px] truncate opacity-70">
                              {g.pseudo}
                            </div>
                            <div className="text-cool-gray text-[10px] uppercase tracking-widest font-mono">
                              Archivé
                            </div>
                          </div>
                          {onUnarchive && (
                            <button
                              type="button"
                              onClick={() => handleUnarchive(g)}
                              disabled={isOtherPending || isPending}
                              className="h-9 px-3 rounded-full bg-electric-blue/15 hover:bg-electric-blue/25 text-electric-blue flex items-center gap-1.5 text-[11px] font-archivo font-extrabold uppercase tracking-[0.5px] transition-colors disabled:opacity-40"
                              aria-label={`Désarchiver ${g.pseudo}`}
                            >
                              {isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ArchiveRestore size={14} />
                              )}
                              Désarchiver
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setView("active")}
                disabled={!!pendingId}
                className="mt-4 w-full h-10 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray text-[12px] font-archivo font-extrabold uppercase tracking-[0.5px] flex items-center justify-center transition-colors disabled:opacity-40"
              >
                ← Retour aux actifs
              </button>
            </>
          ) : (
            <>
              <p className="text-cool-gray text-[13px] mb-4 text-center">
                Retire ou archive un joueur de ce contexte. Le renommage et le
                lien d'invitation sont réservés aux joueurs fantômes (ajoutés
                manuellement, sans compte).
                {isOwnerViewing && onSetAdminRole && (
                  <>
                    <br />
                    <span className="text-electric-blue/80">
                      Promouvoir un joueur en co-admin lui donne les mêmes
                      droits que toi, sauf la suppression.
                    </span>
                  </>
                )}
              </p>

              {guests.length === 0 ? (
                <div className="text-center py-6 text-cool-gray text-[13px]">
                  Aucun joueur à gérer.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {guests.map((g) => {
                    const isEditing = editingId === g.playerId;
                    const isPending = pendingId === g.playerId;
                    const isOtherPending = !!pendingId && !isPending;
                    return (
                      <li
                        key={g.playerId}
                        className="bg-navy/60 rounded-xl border border-card px-3 py-2.5"
                      >
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleConfirmRename(g.playerId);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1 bg-navy border border-card rounded-input px-3 py-2 text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-electric-blue/40"
                              autoFocus
                              maxLength={100}
                              disabled={isPending}
                            />
                            <button
                              type="submit"
                              disabled={isPending || !editingValue.trim()}
                              className="w-9 h-9 rounded-full bg-electric-blue text-navy flex items-center justify-center disabled:opacity-50"
                              aria-label="Confirmer"
                            >
                              {isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingValue("");
                              }}
                              disabled={isPending}
                              className="w-9 h-9 rounded-full bg-white/5 text-cool-gray hover:bg-white/10 flex items-center justify-center disabled:opacity-50"
                              aria-label="Annuler"
                            >
                              <X size={14} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-archivo font-bold text-[14px] truncate flex items-center gap-1.5">
                                {g.pseudo}
                                {g.role === 'admin' && (
                                  <ShieldCheck
                                    size={13}
                                    className="text-electric-blue flex-shrink-0"
                                    aria-label="Co-admin"
                                  />
                                )}
                              </div>
                              <div className="text-cool-gray text-[10px] uppercase tracking-widest font-mono">
                                {g.role === 'admin'
                                  ? 'Co-admin'
                                  : g.isGhost
                                    ? 'Fantôme'
                                    : 'Compte'}
                              </div>
                            </div>
                            {/* Mig 037 — promote/demote, owner only, on accounts only. */}
                            {isOwnerViewing && onSetAdminRole && !g.isGhost && (
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(g)}
                                disabled={isOtherPending || isPending}
                                className={
                                  g.role === 'admin'
                                    ? 'w-9 h-9 rounded-full bg-ping-yellow/10 hover:bg-ping-yellow/20 text-ping-yellow flex items-center justify-center transition-colors disabled:opacity-40'
                                    : 'w-9 h-9 rounded-full bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue flex items-center justify-center transition-colors disabled:opacity-40'
                                }
                                aria-label={
                                  g.role === 'admin'
                                    ? `Retirer ${g.pseudo} des admins`
                                    : `Promouvoir ${g.pseudo} en co-admin`
                                }
                                title={
                                  g.role === 'admin'
                                    ? 'Retirer des admins'
                                    : 'Promouvoir en co-admin'
                                }
                              >
                                {isPending ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : g.role === 'admin' ? (
                                  <ShieldOff size={14} />
                                ) : (
                                  <ShieldCheck size={14} />
                                )}
                              </button>
                            )}
                            {g.isGhost && (
                              <button
                                type="button"
                                onClick={() => handleGenerateInvite(g)}
                                disabled={isOtherPending || isPending}
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray flex items-center justify-center transition-colors disabled:opacity-40"
                                aria-label={`Lien d'invitation pour ${g.pseudo}`}
                              >
                                {isPending ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Share2 size={14} />
                                )}
                              </button>
                            )}
                            {g.isGhost && (
                              <button
                                type="button"
                                onClick={() => handleStartRename(g)}
                                disabled={isOtherPending || isPending}
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray flex items-center justify-center transition-colors disabled:opacity-40"
                                aria-label={`Renommer ${g.pseudo}`}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleArchive(g)}
                              disabled={isOtherPending || isPending}
                              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray flex items-center justify-center transition-colors disabled:opacity-40"
                              aria-label={`Archiver ${g.pseudo}`}
                              title="Archiver (conserve les matchs joués)"
                            >
                              <Archive size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(g)}
                              disabled={isOtherPending || isPending}
                              className="w-9 h-9 rounded-full bg-signal-red/10 hover:bg-signal-red/20 text-signal-red flex items-center justify-center transition-colors disabled:opacity-40"
                              aria-label={`Supprimer ${g.pseudo}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {archivedGuests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView("archived")}
                  disabled={!!pendingId}
                  className="mt-4 w-full h-10 rounded-full bg-white/5 hover:bg-white/10 text-cool-gray text-[12px] font-archivo font-extrabold uppercase tracking-[0.5px] flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <Archive size={14} />
                  Voir archivés ({archivedGuests.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
