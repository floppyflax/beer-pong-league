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
