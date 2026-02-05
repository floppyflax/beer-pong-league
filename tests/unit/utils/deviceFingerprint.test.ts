import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateDeviceFingerprint, getDeviceFingerprint } from '@/utils/deviceFingerprint';

describe('deviceFingerprint', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate a fingerprint string', () => {
      const fingerprint = generateDeviceFingerprint();
      
      expect(fingerprint).toBeTruthy();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
      expect(fingerprint.length).toBeLessThanOrEqual(32);
    });

    it('should generate consistent fingerprint for same device', () => {
      const fp1 = generateDeviceFingerprint();
      const fp2 = generateDeviceFingerprint();
      
      // Should be same since browser properties don't change
      expect(fp1).toBe(fp2);
    });

    it('should include device characteristics', () => {
      // The fingerprint is base64 encoded, so we can't easily check content
      // But we can verify it's generated from browser properties
      const fingerprint = generateDeviceFingerprint();
      
      expect(fingerprint).toBeTruthy();
      // Base64 encoded string
      expect(fingerprint).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('getDeviceFingerprint', () => {
    it('should get fingerprint from localStorage if exists', () => {
      const storedFp = 'stored-fingerprint-123';
      localStorage.setItem('bpl_device_fingerprint', storedFp);
      
      const fingerprint = getDeviceFingerprint();
      
      expect(fingerprint).toBe(storedFp);
    });

    it('should generate and store new fingerprint if not exists', () => {
      const fingerprint = getDeviceFingerprint();
      
      expect(fingerprint).toBeTruthy();
      expect(localStorage.getItem('bpl_device_fingerprint')).toBe(fingerprint);
    });

    it('should return same fingerprint on multiple calls', () => {
      const fp1 = getDeviceFingerprint();
      const fp2 = getDeviceFingerprint();
      
      expect(fp1).toBe(fp2);
    });

    it('should persist fingerprint across calls', () => {
      const fp1 = getDeviceFingerprint();
      
      // Simulate new session (but localStorage persists)
      const fp2 = getDeviceFingerprint();
      
      expect(fp2).toBe(fp1);
      expect(localStorage.getItem('bpl_device_fingerprint')).toBe(fp1);
    });
  });
});
