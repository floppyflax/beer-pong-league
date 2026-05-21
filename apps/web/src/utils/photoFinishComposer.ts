/**
 * photoFinishComposer — pure function de composition Canvas du collage
 * Photo Finish au format Instagram Story (1080 × 1920).
 *
 * Pas d'effets de bord externes (DOM-only, pas de fetch, pas de state).
 * L'appelant doit fournir des `HTMLImageElement` déjà chargés (les `Image`
 * doivent avoir résolu leur `decode()`/`onload` avant l'appel — un mini
 * helper `loadImage()` est exporté pour faciliter ça).
 *
 * Tokens couleurs : copie locale des valeurs Tailwind « Everything ELO »
 * (apps/web/tailwind.config.js). Toute modification de la palette doit
 * être propagée ici manuellement — pas de chemin direct entre Tailwind
 * config et Canvas.
 */

const COLORS = {
  navy: '#0B1320',
  navyDeep: '#070C16',
  navySoft: '#141D2F',
  white: '#F4F6FA',
  coolGray: '#A8B0C0',
  lime: '#B7FF3B',
  limeDeep: '#8BCC1F',
  electricBlue: '#2F6BFF',
  signalRed: '#FF3B3B',
  pingYellow: '#FFD400',
} as const;

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

export interface TeamSummary {
  label: string;
  players: { name: string; avatarUrl?: string | null }[];
}

export interface PhotoFinishCollageInput {
  winnerPhoto: HTMLImageElement;
  loserPhoto: HTMLImageElement | null;
  winnerTeam: TeamSummary;
  loserTeam: TeamSummary;
  /** Avatars are optional — passed pre-loaded for parity with photos. */
  winnerAvatars?: HTMLImageElement[];
  loserAvatars?: HTMLImageElement[];
  score: { winner: number; loser: number };
  cupsRemaining?: number | null;
  contextLabel?: string;
  /** ISO date string (defaults to now). */
  date?: string;
}

/**
 * Load an image from a URL or a blob URL. Resolves once decoded.
 * Returns `null` for empty URLs so callers can pass `match.photo_url`
 * without a guard.
 */
export async function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Wait for the Tailwind fonts (Teko, Sora) to be available so Canvas text
 * doesn't fall back to system-ui mid-render. Safe to call even if FontFace
 * API is unavailable.
 */
async function ensureFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) return;
  try {
    await document.fonts.ready;
  } catch {
    /* swallow — we render with whatever's available */
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const srcRatio = img.width / img.height;
  const dstRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (srcRatio > dstRatio) {
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Format the date as "21 mai 2026" in French.
 */
function formatDateFr(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function drawTeamPanel(
  ctx: CanvasRenderingContext2D,
  opts: {
    photo: HTMLImageElement;
    team: TeamSummary;
    avatars: HTMLImageElement[];
    x: number;
    y: number;
    width: number;
    height: number;
    isWinner: boolean;
  },
): void {
  const { photo, team, avatars, x, y, width, height, isWinner } = opts;

  const radius = 36;

  // Photo (clipped to rounded rect)
  ctx.save();
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  drawImageCover(ctx, photo, x, y, width, height);
  if (!isWinner) {
    ctx.fillStyle = 'rgba(7, 12, 22, 0.45)'; // navy-deep overlay → reads as "muted"
    ctx.fillRect(x, y, width, height);
  }
  ctx.restore();

  // Frame
  ctx.lineWidth = isWinner ? 10 : 4;
  ctx.strokeStyle = isWinner ? COLORS.lime : 'rgba(168, 176, 192, 0.55)'; // cool-gray
  if (isWinner) {
    ctx.shadowColor = 'rgba(183, 255, 59, 0.55)';
    ctx.shadowBlur = 40;
  }
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Team label badge (top-left)
  const badgeText = isWinner ? '🏆 VAINQUEUR' : 'PERDANT';
  ctx.font = '700 28px "Sora", system-ui, sans-serif';
  const badgePadX = 24;
  const badgePadY = 14;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeWidth = badgeMetrics.width + badgePadX * 2;
  const badgeHeight = 56;
  const badgeX = x + 24;
  const badgeY = y + 24;
  ctx.fillStyle = isWinner ? COLORS.lime : 'rgba(7, 12, 22, 0.85)';
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();
  ctx.fillStyle = isWinner ? COLORS.navyDeep : COLORS.white;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, badgeX + badgePadX, badgeY + badgeHeight / 2 + 1);
  void badgePadY;

  // Player names — single line, top of panel under badge
  const nameText = team.players.map((p) => p.name).join(' & ');
  ctx.font = '800 38px "Sora", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.white;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  // Truncate at panel width minus padding
  const maxNameWidth = width - 48;
  let displayed = nameText;
  while (ctx.measureText(displayed).width > maxNameWidth && displayed.length > 1) {
    displayed = displayed.slice(0, -2) + '…';
  }
  ctx.fillText(displayed, x + 24, y + height - 48);
  ctx.shadowBlur = 0;

  // Avatars row (bottom-left, above name) — small circles
  if (avatars.length > 0) {
    const avatarSize = isWinner ? 64 : 48;
    const gap = 12;
    const avatarsY = y + height - 48 - 32 - avatarSize;
    avatars.forEach((avatar, i) => {
      const ax = x + 24 + i * (avatarSize + gap);
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax + avatarSize / 2, avatarsY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, ax, avatarsY, avatarSize, avatarSize);
      ctx.restore();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isWinner ? COLORS.lime : 'rgba(168, 176, 192, 0.7)';
      ctx.beginPath();
      ctx.arc(ax + avatarSize / 2, avatarsY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}

function drawHeader(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.lime;
  ctx.font = '900 84px "Teko", "Sora", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PHOTO FINISH', CANVAS_WIDTH / 2, 110);

  ctx.font = '500 28px "Sora", system-ui, sans-serif';
  ctx.fillStyle = COLORS.coolGray;
  ctx.fillText('BEER PONG ELO', CANVAS_WIDTH / 2, 170);
}

function drawScore(
  ctx: CanvasRenderingContext2D,
  score: { winner: number; loser: number },
  cupsRemaining: number | null | undefined,
  centerY: number,
): void {
  const text = `${score.winner} – ${score.loser}`;
  ctx.font = '900 220px "Teko", "Sora", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = COLORS.white;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 16;
  ctx.fillText(text, CANVAS_WIDTH / 2, centerY);
  ctx.shadowBlur = 0;

  if (cupsRemaining != null && cupsRemaining >= 1 && cupsRemaining <= 10) {
    const sub = cupsRemaining === 1 ? '1 gobelet restant' : `${cupsRemaining} gobelets restants`;
    ctx.font = '600 30px "Sora", system-ui, sans-serif';
    ctx.fillStyle = COLORS.lime;
    ctx.fillText(sub, CANVAS_WIDTH / 2, centerY + 130);
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  contextLabel: string | undefined,
  date: string,
): void {
  const yBase = CANVAS_HEIGHT - 90;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (contextLabel) {
    ctx.font = '700 32px "Sora", system-ui, sans-serif';
    ctx.fillStyle = COLORS.white;
    // Truncate label to keep one line
    let label = contextLabel;
    const maxWidth = CANVAS_WIDTH - 120;
    while (ctx.measureText(label).width > maxWidth && label.length > 1) {
      label = label.slice(0, -2) + '…';
    }
    ctx.fillText(label, CANVAS_WIDTH / 2, yBase - 20);
  }

  const formatted = formatDateFr(date);
  if (formatted) {
    ctx.font = '500 24px "Sora", system-ui, sans-serif';
    ctx.fillStyle = COLORS.coolGray;
    ctx.fillText(formatted, CANVAS_WIDTH / 2, yBase + (contextLabel ? 22 : 0));
  }
}

function paintBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.navy);
  gradient.addColorStop(1, COLORS.navyDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle radial glow behind score
  const radial = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    50,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    600,
  );
  radial.addColorStop(0, 'rgba(183, 255, 59, 0.18)');
  radial.addColorStop(1, 'rgba(183, 255, 59, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Compose the Photo Finish collage and return a JPEG Blob (~300-500 KB).
 *
 * Layout (1080 × 1920) :
 *   ┌───────────────────────────────┐  y=0
 *   │  PHOTO FINISH   (lime)        │  y=110
 *   │  BEER PONG ELO  (cool-gray)   │  y=170
 *   │                               │
 *   │  ┌─────────────────────────┐  │  y=240 — winner panel
 *   │  │  WINNER PHOTO (lime)    │  │  h=900 (solo) or h=780 (split)
 *   │  └─────────────────────────┘  │
 *   │                               │
 *   │       10 – 4 (huge)           │  centerY=1240
 *   │       cups remaining label    │
 *   │                               │
 *   │  ┌─────────────────────────┐  │  y=1380 — loser panel (only if photo)
 *   │  │  LOSER PHOTO (muted)    │  │  h=380
 *   │  └─────────────────────────┘  │
 *   │                               │
 *   │  Context — Date               │  y=1830
 *   └───────────────────────────────┘  y=1920
 */
export async function composePhotoFinishCollage(input: PhotoFinishCollageInput): Promise<Blob> {
  await ensureFontsReady();

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  paintBackground(ctx);
  drawHeader(ctx);

  const hasLoserPhoto = input.loserPhoto !== null;
  const panelMargin = 64;
  const panelWidth = CANVAS_WIDTH - panelMargin * 2;

  if (hasLoserPhoto && input.loserPhoto) {
    // Split layout
    const winnerHeight = 740;
    const winnerY = 230;
    drawTeamPanel(ctx, {
      photo: input.winnerPhoto,
      team: input.winnerTeam,
      avatars: input.winnerAvatars ?? [],
      x: panelMargin,
      y: winnerY,
      width: panelWidth,
      height: winnerHeight,
      isWinner: true,
    });

    const loserHeight = 340;
    const loserY = 1440;
    drawTeamPanel(ctx, {
      photo: input.loserPhoto,
      team: input.loserTeam,
      avatars: input.loserAvatars ?? [],
      x: panelMargin,
      y: loserY,
      width: panelWidth,
      height: loserHeight,
      isWinner: false,
    });

    drawScore(ctx, input.score, input.cupsRemaining, 1190);
  } else {
    // Solo layout — winner only, full center
    const winnerY = 240;
    const winnerHeight = 1050;
    drawTeamPanel(ctx, {
      photo: input.winnerPhoto,
      team: input.winnerTeam,
      avatars: input.winnerAvatars ?? [],
      x: panelMargin,
      y: winnerY,
      width: panelWidth,
      height: winnerHeight,
      isWinner: true,
    });

    drawScore(ctx, input.score, input.cupsRemaining, 1490);
  }

  drawFooter(ctx, input.contextLabel, input.date ?? new Date().toISOString());

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.85,
    );
  });
}

export const PHOTO_FINISH_DIMENSIONS = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
} as const;
