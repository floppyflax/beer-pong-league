import { describe, it, expect } from 'vitest';

/**
 * Extract tournament code from QR data
 * 
 * Handles multiple QR code formats:
 * 1. URL with code parameter: https://app.com/join?code=ABC123
 * 2. URL path segment: https://app.com/join/ABC123
 * 3. Plain code: ABC123
 * 
 * Always returns uppercase, trimmed code
 */
function extractCodeFromQR(qrData: string): string {
  try {
    // If it's a URL with code parameter
    if (qrData.includes('code=')) {
      const url = new URL(qrData, window.location.origin);
      const code = url.searchParams.get('code');
      if (code) return code.toUpperCase();
    }

    // If it's a URL path (e.g., /join/ABC123)
    if (qrData.includes('/')) {
      const segments = qrData.split('/');
      const lastSegment = segments[segments.length - 1];
      // Validate it looks like a code (5-8 alphanumeric chars)
      if (/^[A-Z0-9]{5,8}$/i.test(lastSegment)) {
        return lastSegment.toUpperCase();
      }
    }

    // Assume it's a plain code
    return qrData.toUpperCase().trim();
  } catch (err) {
    // If URL parsing fails, treat as plain code
    return qrData.toUpperCase().trim();
  }
}

describe('extractCodeFromQR', () => {
  describe('URL with code parameter', () => {
    it('should extract code from query parameter', () => {
      const result = extractCodeFromQR('https://app.com/join?code=ABC123');
      expect(result).toBe('ABC123');
    });

    it('should extract code from query parameter (lowercase input)', () => {
      const result = extractCodeFromQR('https://app.com/join?code=abc123');
      expect(result).toBe('ABC123');
    });

    it('should extract code from query parameter with other params', () => {
      const result = extractCodeFromQR('https://app.com/join?utm_source=qr&code=XYZ789&ref=mobile');
      expect(result).toBe('XYZ789');
    });

    it('should handle relative URL with code parameter', () => {
      const result = extractCodeFromQR('/join?code=TEST99');
      expect(result).toBe('TEST99');
    });
  });

  describe('URL path segment', () => {
    it('should extract code from URL path', () => {
      const result = extractCodeFromQR('https://app.com/join/ABC123');
      expect(result).toBe('ABC123');
    });

    it('should extract code from URL path (lowercase input)', () => {
      const result = extractCodeFromQR('https://app.com/join/xyz789');
      expect(result).toBe('XYZ789');
    });

    it('should extract code from relative path', () => {
      const result = extractCodeFromQR('/join/DEMO55');
      expect(result).toBe('DEMO55');
    });

    it('should extract code from nested path', () => {
      const result = extractCodeFromQR('https://app.com/tournaments/join/TEST01');
      expect(result).toBe('TEST01');
    });

    it('should not extract invalid segment (too short)', () => {
      const result = extractCodeFromQR('https://app.com/join/AB');
      // Falls back to plain code extraction (returns full URL uppercase)
      expect(result).toBe('HTTPS://APP.COM/JOIN/AB');
    });

    it('should not extract invalid segment (too long)', () => {
      const result = extractCodeFromQR('https://app.com/join/ABCDEFGHIJK');
      // Falls back to plain code extraction (returns full URL uppercase)
      expect(result).toBe('HTTPS://APP.COM/JOIN/ABCDEFGHIJK');
    });
  });

  describe('Plain code', () => {
    it('should handle plain code', () => {
      const result = extractCodeFromQR('ABC123');
      expect(result).toBe('ABC123');
    });

    it('should handle plain code (lowercase)', () => {
      const result = extractCodeFromQR('xyz789');
      expect(result).toBe('XYZ789');
    });

    it('should trim whitespace from plain code', () => {
      const result = extractCodeFromQR('  TEST99  ');
      expect(result).toBe('TEST99');
    });

    it('should handle plain code with newlines', () => {
      const result = extractCodeFromQR('ABC123\n');
      expect(result).toBe('ABC123');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = extractCodeFromQR('');
      expect(result).toBe('');
    });

    it('should handle invalid URL gracefully', () => {
      const result = extractCodeFromQR('ht!tp://invalid');
      // 'invalid' is 7 alphanumeric chars, so it matches the regex and gets extracted
      expect(result).toBe('INVALID');
    });

    it('should handle special characters in plain code', () => {
      const result = extractCodeFromQR('ABC-123');
      expect(result).toBe('ABC-123');
    });

    it('should handle numeric only code', () => {
      const result = extractCodeFromQR('123456');
      expect(result).toBe('123456');
    });
  });
});
