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
  // Mi5 · Sol5 · Do6 — accord majeur, montée positive.
  const notes = [659.25, 783.99, 1046.5];
  for (let i = 0; i < notes.length; i++) {
    const t = now + i * 0.09;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[i];
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.48);
  }
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
