/**
 * Petit synthétiseur Web Audio pour la sonnerie d'arrivée d'un match en mode
 * diffusion. Pas d'asset audio à charger : un arpège montant synthétisé.
 *
 * Politique autoplay : l'AudioContext ne peut démarrer que dans un geste
 * utilisateur. On l'arme au 1er geste (cf. `unlockAudio`). Si jamais armé,
 * `playChime` est un no-op silencieux (le feedback visuel reste).
 */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function getCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor })
      .webkitAudioContext ??
    null
  );
}

/** Crée/reprend l'AudioContext. À appeler depuis un handler de geste. */
export function unlockAudio(): void {
  const Ctor = getCtor();
  if (!Ctor) return;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function isAudioReady(): boolean {
  return !!ctx && ctx.state === "running";
}

function emitChime(audioCtx: AudioContext): void {
  const now = audioCtx.currentTime;
  const note = (
    freq: number,
    start: number,
    dur: number,
    peak = 0.16,
    type: OscillatorType = "triangle",
  ) => {
    const t = now + start;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  };

  // Fanfare festive (~1.5s) : montée Do majeur → petit rebond → accord final brillant.
  const G4 = 392, C5 = 523.25, E5 = 659.25, G5 = 783.99;
  const C6 = 1046.5, E6 = 1318.51, G6 = 1567.98;
  note(G4, 0.0, 0.16);
  note(C5, 0.1, 0.16);
  note(E5, 0.2, 0.16);
  note(G5, 0.3, 0.18);
  note(C6, 0.42, 0.24, 0.18);
  // rebond joueur
  note(E6, 0.58, 0.14, 0.14);
  note(C6, 0.68, 0.14, 0.14);
  // accord final tenu (triade Do majeur)
  note(C6, 0.84, 0.75, 0.12);
  note(E6, 0.84, 0.75, 0.11);
  note(G6, 0.84, 0.75, 0.1);
}

/**
 * Joue un arpège montant court (~0.6s), volume modéré. Tente de reprendre
 * l'AudioContext s'il a été suspendu (onglet revenu au premier plan). No-op
 * si l'audio n'a jamais été armé (aucun geste utilisateur).
 */
export function playChime(): void {
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx
      .resume()
      .then(() => {
        if (ctx) emitChime(ctx);
      })
      .catch(() => {
        /* autoplay bloqué — silencieux */
      });
    return;
  }
  if (ctx.state === "running") emitChime(ctx);
}
