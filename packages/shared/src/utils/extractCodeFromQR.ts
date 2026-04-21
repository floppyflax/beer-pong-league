const VALID_CODE_REGEX = /^[A-Z0-9]{6,8}$/i;

export interface QRParseResult {
  type: 'code' | 'tournament_url' | 'league_url' | 'invalid';
  code?: string;
  entityId?: string;
}

/**
 * Parse QR code data into a structured result.
 *
 * QR codes can contain:
 * - Direct join code: "ABC123"
 * - Tournament URL: "https://bpl.com/tournament/{uuid}/join" or with ?code=
 * - League URL: "https://bpl.com/league/{uuid}"
 * - Code param: "...?code=ABC123"
 */
export function parseQRData(qrData: string): QRParseResult {
  try {
    const tournamentUrlMatch = qrData.match(/\/tournament\/([a-f0-9-]{36})(?:\/join)?/i);
    if (tournamentUrlMatch) {
      return { type: 'tournament_url', entityId: tournamentUrlMatch[1] };
    }

    const leagueUrlMatch = qrData.match(/\/league\/([a-f0-9-]{36})/i);
    if (leagueUrlMatch) {
      return { type: 'league_url', entityId: leagueUrlMatch[1] };
    }

    if (qrData.includes('code=')) {
      const url = new URL(qrData, 'https://placeholder.local');
      const code = url.searchParams.get('code');
      if (code && VALID_CODE_REGEX.test(code.trim())) {
        return { type: 'code', code: code.trim().toUpperCase() };
      }
    }

    const trimmed = qrData.trim().toUpperCase();
    if (VALID_CODE_REGEX.test(trimmed)) {
      return { type: 'code', code: trimmed };
    }

    return { type: 'invalid' };
  } catch {
    return { type: 'invalid' };
  }
}

/**
 * Legacy function — extracts a join code string from QR data.
 * Prefer parseQRData() for new code.
 */
export function extractCodeFromQR(qrData: string): string {
  const result = parseQRData(qrData);
  return result.code ?? '';
}
