import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  FileJson,
  FileSpreadsheet,
  Ghost,
  History,
  Lock,
  Play,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

import { useLeague } from "@/context/LeagueContext";
import { useDetailPagePermissions } from "@/hooks/useDetailPagePermissions";
import { useUnclaimedGuests } from "@/hooks/useUnclaimedGuests";
import { identityMergeService } from "@/services/IdentityMergeService";
import {
  exportLeagueJSON,
  exportMatchesCSV,
  exportPlayersCSV,
} from "@/services/ExportService";
import { getLeagueLifecycle } from "@/utils/leagueLifecycle";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GhostManagementSheet } from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";

export const LeagueSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    leagues,
    events,
    updateLeague,
    deleteLeague,
    finishLeague,
    reopenLeague,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const league = leagues.find((l) => l.id === id);
  const { isAdmin } = useDetailPagePermissions(id || "", "league");

  const {
    guests: leagueGhosts,
    refresh: refreshLeagueGhosts,
  } = useUnclaimedGuests("league", id, { mode: "any" });

  const [name, setName] = useState(league?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showGhostMgmt, setShowGhostMgmt] = useState(false);

  useEffect(() => {
    if (league) setName(league.name);
  }, [league?.id]);

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Trophy}
          title="Ligue introuvable"
          description="Cette ligue n'existe pas ou a été supprimée."
          action={
            <PButton variant="primary" size="md" onClick={() => navigate("/")}>
              Retour à l&apos;accueil
            </PButton>
          }
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Lock}
          title="Accès refusé"
          description="Seul l'administrateur peut modifier les paramètres."
          action={
            <PButton
              variant="primary"
              size="md"
              onClick={() => navigate(`/league/${league.id}`)}
            >
              Retour à la ligue
            </PButton>
          }
        />
      </div>
    );
  }

  const leagueEvents = events.filter((e) => league.events?.includes(e.id));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === league.name) {
      toast("Aucun changement à enregistrer");
      return;
    }
    setIsSaving(true);
    try {
      await updateLeague(league.id, trimmed, league.type);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      console.error("Error saving league settings:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLeague = () => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette ligue ?")) return;
    deleteLeague(league.id);
    navigate("/");
  };

  // Lifecycle toggle — symétrique à EventSettings.handleFinish.
  // - finished → Réouvrir (one-tap, pas de confirm).
  // - sinon (not_started / active / paused) → Clôturer (confirm requis).
  const lifecycle = getLeagueLifecycle(league);
  const isFinishedLeague = lifecycle === "finished";
  const handleLifecycleToggle = async () => {
    try {
      if (isFinishedLeague) {
        await reopenLeague(league.id);
        toast.success("Ligue rouverte");
      } else {
        if (
          !confirm(
            "Clôturer cette ligue ? Plus aucun match ne pourra être enregistré (réversible via Réouvrir).",
          )
        )
          return;
        await finishLeague(league.id);
        toast.success("Ligue clôturée");
      }
    } catch {
      // toast d'erreur déjà émis côté context
    }
  };

  const handleRenameGhost = async (playerId: string, newPseudo: string) => {
    const result = await identityMergeService.renameAnonymousPlayer(
      "league",
      playerId,
      newPseudo,
    );
    if (!result.success) {
      toast.error(result.error || "Renommage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur renommé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleDeleteGhost = async (playerId: string) => {
    const result = await identityMergeService.deleteAnonymousPlayer(
      "league",
      playerId,
    );
    if (!result.success) {
      if (!result.error || !/match/i.test(result.error)) {
        toast.error(result.error || "Suppression impossible");
      }
      throw new Error(result.error);
    }
    toast.success("Joueur supprimé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleArchiveGhost = async (playerId: string) => {
    const result = await identityMergeService.archiveAnonymousPlayer(
      "league",
      playerId,
    );
    if (!result.success) {
      toast.error(result.error || "Archivage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur archivé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleGenerateGhostInvite = async (playerId: string) => {
    const result = await identityMergeService.generateGhostInviteToken(
      "league",
      playerId,
    );
    if (!result.success || !result.token) {
      toast.error(result.error || "Lien indisponible");
      throw new Error(result.error);
    }
    return { token: result.token };
  };

  const inputClass =
    "w-full bg-navy-deep border-[1.5px] border-card rounded-md p-3 text-white placeholder-cool-gray focus:outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition-colors";

  return (
    <div className="min-h-screen bg-navy text-white">
      <ContextualHeader
        title="Paramètres"
        showBackButton
        onBack={() => navigate(`/league/${league.id}`)}
      />

      <form
        onSubmit={handleSubmit}
        className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-32"
        noValidate
      >
        {/* Nom */}
        <div className="space-y-2">
          <label
            htmlFor="settings-name"
            className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray"
          >
            Nom de la ligue
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={inputClass}
          />
        </div>

        {/* Type (read-only) */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Type de compétition
          </span>
          <div
            className="flex items-center gap-3 p-3 rounded-card border border-card bg-navy-deep/50"
            aria-readonly="true"
          >
            <div className="w-9 h-9 rounded-md bg-electric-blue/20 text-electric-blue flex items-center justify-center">
              <Trophy size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-archivo font-extrabold uppercase tracking-tight text-sm flex items-center gap-2">
                {league.type === "one-shot"
                  ? "League Continue"
                  : "League par Saison"}
                <Lock size={12} className="text-cool-gray" />
              </div>
              <div className="text-cool-gray text-xs">
                Verrouillé — défini à la création
              </div>
            </div>
          </div>
        </div>

        {/* Historique des saisons */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            <span className="inline-flex items-center gap-1.5">
              <History size={12} />
              Historique des saisons
            </span>
          </span>
          <button
            type="button"
            onClick={() => navigate(`/league/${league.id}/seasons`)}
            className="w-full p-3 rounded-card border border-card bg-navy-deep flex items-center gap-3 hover:border-white/60 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-white font-archivo font-semibold text-sm">
                Voir les saisons passées
              </div>
              <div className="text-cool-gray text-xs">
                Classements archivés et palmarès
              </div>
            </div>
            <div className="text-cool-gray">→</div>
          </button>
        </div>

        {/* Ghost management entry */}
        {leagueGhosts.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
              <span className="inline-flex items-center gap-1.5">
                <Ghost size={12} />
                Joueurs fantômes ({leagueGhosts.length})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowGhostMgmt(true)}
              className="w-full p-3 rounded-card border border-card bg-navy-deep flex items-center gap-3 hover:border-white/60 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-archivo font-semibold text-sm">
                  Gérer les joueurs fantômes
                </div>
                <div className="text-cool-gray text-xs">
                  Renommer, supprimer, envoyer un lien d&apos;invitation
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Events */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Événements ({leagueEvents.length})
          </span>
          {leagueEvents.length > 0 ? (
            <div className="space-y-2">
              {leagueEvents.map((event) => (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="w-full bg-navy-deep p-3 rounded-card flex justify-between items-center hover:border-card-muted cursor-pointer transition-colors border border-card text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-archivo font-semibold text-white flex items-center gap-2 text-sm">
                      {event.name}
                      {event.isFinished && (
                        <span className="text-[10px] bg-lime/20 text-lime px-2 py-0.5 rounded">
                          Terminé
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {new Date(event.date).toLocaleDateString("fr-FR")} •{" "}
                      {event.matches.length} matchs
                    </div>
                  </div>
                  <div className="text-cool-gray">→</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-cool-gray text-xs">Aucun événement associé.</p>
          )}
          <PButton
            type="button"
            variant="ghost"
            size="md"
            full
            icon={<Plus size={16} />}
            onClick={() => navigate(`/create-event?leagueId=${league.id}`)}
          >
            Créer un événement
          </PButton>
        </div>

        {/* Export actions */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Exporter
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <PButton
              type="button"
              variant="ghost"
              size="md"
              full
              icon={<FileJson size={16} />}
              onClick={() => exportLeagueJSON(league)}
            >
              JSON
            </PButton>
            <PButton
              type="button"
              variant="ghost"
              size="md"
              full
              icon={<FileSpreadsheet size={16} />}
              onClick={() => exportPlayersCSV(league)}
            >
              Joueurs CSV
            </PButton>
            <PButton
              type="button"
              variant="ghost"
              size="md"
              full
              icon={<FileSpreadsheet size={16} />}
              onClick={() => {
                const map: Record<string, string> = {};
                league.players.forEach((p) => {
                  map[p.id] = p.name;
                });
                exportMatchesCSV(league, map);
              }}
            >
              Matchs CSV
            </PButton>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="fixed inset-x-0 bottom-0 bg-navy/95 backdrop-blur border-t border-card px-4 py-3 md:py-4 z-10">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PButton
                type="button"
                variant="ghost"
                size="lg"
                full
                icon={
                  isFinishedLeague ? <Play size={18} /> : <Archive size={18} />
                }
                onClick={handleLifecycleToggle}
              >
                {isFinishedLeague ? "Réouvrir la ligue" : "Clôturer la ligue"}
              </PButton>
              <PButton
                type="button"
                variant="ghost"
                size="lg"
                full
                icon={<Trash2 size={18} />}
                onClick={handleDeleteLeague}
              >
                Supprimer
              </PButton>
            </div>
            <PButton
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </PButton>
          </div>
        </div>
      </form>

      <GhostManagementSheet
        isOpen={showGhostMgmt}
        onClose={() => setShowGhostMgmt(false)}
        guests={leagueGhosts}
        joinPath={`/league/${league.id}/join`}
        onRename={handleRenameGhost}
        onDelete={handleDeleteGhost}
        onArchive={handleArchiveGhost}
        onGenerateInvite={handleGenerateGhostInvite}
      />
    </div>
  );
};

export default LeagueSettings;
