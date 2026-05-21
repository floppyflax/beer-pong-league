/**
 * Platform detection utilities.
 * In the monorepo, the mobile app will use its own Platform from react-native.
 * This file is for the web app only.
 */

export const isNative = false;
export const isIOS = false;
export const isAndroid = false;
export const isWeb = true;

export function getPlatform(): 'web' {
  return 'web';
}

/**
 * Coarse user-agent sniff used to branch the image-capture flow between
 * `WebcamCaptureSheet` (desktop) and the native picker (`input[capture]`,
 * mobile). UA sniffing is intentional here — `pointer: coarse` would catch
 * touch-screen laptops where the native camera intent doesn't apply.
 */
export function isMobileDevice(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}
