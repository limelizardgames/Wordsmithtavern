import type { AdsState } from '../../game/save';

/**
 * Player-friendly ad pacing. Interstitials only ever appear between nights, never mid-order,
 * never during a player's first nights, and never right after they chose to watch a rewarded ad.
 */
export const AD_RULES = {
  /** No interstitials until this many nights have been completed. */
  graceNights: 3,
  /** Completed nights between interstitials. */
  nightsBetweenInterstitials: 2,
  /** Minimum seconds between any two interstitials. */
  minSecondsBetweenInterstitials: 240,
  /** Skip the interstitial if a rewarded ad finished this recently. */
  minSecondsAfterRewarded: 120,
} as const;

export function shouldShowInterstitial(
  ads: AdsState,
  nightsCompleted: number,
  now: number,
): boolean {
  if (ads.removeAds) return false;
  if (nightsCompleted < AD_RULES.graceNights) return false;
  if (ads.nightsSinceInterstitial < AD_RULES.nightsBetweenInterstitials) return false;
  if (now - ads.lastInterstitialAt < AD_RULES.minSecondsBetweenInterstitials * 1000) return false;
  if (now - ads.lastRewardedAt < AD_RULES.minSecondsAfterRewarded * 1000) return false;
  return true;
}

/** Call when a night closes (before deciding on an interstitial). */
export function noteNightCompleted(ads: AdsState): AdsState {
  return { ...ads, nightsSinceInterstitial: ads.nightsSinceInterstitial + 1 };
}

export function noteInterstitialShown(ads: AdsState, now: number): AdsState {
  return {
    ...ads,
    lastInterstitialAt: now,
    nightsSinceInterstitial: 0,
    interstitialsShown: ads.interstitialsShown + 1,
  };
}

export function noteRewardedWatched(ads: AdsState, now: number): AdsState {
  return { ...ads, lastRewardedAt: now, rewardedWatched: ads.rewardedWatched + 1 };
}

/** Banners are shown on menu screens only, never over the letter wheel. */
export function bannerAllowed(ads: AdsState, screen: string): boolean {
  if (ads.removeAds) return false;
  return screen === 'hub' || screen === 'shop' || screen === 'recipes' || screen === 'guests';
}
