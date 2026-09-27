/**
 * AdMob configuration. Real ad unit ids are supplied at build time through Vite env variables
 * (see .env.example) so they never need to live in the repository. Until then, Google's
 * official test units are used, which are always safe to click.
 */
const env = import.meta.env;

/** Google's public sample ad units: https://developers.google.com/admob/android/test-ads */
export const TEST_AD_UNITS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
} as const;

export type AdUnits = { banner: string; interstitial: string; rewarded: string };

const production = env.VITE_ADMOB_PRODUCTION === 'true';

/** Regions the consent SDK can pretend a test device is in (UMP "debug geography"). */
const DEBUG_GEOGRAPHIES = ['EEA', 'US', 'OTHER'] as const;
export type ConsentDebugGeography = (typeof DEBUG_GEOGRAPHIES)[number];

function debugGeography(value: string | undefined): ConsentDebugGeography | undefined {
  const wanted = value?.trim().toUpperCase();
  return DEBUG_GEOGRAPHIES.find((g) => g === wanted);
}

export const AD_CONFIG = {
  /** Live ads only when explicitly enabled; otherwise every request is a test request. */
  production,
  units: {
    android: {
      banner: env.VITE_ADMOB_ANDROID_BANNER || TEST_AD_UNITS.android.banner,
      interstitial: env.VITE_ADMOB_ANDROID_INTERSTITIAL || TEST_AD_UNITS.android.interstitial,
      rewarded: env.VITE_ADMOB_ANDROID_REWARDED || TEST_AD_UNITS.android.rewarded,
    },
    ios: {
      banner: env.VITE_ADMOB_IOS_BANNER || TEST_AD_UNITS.ios.banner,
      interstitial: env.VITE_ADMOB_IOS_INTERSTITIAL || TEST_AD_UNITS.ios.interstitial,
      rewarded: env.VITE_ADMOB_IOS_REWARDED || TEST_AD_UNITS.ios.rewarded,
    },
  } satisfies Record<'android' | 'ios', AdUnits>,
  testDevices: (env.VITE_ADMOB_TEST_DEVICES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /**
   * Make the test devices look as if they are in the EEA (or a regulated US state) so the
   * consent message can be checked from anywhere. Never applied to production builds.
   */
  consentDebugGeography: production ? undefined : debugGeography(env.VITE_ADMOB_DEBUG_GEOGRAPHY),
  /**
   * A cosy fantasy game for a general audience: keep ads family-friendly. If you ever target
   * children specifically, also set tagForChildDirectedTreatment and review Google Play's
   * Families policy and Apple's Kids Category rules before release.
   */
  maxAdContentRating: 'ParentalGuidance' as const,
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
  /** Pretend ads in the browser so every ad flow can be tried without a device. */
  webMockAds: env.DEV || env.VITE_MOCK_ADS === 'true',
};
