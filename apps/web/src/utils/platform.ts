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
 * Whether the live in-app camera (getUserMedia) is usable. Drives the
 * "take a photo" flow: when true we open `WebcamCaptureSheet` (a real camera,
 * which is the only way to capture on desktop where `input[capture]` is
 * ignored, and also works on modern mobile); otherwise we fall back to the
 * native `input[capture]` picker. Capability detection beats UA sniffing,
 * which misfired on some desktop browsers and dropped them onto the picker.
 */
export function supportsGetUserMedia(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}
