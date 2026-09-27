import { signal } from '@preact/signals';
import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from '../../config/ads';
import { MockAdProvider } from './mock';
import {
  NO_ADS,
  type AdProvider,
  type InterstitialPlacement,
  type RewardedPlacement,
} from './types';

export type { RewardedPlacement, InterstitialPlacement } from './types';

/** Reactive ad state for the UI. */
export const ads = {
  kind: signal<AdProvider['kind']>('none'),
  /** A rewarded ad can be offered right now. */
  rewardedReady: signal(false),
  /** A full-screen ad is on screen: the game pauses and goes quiet. */
  showing: signal(false),
  bannerHeight: signal(0),
  privacyRequired: signal(false),
};

let provider: AdProvider = NO_ADS;

function sync() {
  ads.rewardedReady.value = provider.rewardedReady();
  ads.bannerHeight.value = provider.bannerHeight();
  ads.privacyRequired.value = provider.privacyOptionsRequired();
}

async function createProvider(): Promise<AdProvider> {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    const { AdMobProvider } = await import('./admob');
    return new AdMobProvider(platform);
  }
  if (AD_CONFIG.webMockAds) return new MockAdProvider();
  return NO_ADS;
}

export async function initAds(): Promise<void> {
  try {
    provider = await createProvider();
    ads.kind.value = provider.kind;
    provider.onChange(sync);
    await provider.init();
  } catch (err) {
    console.warn('[ads] disabled:', err);
    provider = NO_ADS;
    ads.kind.value = 'none';
  }
  sync();
}

async function fullscreen<T>(run: () => Promise<T>): Promise<T> {
  ads.showing.value = true;
  try {
    return await run();
  } finally {
    ads.showing.value = false;
    sync();
  }
}

export function showRewardedAd(placement: RewardedPlacement): Promise<boolean> {
  if (!provider.rewardedReady()) return Promise.resolve(false);
  return fullscreen(() => provider.showRewarded(placement));
}

export function showInterstitialAd(placement: InterstitialPlacement): Promise<boolean> {
  return fullscreen(() => provider.showInterstitial(placement));
}

export async function setBannerVisible(visible: boolean): Promise<void> {
  try {
    await (visible ? provider.showBanner() : provider.hideBanner());
  } finally {
    sync();
  }
}

export async function openPrivacyOptions(): Promise<void> {
  await provider.showPrivacyOptions();
  sync();
}
