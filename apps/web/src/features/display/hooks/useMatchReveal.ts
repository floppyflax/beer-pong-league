import { useEffect, useRef, useState } from "react";
import type { Match } from "@/types";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import { isAudioReady, playChime, unlockAudio } from "../sound";

export type RevealPhase = "idle" | "alert" | "reveal";

export interface MatchReveal {
  phase: RevealPhase;
  /** true pendant l'alerte → flou de l'arrière-plan. */
  blur: boolean;
  /** Match affiché dans l'alerte plein écran (phase "alert"). */
  alertMatch: Match | null;
  /** Ordre du classement affiché (gelé hors reveal, committé au reveal). */
  committedPlayers: DisplaySourcePlayer[];
  /** Protagonistes en surbrillance (union gagnants + perdants). */
  highlightedPlayerIds: Set<string>;
  /** Vainqueurs du dernier match → brillance verte. */
  winnerIds: Set<string>;
  /** Perdants du dernier match → brillance rouge. */
  loserIds: Set<string>;
  /** Joueur sur lequel le classement doit scroller pendant la visite. */
  focusedPlayerId: string | null;
  /** Match qui clignote dans le panneau "Derniers matchs". */
  blinkMatchId: string | null;
  /** Séquence en cours → DisplayShell met en pause la rotation + force le Classement. */
  active: boolean;
  soundOn: boolean;
  audioArmed: boolean;
}

const ALERT_MS = 3_500;
/** On affiche d'abord le classement AVANT (ancien ordre) ce temps, puis on
 *  anime vers les nouvelles positions. */
const PRE_REVEAL_HOLD_MS = 3_000;
const VISIT_STEP_MS = 1_900;
const END_HOLD_MS = 1_400;

function byRank(
  ids: string[],
  players: DisplaySourcePlayer[],
): string[] {
  return ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is DisplaySourcePlayer => !!p)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => p.id);
}

/**
 * Calcule les deltas de transition (places gagnées/perdues + ELO gagné/perdu)
 * en comparant le nouvel ordre à l'ordre AFFICHÉ avant le match.
 *
 * Indépendant de `match.eloChanges` (souvent vide en local / non garanti) : on
 * lit directement le rang et l'ELO de chaque joueur avant vs après. Comme le
 * snapshot reste gelé jusqu'au prochain match, ces deltas persistent à l'écran
 * pour tous les joueurs concernés (y compris ceux dépassés sans avoir joué).
 */
export function withTransitionDeltas(
  next: DisplaySourcePlayer[],
  before: DisplaySourcePlayer[] | null,
): DisplaySourcePlayer[] {
  if (!before || before.length === 0) return next;
  const beforeById = new Map(before.map((p) => [p.id, p]));
  return next.map((p) => {
    const prev = beforeById.get(p.id);
    if (!prev) return p; // nouveau joueur : pas de point de comparaison
    const rankDelta = prev.rank - p.rank; // >0 = a gagné des places
    const eloDelta = p.elo - prev.elo;
    return {
      ...p,
      // ▲/▼ pour tout mouvement (y compris un non-joueur dépassé) ; "=" (0)
      // uniquement pour un joueur qui A JOUÉ (eloDelta≠0) mais a gardé son rang.
      rankDelta: rankDelta !== 0 ? rankDelta : eloDelta !== 0 ? 0 : undefined,
      eloDelta: eloDelta !== 0 ? eloDelta : undefined,
    };
  });
}

/**
 * Orchestre toute la séquence d'arrivée d'un nouveau match en mode diffusion :
 *
 * 1. **alert** (~3.5s) : flou de l'arrière-plan + alerte plein écran clignotante
 *    "NOUVEAU MATCH" + résultat + sonnerie.
 * 2. **reveal** : retour au Classement (déflouté), commit du nouvel ordre (les
 *    lignes glissent), surbrillance vert/rouge des protagonistes, puis **visite
 *    séquentielle** : on scrolle sur chaque vainqueur (du mieux classé au moins
 *    bien) puis chaque perdant, un par un.
 * 3. **idle** : reprise du slideshow.
 *
 * Tout est consolidé ici (une seule détection de nouveau match) pour éviter des
 * séquences concurrentes. Vit dans le DisplayShell (persiste entre les scènes).
 */
export function useMatchReveal(source: DisplaySource | null): MatchReveal {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [blur, setBlur] = useState(false);
  const [alertMatch, setAlertMatch] = useState<Match | null>(null);
  const [committedPlayers, setCommittedPlayers] = useState<
    DisplaySourcePlayer[] | null
  >(null);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [winnerIds, setWinnerIds] = useState<Set<string>>(new Set());
  const [loserIds, setLoserIds] = useState<Set<string>>(new Set());
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [blinkMatchId, setBlinkMatchId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  // Préférence son persistée localStorage → reste cohérente quand l'écran
  // diffuse en boucle ou qu'on alterne event/league. Par défaut ACTIVÉ.
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const v = window.localStorage.getItem("display:soundOn");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const [audioArmed, setAudioArmed] = useState(false);

  // Persiste la pref son.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("display:soundOn", soundOn ? "1" : "0");
    } catch {
      // localStorage indispo (mode privé Safari) — on continue sans persister.
    }
  }, [soundOn]);

  const initializedRef = useRef(false);
  const lastSeenRef = useRef<string | null>(null);
  const sourceRef = useRef<DisplaySource | null>(source);
  sourceRef.current = source;
  // Ordre actuellement affiché (gelé) → référence pour les deltas de transition.
  const committedPlayersRef = useRef<DisplaySourcePlayer[] | null>(null);
  committedPlayersRef.current = committedPlayers;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // Armement audio au 1er geste (politique autoplay des navigateurs). On
  // élargit à tous les événements user plausibles sur un écran de diffusion
  // (un simple bougé de souris suffit), avec `once: true` pour ne pas
  // spammer le listener.
  useEffect(() => {
    const arm = () => {
      unlockAudio();
      setAudioArmed(isAudioReady());
    };
    const events: (keyof WindowEventMap)[] = [
      "keydown",
      "pointerdown",
      "pointermove",
      "wheel",
      "touchstart",
      "click",
    ];
    const opts: AddEventListenerOptions = { once: true, passive: true };
    events.forEach((ev) => window.addEventListener(ev, arm, opts));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, arm, opts));
    };
  }, []);

  // Toggle son (touche M).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") setSoundOn((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Détection d'un nouveau match — sans réordonner le classement en arrière-plan.
  useEffect(() => {
    if (!source) return;
    const latest = source.matches[0]?.id ?? null;
    if (!initializedRef.current) {
      // Attendre que les joueurs soient chargés pour ne pas geler un snapshot vide.
      if (source.players.length === 0) return;
      initializedRef.current = true;
      lastSeenRef.current = latest;
      setCommittedPlayers(source.players);
      return;
    }
    if (latest && latest !== lastSeenRef.current) {
      lastSeenRef.current = latest;
      setPendingMatchId(latest);
      setBlinkMatchId(latest);
    }
  }, [source]);

  // Extinction du clignotement du match dans le panneau.
  useEffect(() => {
    if (!blinkMatchId) return;
    const t = setTimeout(() => setBlinkMatchId(null), 8_000);
    return () => clearTimeout(t);
  }, [blinkMatchId]);

  // Séquence complète, déclenchée par un match en attente.
  useEffect(() => {
    if (!pendingMatchId) return;
    const src = sourceRef.current;
    const match = src?.matches.find((m) => m.id === pendingMatchId);
    if (!src || !match) {
      setPendingMatchId(null);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    // 1) ALERTE : flou + alerte clignotante + sonnerie.
    setPhase("alert");
    setBlur(true);
    setAlertMatch(match);
    if (soundOnRef.current) playChime();

    // 2) REVEAL : retour au Classement, on montre d'abord l'ancien ordre +
    // surbrillance verte/rouge des protagonistes (le classement "avant").
    at(ALERT_MS, () => {
      const s = sourceRef.current;
      if (!s) return;
      setPhase("reveal");
      setBlur(false);
      setAlertMatch(null);

      // Ordre AFFICHÉ avant le match (gelé) → référence pour calculer les
      // places gagnées/perdues et l'ELO gagné/perdu de chaque joueur.
      const beforeOrder = committedPlayersRef.current ?? s.players;

      const winnerA = match.scoreA > match.scoreB;
      const winners = winnerA ? match.teamA : match.teamB;
      const losers = winnerA ? match.teamB : match.teamA;
      setWinnerIds(new Set(winners));
      setLoserIds(new Set(losers));
      setHighlightedPlayerIds(new Set([...winners, ...losers]));
      // committedPlayers reste l'ANCIEN ordre (gelé) → on voit le classement avant.

      // 3) Après le hold : commit du nouvel ordre avec deltas de transition
      // (places + ELO, calculés avant→après) → les lignes glissent vers leurs
      // nouvelles positions (auto-animate) et les badges/deltas apparaissent.
      at(PRE_REVEAL_HOLD_MS, () => {
        const cur = sourceRef.current;
        if (cur)
          setCommittedPlayers(withTransitionDeltas(cur.players, beforeOrder));
      });

      // 4) VISITE séquentielle (après le morph) : vainqueurs (mieux classés
      // d'abord) puis perdants.
      const order = [...byRank(winners, s.players), ...byRank(losers, s.players)];
      order.forEach((pid, i) => {
        at(PRE_REVEAL_HOLD_MS + 400 + i * VISIT_STEP_MS, () =>
          setFocusedPlayerId(pid),
        );
      });

      // 5) Fin : recommit (au cas où la source se soit stabilisée tard, ex.
      // event qui recharge ses participants) puis reprise du slideshow. Les
      // deltas restent affichés jusqu'au prochain match.
      at(
        PRE_REVEAL_HOLD_MS + 400 + order.length * VISIT_STEP_MS + END_HOLD_MS,
        () => {
          const cur = sourceRef.current;
          if (cur)
            setCommittedPlayers(withTransitionDeltas(cur.players, beforeOrder));
          setFocusedPlayerId(null);
          setHighlightedPlayerIds(new Set());
          setWinnerIds(new Set());
          setLoserIds(new Set());
          setPhase("idle");
          setPendingMatchId(null);
        },
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [pendingMatchId]);

  return {
    phase,
    blur,
    alertMatch,
    committedPlayers: committedPlayers ?? source?.players ?? [],
    highlightedPlayerIds,
    winnerIds,
    loserIds,
    focusedPlayerId,
    blinkMatchId,
    active: phase !== "idle",
    soundOn,
    audioArmed,
  };
}
