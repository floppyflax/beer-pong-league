/**
 * Generate a simple device fingerprint
 * Used to identify the same device across sessions
 */
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
  ].join('|');
  
  // Simple hash (or use a proper hashing library)
  return btoa(fingerprint).substring(0, 32);
}

/**
 * Get or create device fingerprint from localStorage
 */
export function getDeviceFingerprint(): string {
  const stored = localStorage.getItem('bpl_device_fingerprint');
  if (stored) {
    return stored;
  }
  
  const fingerprint = generateDeviceFingerprint();
  localStorage.setItem('bpl_device_fingerprint', fingerprint);
  return fingerprint;
}



