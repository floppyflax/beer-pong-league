/**
 * MatchPhotoService — upload du collage Photo Finish dans le bucket
 * public `match-photos` (migration 030).
 *
 * Le path canonique est `{matchId}/finish.{ext}` — voir le commentaire de la
 * migration pour la justification du modèle de sécurité (UUID v4 = path
 * non-devinable, INSERT ouvert anon + authenticated pour matcher le
 * mode offline-first du reste de l'app).
 *
 * Ne touche pas à la table `matches` : la persistance de `photo_url` reste
 * la responsabilité de `matchesRepository.updateMatchPhotoUrl`.
 */

import { getSupabase } from '@elofight/shared';

const BUCKET = 'match-photos';

function extFromMime(mime: string): 'jpg' | 'png' | 'webp' {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

async function uploadMatchPhoto(matchId: string, blob: Blob): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const mime = blob.type || 'image/jpeg';
    const ext = extFromMime(mime);
    const path = `${matchId}/finish.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: mime });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error('Error uploading match photo:', error);
    return null;
  }
}

export const matchPhotoService = {
  uploadMatchPhoto,
};
