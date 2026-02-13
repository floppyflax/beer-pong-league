const VALID_CODE_REGEX = /^[A-Z0-9]{6,8}$/i;

/**
 * Extract tournament code from QR code data
 *
 * QR code might contain:
 * - Direct code: "ABC123"
 * - URL: "https://bpl.com/tournament/123/join?code=ABC123"
 * - Join URL: "/tournament/123/join?code=ABC123"
 *
 * Returns empty string if no valid 6-8 char code can be extracted (invalid QR format).
 */
export function extractCodeFromQR(qrData: string): string {
  try {
    // If it's a URL, extract code from query params
    if (qrData.includes('code=')) {
      const url = new URL(qrData, window.location.origin);
      const code = url.searchParams.get('code');
      if (code && VALID_CODE_REGEX.test(code.trim())) {
        return code.trim().toUpperCase();
      }
    }

    // If it contains a slash, extract the last segment
    if (qrData.includes('/')) {
      const segments = qrData.split('/');
      const lastSegment = segments[segments.length - 1];
      if (VALID_CODE_REGEX.test(lastSegment)) {
        return lastSegment.toUpperCase();
      }
    }

    // Otherwise, treat as direct code — only if it matches valid format
    const trimmed = qrData.trim().toUpperCase();
    return VALID_CODE_REGEX.test(trimmed) ? trimmed : '';
  } catch {
    return '';
  }
}
