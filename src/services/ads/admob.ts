import {
  AdMob,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
  RewardAdPluginEvents,
  type AdmobConsentInfo,
  type AdmobConsentRequestOptions,
} from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';
import { AD_CONFIG, type AdUnits } from '../../config/ads';
import type { AdProvider, InterstitialPlacement, RewardedPlacement } from './types';

const CONSENT_OK_KEY = 'wordsmith-tavern/ads-consent-ok';

/** The plugin doesn't export this enum, so compare its string value. */
const privacyRequired = (info: AdmobConsentInfo) =>
  String(info.privacyOptionsRequirementStatus) === 'REQUIRED';

/** Shared by the start-up check and the refresh after the privacy options form. */
const CONSENT_REQUEST: AdmobConsentRequestOptions = {
  testDeviceIdentifiers: AD_CONFIG.testDevices,
  tagForUnderAgeOfConsent: AD_CONFIG.tagForUnderAgeOfConsent,
  debugGeography: AD_CONFIG.consentDebugGeography
    ? AdmobConsentDebugGeography[AD_CONFIG.consentDebugGeography]
    : AdmobConsentDebugGeography.DISABLED,
};

const RETRY_DELAYS = [15_000, 30_000, 60_000, 120_000, 300_000];

/** Waits for one of several plugin events; used because show*() promises don't settle on dismiss. */
async function listen(handlers: Array<[string, (data: unknown) => void]>): Promise<() => void> {
  const handles: PluginListenerHandle[] = await Promise.all(
    handlers.map(([event, fn]) => AdMob.addListener(event as never, fn as never)),
  );
  return () => handles.forEach((h) => void h.remove());
}

export class AdMobProvider implements AdProvider {
  readonly kind = 'admob' as const;
  private readonly units: AdUnits;
  private readonly isTesting = !AD_CONFIG.production;
  private sdkReady = false;
  private rewardedLoaded = false;
  private rewardedLoading = false;
  private rewardedFailures = 0;
  private interstitialLoaded = false;
  private interstitialLoading = false;
  private interstitialFailures = 0;
  private bannerCreated = false;
  private bannerVisible = false;
  private bannerPx = 0;
  private privacyRequired = false;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly platform: 'ios' | 'android') {
    this.units = AD_CONFIG.units[platform];
  }

  onChange(listener: () => void) {
    this.listeners.add(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  async init() {
    // Google's order: consent first (UMP), and only request ads once consent allows it.
    let canRequestAds = false;
    try {
      let info: AdmobConsentInfo = await AdMob.requestConsentInfo(CONSENT_REQUEST);
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        info = await AdMob.showConsentForm();
      }
      this.privacyRequired = privacyRequired(info);
      canRequestAds = info.canRequestAds;
      try {
        localStorage.setItem(CONSENT_OK_KEY, canRequestAds ? '1' : '0');
      } catch {
        /* storage unavailable: fine */
      }
    } catch (err) {
      // Offline or UMP hiccup: fall back to the last known answer rather than guessing.
      console.warn('[ads] consent check failed', err);
      try {
        canRequestAds = localStorage.getItem(CONSENT_OK_KEY) === '1';
      } catch {
        canRequestAds = false;
      }
    }
    this.emit();
    if (!canRequestAds) return;

    if (this.platform === 'ios') {
      try {
        const tracking = await AdMob.trackingAuthorizationStatus();
        if (tracking.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
      } catch (err) {
        console.warn('[ads] tracking authorization failed', err);
      }
    }

    await AdMob.initialize({
      testingDevices: AD_CONFIG.testDevices,
      initializeForTesting: AD_CONFIG.testDevices.length > 0,
      tagForChildDirectedTreatment: AD_CONFIG.tagForChildDirectedTreatment,
      tagForUnderAgeOfConsent: AD_CONFIG.tagForUnderAgeOfConsent,
      maxAdContentRating: MaxAdContentRating[AD_CONFIG.maxAdContentRating],
    });
    this.sdkReady = true;

    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      this.bannerPx = this.bannerVisible ? size.height : 0;
      this.emit();
    });
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
      this.bannerPx = 0;
      this.emit();
    });

    void this.loadRewarded();
    void this.loadInterstitial();
  }

  rewardedReady() {
    return this.rewardedLoaded;
  }

  privacyOptionsRequired() {
    return this.privacyRequired;
  }

  bannerHeight() {
    return this.bannerPx;
  }

  async showPrivacyOptions() {
    await AdMob.showPrivacyOptionsForm();
    this.privacyRequired = privacyRequired(await AdMob.requestConsentInfo(CONSENT_REQUEST));
    this.emit();
  }

  private retry(kind: 'rewarded' | 'interstitial') {
    const failures = kind === 'rewarded' ? this.rewardedFailures : this.interstitialFailures;
    const delay = RETRY_DELAYS[Math.min(failures, RETRY_DELAYS.length - 1)]!;
    setTimeout(
      () => void (kind === 'rewarded' ? this.loadRewarded() : this.loadInterstitial()),
      delay,
    );
  }

  private async loadRewarded() {
    if (!this.sdkReady || this.rewardedLoaded || this.rewardedLoading) return;
    this.rewardedLoading = true;
    try {
      await AdMob.prepareRewardVideoAd({ adId: this.units.rewarded, isTesting: this.isTesting });
      this.rewardedLoaded = true;
      this.rewardedFailures = 0;
    } catch {
      this.rewardedFailures++;
      this.retry('rewarded');
    } finally {
      this.rewardedLoading = false;
      this.emit();
    }
  }

  private async loadInterstitial() {
    if (!this.sdkReady || this.interstitialLoaded || this.interstitialLoading) return;
    this.interstitialLoading = true;
    try {
      await AdMob.prepareInterstitial({ adId: this.units.interstitial, isTesting: this.isTesting });
      this.interstitialLoaded = true;
      this.interstitialFailures = 0;
    } catch {
      this.interstitialFailures++;
      this.retry('interstitial');
    } finally {
      this.interstitialLoading = false;
    }
  }

  async showRewarded(_placement: RewardedPlacement): Promise<boolean> {
    if (!this.rewardedLoaded) {
      void this.loadRewarded();
      return false;
    }
    this.rewardedLoaded = false;
    this.emit();
    const earned = await new Promise<boolean>((resolve) => {
      let rewarded = false;
      let settled = false;
      let stop: () => void = () => {};
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        stop();
        resolve(value);
      };
      void listen([
        [RewardAdPluginEvents.Rewarded, () => (rewarded = true)],
        // The reward callback can land just after dismissal on some devices; give it a moment.
        [RewardAdPluginEvents.Dismissed, () => setTimeout(() => finish(rewarded), 500)],
        [RewardAdPluginEvents.FailedToShow, () => finish(false)],
      ]).then((unlisten) => {
        stop = unlisten;
        AdMob.showRewardVideoAd()
          .then(() => (rewarded = true))
          .catch(() => finish(false));
      });
    });
    void this.loadRewarded();
    return earned;
  }

  async showInterstitial(_placement: InterstitialPlacement): Promise<boolean> {
    if (!this.interstitialLoaded) {
      void this.loadInterstitial();
      return false;
    }
    this.interstitialLoaded = false;
    const shown = await new Promise<boolean>((resolve) => {
      let settled = false;
      let stop: () => void = () => {};
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        stop();
        resolve(value);
      };
      void listen([
        [InterstitialAdPluginEvents.Dismissed, () => finish(true)],
        [InterstitialAdPluginEvents.FailedToShow, () => finish(false)],
      ]).then((unlisten) => {
        stop = unlisten;
        AdMob.showInterstitial().catch(() => finish(false));
      });
    });
    void this.loadInterstitial();
    return shown;
  }

  async showBanner() {
    if (!this.sdkReady || this.bannerVisible) return;
    this.bannerVisible = true;
    try {
      if (this.bannerCreated) {
        await AdMob.resumeBanner();
      } else {
        await AdMob.showBanner({
          adId: this.units.banner,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: this.isTesting,
        });
        this.bannerCreated = true;
      }
    } catch (err) {
      console.warn('[ads] banner failed', err);
      this.bannerVisible = false;
    }
  }

  async hideBanner() {
    if (!this.bannerVisible) return;
    this.bannerVisible = false;
    this.bannerPx = 0;
    this.emit();
    try {
      await AdMob.hideBanner();
    } catch {
      /* already hidden */
    }
  }
}
