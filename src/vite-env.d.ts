/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" to request live ads. Anything else requests Google test ads. */
  readonly VITE_ADMOB_PRODUCTION?: string;
  readonly VITE_ADMOB_ANDROID_BANNER?: string;
  readonly VITE_ADMOB_ANDROID_INTERSTITIAL?: string;
  readonly VITE_ADMOB_ANDROID_REWARDED?: string;
  readonly VITE_ADMOB_IOS_BANNER?: string;
  readonly VITE_ADMOB_IOS_INTERSTITIAL?: string;
  readonly VITE_ADMOB_IOS_REWARDED?: string;
  /** Comma-separated AdMob test device ids. */
  readonly VITE_ADMOB_TEST_DEVICES?: string;
  /** "EEA", "US" or "OTHER": where the consent SDK should think the test devices are. */
  readonly VITE_ADMOB_DEBUG_GEOGRAPHY?: string;
  /** "true" to show the pretend in-browser ads outside of dev builds (demos, e2e tests). */
  readonly VITE_MOCK_ADS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
