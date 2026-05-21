import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { DisplayShell } from "../features/display/DisplayShell";
import { useEventDisplaySource } from "../features/display/hooks/useEventDisplaySource";

/**
 * Mode diffusion d'un event (plein écran TV / projecteur).
 *
 * Wrapper mince qui :
 * - délègue le rendu à `DisplayShell` alimenté par `useEventDisplaySource`,
 * - garde la variante historique `?variant=drama` (split-screen score géant)
 *   pour rétro-compat — elle sera absorbée en `LiveMatchScene` en PR2.
 */
export const EventDisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant");

  if (variant === "drama") {
    return <DramaVariant id={id} />;
  }

  return <SplitVariant id={id} />;
};

function SplitVariant({ id }: { id?: string }) {
  const source = useEventDisplaySource(id);
  return <DisplayShell source={source} />;
}

function DramaVariant({ id }: { id?: string }) {
  const { events, leagues } = useLeague();
  const navigate = useNavigate();

  const event = events.find((t) => t.id === id);
  const league = event?.leagueId
    ? leagues.find((l) => l.id === event.leagueId)
    : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(`/event/${id}`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id, navigate]);

  if (!event) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p>Événement introuvable.</p>
      </div>
    );
  }

  const recentMatches = [...event.matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const liveMatch = recentMatches[0];

  const getPlayerName = (playerId: string): string => {
    if (league) {
      const leaguePlayer = league.players.find((p) => p.id === playerId);
      return leaguePlayer?.name || "Joueur";
    }
    return "Joueur";
  };

  const teamANames = liveMatch
    ? liveMatch.teamA.map((pid) => getPlayerName(pid)).join(" & ")
    : "Équipe A";
  const teamBNames = liveMatch
    ? liveMatch.teamB.map((pid) => getPlayerName(pid)).join(" & ")
    : "Équipe B";
  const scoreA = liveMatch?.scoreA ?? 0;
  const scoreB = liveMatch?.scoreB ?? 0;

  return (
    <div className="h-screen w-screen bg-white text-navy overflow-hidden relative select-none fixed inset-0 font-sans">
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-0 w-[60%] h-full bg-signal-red"
          style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
        />
        <div
          className="absolute top-0 right-0 w-[60%] h-full bg-electric-blue"
          style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
      </div>
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center px-10 py-5 justify-between">
          <div className="font-archivo font-extrabold uppercase tracking-tight text-navy text-lg">
            Beer Pong ELO
          </div>
          <div className="text-center font-mono text-[11px] tracking-[0.2em] uppercase opacity-80">
            <span className="text-lime font-bold">● LIVE</span> · {event.name}
          </div>
          <span className="font-mono text-xs">
            {new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex-1 grid grid-cols-2 items-center">
          <div className="px-10 pb-10 text-center">
            <div className="font-mono text-[10px] tracking-[0.3em] opacity-60 mb-5">
              ÉQUIPE A
            </div>
            <div
              className="font-archivo font-black text-navy"
              style={{
                fontSize: 220,
                lineHeight: 1,
                letterSpacing: "-8px",
                textShadow: "0 4px 40px rgba(0,0,0,0.3)",
              }}
            >
              {scoreA}
            </div>
            <div className="font-archivo font-black text-2xl uppercase tracking-tight mt-3 text-navy">
              {teamANames}
            </div>
          </div>
          <div className="px-10 pb-10 text-center">
            <div className="font-mono text-[10px] tracking-[0.3em] opacity-60 mb-5">
              ÉQUIPE B
            </div>
            <div
              className="font-archivo font-black text-navy"
              style={{
                fontSize: 220,
                lineHeight: 1,
                letterSpacing: "-8px",
                textShadow: "0 4px 40px rgba(0,0,0,0.3)",
              }}
            >
              {scoreB}
            </div>
            <div className="font-archivo font-black text-2xl uppercase tracking-tight mt-3 text-navy">
              {teamBNames}
            </div>
          </div>
        </div>
        <div className="px-10 py-3.5 bg-black/35 flex justify-between font-mono text-xs tracking-wider uppercase">
          <span>
            Code ·{" "}
            <span className="text-lime font-bold">
              {event.joinCode || "—"}
            </span>
          </span>
          <span className="opacity-70">{event.matches.length} matchs joués</span>
          <span className="opacity-70">Appuyez sur ESC pour quitter</span>
        </div>
      </div>
    </div>
  );
}
