export type RewardedPlacement = 'double_night' | 'free_hint' | 'calm_guest' | 'double_gift';
export type InterstitialPlacement = 'night_closed';

/** One ad network integration (AdMob on devices, a pretend provider in the browser, or none). */
export interface AdProvider {
  readonly kind: 'admob' | 'mock' | 'none';
  init(): Promise<void>;
  /** A rewarded ad is loaded and can be offered to the player right now. */
  rewardedReady(): boolean;
  /** Resolves true only if the player watched long enough to earn the reward. */
  showRewarded(placement: RewardedPlacement): Promise<boolean>;
  /** Resolves true if an ad was actually shown. */
  showInterstitial(placement: InterstitialPlacement): Promise<boolean>;
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  /** GDPR/UMP: the player must be able to revisit their consent choices from settings. */
  privacyOptionsRequired(): boolean;
  showPrivacyOptions(): Promise<void>;
  /** Called whenever readiness, banner size or privacy status changes. */
  onChange(listener: () => void): void;
  bannerHeight(): number;
}

export const NO_ADS: AdProvider = {
  kind: 'none',
  init: async () => {},
  rewardedReady: () => false,
  showRewarded: async () => false,
  showInterstitial: async () => false,
  showBanner: async () => {},
  hideBanner: async () => {},
  privacyOptionsRequired: () => false,
  showPrivacyOptions: async () => {},
  onChange: () => {},
  bannerHeight: () => 0,
};
