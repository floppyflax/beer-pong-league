/**
 * Runtime environment — injected at boot by each app (web / mobile).
 *
 * The shared layer never reads platform-specific globals (`import.meta.env`,
 * `process.env`, `window.location`). Apps call `initShared()` once at
 * startup with the resolved configuration, then services consume it via
 * `getEnv()`.
 */

export interface RuntimeUrls {
  /** Where Supabase Auth should redirect after a magic-link click. */
  authCallback: string;
  /** Where Stripe Checkout should redirect on success. */
  paymentSuccess: string;
  /** Where Stripe Checkout should redirect on cancel. */
  paymentCancel: string;
}

export interface RuntimeStripeConfig {
  publishableKey: string;
  premiumPriceId: string;
}

export interface RuntimeEnv {
  supabaseUrl: string;
  supabasePublicKey: string;
  isDev: boolean;
  /** `null` when Stripe is not configured (offline / dev without keys). */
  stripe: RuntimeStripeConfig | null;
  urls: RuntimeUrls;
}

let _env: RuntimeEnv | null = null;

export function initEnv(env: RuntimeEnv): void {
  _env = env;
}

export function getEnv(): RuntimeEnv {
  if (!_env) {
    throw new Error(
      'shared runtime not initialized — call initShared() at app boot before importing services',
    );
  }
  return _env;
}

export function hasEnv(): boolean {
  return _env !== null;
}

/** Test-only — reset internal state between unit tests. */
export function _resetEnvForTests(): void {
  _env = null;
}
