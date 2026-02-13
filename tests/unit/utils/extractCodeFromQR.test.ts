import { describe, it, expect } from 'vitest';
import { extractCodeFromQR } from '../../../src/utils/extractCodeFromQR';

describe('extractCodeFromQR', () => {
  it('should extract code from URL with query param', () => {
    expect(extractCodeFromQR('https://bpl.com/tournament/123?code=ABC123')).toBe('ABC123');
    expect(extractCodeFromQR('https://example.com/join?code=XYZ789')).toBe('XYZ789');
  });

  it('should extract code from path segment when valid format', () => {
    expect(extractCodeFromQR('/tournament/join/ABC123')).toBe('ABC123');
    expect(extractCodeFromQR('https://bpl.com/tournament/123/ABCD1234')).toBe('ABCD1234');
  });

  it('should handle direct code input', () => {
    expect(extractCodeFromQR('ABC123')).toBe('ABC123');
    expect(extractCodeFromQR('ABCD1234')).toBe('ABCD1234');
  });

  it('should convert extracted code to uppercase', () => {
    expect(extractCodeFromQR('abc123')).toBe('ABC123');
    expect(extractCodeFromQR('https://bpl.com?code=xyz789')).toBe('XYZ789');
  });

  it('should return empty string for invalid QR (no valid 6-8 char code)', () => {
    expect(extractCodeFromQR('https://example.com/tournament/123/join')).toBe('');
    expect(extractCodeFromQR('ABC')).toBe('');
    expect(extractCodeFromQR('join')).toBe('');
  });
});
