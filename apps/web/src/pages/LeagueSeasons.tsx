/**
 * LeagueSeasons — historique des saisons closes d'une league.
 *
 * Lit `league_season_archives` via `databaseService.loadLeagueSeasonArchives`
 * et affiche pour chaque saison archivée : header (numéro, dates, nb matchs),
 * podium top-3 + leaderboard depuis le snapshot JSONB.
 *
 * Accessible depuis le menu du `LeagueDashboard` ("Historique des saisons").
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { History, ChevronLeft, Trophy } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";
import { databaseService } from "@/services/DatabaseService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Podium } from "@/components/ponglo/Podium";
import { PButton } from "@/components/ponglo/PButton";
import { PlayerCard } from "@/components/design-system/PlayerCard";
import type { LeagueSeasonArchive } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

export const LeagueSeasons = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leagues } = useLeague();
  const league = useMemo(() => leagues.find((l) => l.id === id), [leagues, id]);

  const [archives, setArchives] = useState<LeagueSeasonArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    databaseService
      .loadLeagueSeasonArchives(id)
      .then((rows) => {
        if (!cancelled) setArchives(rows);
      })
      .catch((err) => {
        console.error("Error loading season archives:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  const currentSeasonNumber = league.currentSeasonNumber ?? 1;
  const currentSeasonStartedAt = league.currentSeasonStartedAt ?? league.createdAt;

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Header */}
      <div className="-mx-4 -mt-4 md:mx-0 md:mt-0 bg-electric-blue px-4 pt-6 pb-5">
        <button
          type="button"
          onClick={() => navigate(`/league/${league.id}`)}
          className="flex items-center gap-1 text-white/90 hover:text-white text-sm font-bold uppercase tracking-widest mb-3"
        >
          <ChevronLeft size={18} />
          Retour
        </button>
        <div className="flex items-center gap-2 mb-1">
          <History size={20} className="text-ping-yellow" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/80">
            Historique des saisons
          </span>
        </div>
        <h1 className="font-archivo font-extrabold text-2xl text-white leading-tight">
          {league.name}
        </h1>
      </div>

      <div className="px-4 py-5 space-y-5 pb-bottom-nav lg:pb-bottom-nav-lg">
        {/* Saison en cours — info card */}
        <section className="rounded-card border border-card bg-navy-soft p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime">
              Saison en cours
            </div>
            <div className="text-xs text-cool-gray">
              démarrée le {formatDate(currentSeasonStartedAt)}
            </div>
          </div>
          <div className="font-archivo font-extrabold text-xl text-white">
            Saison {currentSeasonNumber}
          </div>
          <div className="text-sm text-cool-gray mt-1">
            Le classement et les ELO actuels sont visibles sur la page de la ligue.
          </div>
        </section>

        {/* Archives */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size={32} />
          </div>
        ) : archives.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucune saison archivée"
            description="Quand l'admin démarrera une nouvelle saison, le classement actuel sera archivé ici."
          />
        ) : (
          <div className="space-y-5">
            {archives.map((archive) => {
              const top3 = archive.rankings.slice(0, 3).map((r) => ({
                id: r.player_id,
                name: r.pseudo,
                elo: r.elo,
              }));
              const rest = archive.rankings.slice(3);
              return (
                <section
                  key={archive.id}
                  className="rounded-card border border-card bg-navy-soft p-4 space-y-3"
                  data-testid="season-archive"
                >
                  <header className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-archivo font-extrabold text-lg text-white">
                      Saison {archive.seasonNumber}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {formatDate(archive.startedAt)} → {formatDate(archive.endedAt)} ·{" "}
                      {archive.matchCount} match
                      {archive.matchCount > 1 ? "s" : ""}
                    </div>
                  </header>
                  {archive.rankings.length >= 3 ? (
                    <Podium top3={top3} />
                  ) : null}
                  {rest.length > 0 && (
                    <div className="space-y-1.5">
                      {rest.map((row) => (
                        <PlayerCard
                          key={row.player_id}
                          variant="leaderRow"
                          name={row.pseudo}
                          elo={row.elo}
                          rank={row.rank}
                          wins={row.wins}
                          losses={row.losses}
                        />
                      ))}
                    </div>
                  )}
                  {archive.rankings.length === 0 && (
                    <div className="text-sm text-cool-gray italic">
                      Aucun joueur classé à la clôture de cette saison.
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
