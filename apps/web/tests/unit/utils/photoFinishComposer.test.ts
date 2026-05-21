import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  composePhotoFinishCollage,
  PHOTO_FINISH_DIMENSIONS,
  type PhotoFinishCollageInput,
} from '@/utils/photoFinishComposer';

/**
 * happy-dom only exposes a stub `HTMLCanvasElement` — `getContext('2d')` returns
 * null and there is no `toBlob`. We patch both at the prototype level so the
 * composer runs end-to-end against a recording context. We don't assert the
 * exact draw calls (the visual rendering is reviewed in the showcase page).
 * The test verifies that the function:
 *   - allocates a 1080×1920 canvas
 *   - produces a non-empty `image/jpeg` Blob
 *   - handles the "solo" (no loser photo) and "split" (with loser photo) cases
 */

interface FakeImage {
  width: number;
  height: number;
}

function makeFakeImage(width = 1080, height = 1080): FakeImage {
  return { width, height };
}

function installCanvasStubs() {
  const recordedCalls: string[] = [];
  const noop = (..._args: unknown[]): void => {
    void _args;
  };

  const fakeContext = {
    canvas: null as unknown as HTMLCanvasElement,
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    clip: noop,
    save: noop,
    restore: noop,
    drawImage: noop,
    fillText: () => {
      recordedCalls.push('fillText');
    },
    measureText: (text: string) => ({ width: text.length * 12 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => fakeContext,
  ) as unknown as HTMLCanvasElement['getContext'];

  HTMLCanvasElement.prototype.toBlob = vi.fn(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
    type?: string,
  ) {
    // Synchronous in our stub — real impl is async but the composer awaits.
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], {
      type: type ?? 'image/jpeg',
    });
    cb(blob);
  }) as unknown as HTMLCanvasElement['toBlob'];

  return { recordedCalls };
}

const baseInput = (): PhotoFinishCollageInput => ({
  winnerPhoto: makeFakeImage() as unknown as HTMLImageElement,
  loserPhoto: null,
  winnerTeam: {
    label: 'Équipe A',
    players: [{ name: 'Floflo' }, { name: 'Marie' }],
  },
  loserTeam: {
    label: 'Équipe B',
    players: [{ name: 'Théo' }, { name: 'Léa' }],
  },
  score: { winner: 10, loser: 4 },
  cupsRemaining: 6,
  contextLabel: 'Soirée bière 2026',
  date: '2026-05-21T20:00:00.000Z',
});

describe('photoFinishComposer', () => {
  beforeEach(() => {
    installCanvasStubs();
  });

  it('exposes the Instagram Story dimensions (1080 × 1920)', () => {
    expect(PHOTO_FINISH_DIMENSIONS).toEqual({ width: 1080, height: 1920 });
  });

  it('produces an image/jpeg Blob in the solo layout (no loser photo)', async () => {
    const blob = await composePhotoFinishCollage(baseInput());
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('produces a Blob in the split layout (with loser photo)', async () => {
    const blob = await composePhotoFinishCollage({
      ...baseInput(),
      loserPhoto: makeFakeImage() as unknown as HTMLImageElement,
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('tolerates an absent cups_remaining and an absent context label', async () => {
    const blob = await composePhotoFinishCollage({
      ...baseInput(),
      cupsRemaining: null,
      contextLabel: undefined,
    });
    expect(blob).toBeInstanceOf(Blob);
  });

  it('truncates a very long player name without throwing', async () => {
    const blob = await composePhotoFinishCollage({
      ...baseInput(),
      winnerTeam: {
        label: 'Équipe A',
        players: [{ name: 'a'.repeat(120) }, { name: 'b'.repeat(120) }],
      },
    });
    expect(blob).toBeInstanceOf(Blob);
  });
});
