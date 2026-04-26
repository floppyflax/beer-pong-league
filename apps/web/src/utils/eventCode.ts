/**
 * Event Code Generator
 * 
 * Generates unique 6-character alphanumeric codes for events
 * Format: AAAAAA (uppercase letters and numbers only, excluding ambiguous characters)
 */

/**
 * Characters allowed in event codes
 * Excludes: 0, O, I, 1, L to avoid confusion
 */
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 6-character alphanumeric event code
 * 
 * @returns Random event code (e.g., "ABC123")
 * 
 * @example
 * const code = generateEventCode();
 * // Returns something like: "P3X7M2"
 */
export function generateEventCode(): string {
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  
  return code;
}

/**
 * Validate event code format
 * 
 * @param code - Code to validate
 * @returns true if code is valid format (6 alphanumeric chars)
 * 
 * @example
 * isValidCodeFormat("ABC123"); // true
 * isValidCodeFormat("abc123"); // false (lowercase not allowed)
 * isValidCodeFormat("ABCD");   // false (wrong length)
 */
export function isValidCodeFormat(code: string): boolean {
  if (!code || code.length !== 6) {
    return false;
  }
  
  return code.split('').every(char => ALLOWED_CHARS.includes(char));
}

/**
 * Format code for display (adds hyphen for readability)
 * 
 * @param code - Event code
 * @returns Formatted code (e.g., "ABC-123")
 * 
 * @example
 * formatCodeForDisplay("ABC123"); // "ABC-123"
 */
export function formatCodeForDisplay(code: string): string {
  if (!code || code.length !== 6) {
    return code;
  }
  
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
