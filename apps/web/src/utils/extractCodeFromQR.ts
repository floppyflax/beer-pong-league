const VALID_CODE_REGEX = /^[A-Z0-9]{6,8}$/i;

export interface QRParseResult {
  type: 'code' | 'event_url' | 'league_url' | 'invalid';
  code?: string;
  entityId?: string;
}

/**
 * Parse QR code data into a structured result.
 *
 * QR codes can contain:
 * - Direct join code: "ABC123"
 * - Event URL: "https://bpl.com/event/{uuid}/join" or "https://bpl.com/event/{uuid}/join" (legacy)
 * - League URL: "https://bpl.com/league/{uuid}"
 * - Code param: "...?code=ABC123"
 */
export function parseQRData(qrData: string): QRParseResult {
  try {
    const eventUrlMatch = qrData.match(/\/(?:event|event)\/([a-f0-9-]{36})(?:\/join)?/i);
    if (eventUrlMatch) {
      return { type: 'event_url', entityId: eventUrlMatch[1] };
    }

    const leagueUrlMatch = qrData.match(/\/league\/([a-f0-9-]{36})/i);
    if (leagueUrlMatch) {
      return { type: 'league_url', entityId: leagueUrlMatch[1] };
    }

    if (qrData.includes('code=')) {
      const url = new URL(qrData, window.location.origin);
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
