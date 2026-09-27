import { signal } from '@preact/signals';
import type { AdProvider, InterstitialPlacement, RewardedPlacement } from './types';

/** What the pretend-ad overlay should show; resolved by the overlay component. */
export interface MockAdRequest {
  kind: 'rewarded' | 'interstitial';
  placement: RewardedPlacement | InterstitialPlacement;
  resolve: (completed: boolean) => void;
}

export const mockAdRequest = signal<MockAdRequest | null>(null);
export const mockBannerVisible = signal(false);

export const MOCK_BANNER_HEIGHT = 50;

/**
 * In-browser stand-in for AdMob so every ad flow (rewards, interstitial pacing, banner layout)
 * can be tried on a laptop. The "ads" are in-world adverts from the tavern's neighbours.
 */
export class MockAdProvider implements AdProvider {
  readonly kind = 'mock' as const;
  private ready = false;
  private readonly listeners = new Set<() => void>();

  onChange(listener: () => void) {
    this.listeners.add(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  async init() {
    setTimeout(() => {
      this.ready = true;
      this.emit();
    }, 600);
  }

  rewardedReady() {
    return this.ready;
  }

  private show(kind: MockAdRequest['kind'], placement: MockAdRequest['placement']) {
    return new Promise<boolean>((resolve) => {
      mockAdRequest.value = {
        kind,
        placement,
        resolve: (completed) => {
          mockAdRequest.value = null;
          resolve(completed);
        },
      };
    });
  }

  async showRewarded(placement: RewardedPlacement) {
    if (!this.ready) return false;
    this.ready = false;
    this.emit();
    const earned = await this.show('rewarded', placement);
    // "Load" the next one.
    setTimeout(() => {
      this.ready = true;
      this.emit();
    }, 1500);
    return earned;
  }

  async showInterstitial(placement: InterstitialPlacement) {
    await this.show('interstitial', placement);
    return true;
  }

  async showBanner() {
    mockBannerVisible.value = true;
    this.emit();
  }

  async hideBanner() {
    mockBannerVisible.value = false;
    this.emit();
  }

  bannerHeight() {
    return mockBannerVisible.value ? MOCK_BANNER_HEIGHT : 0;
  }

  privacyOptionsRequired() {
    return false;
  }

  async showPrivacyOptions() {}
}
