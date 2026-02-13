/**
 * Extract tournament code from QR code data
 *
 * QR code might contain:
 * - Direct code: "ABC123"
 * - URL: "https://bpl.com/tournament/123/join?code=ABC123"
 * - Join URL: "/tournament/123/join?code=ABC123"
 */
export function extractCodeFromQR(qrData: string): string {
  try {
    // If it's a URL, extract code from query params
    if (qrData.includes('code=')) {
      const url = new URL(qrData, window.location.origin);
      const code = url.searchParams.get('code');
      if (code) return code.toUpperCase();
    }

    // If it contains a slash, extract the last segment
    if (qrData.includes('/')) {
      const segments = qrData.split('/');
      const lastSegment = segments[segments.length - 1];
      // Check if last segment is a valid code format (6-8 chars per AC4)
      if (/^[A-Z0-9]{6,8}$/i.test(lastSegment)) {
        return lastSegment.toUpperCase();
      }
    }

    // Otherwise, treat as direct code
    return qrData.toUpperCase().trim();
  } catch {
    // If URL parsing fails, return as-is
    return qrData.toUpperCase().trim();
  }
}
