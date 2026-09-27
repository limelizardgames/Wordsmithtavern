import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { createNewSave } from '../src/game/save';
import {
  AD_RULES,
  bannerAllowed,
  noteInterstitialShown,
  noteNightCompleted,
  noteRewardedWatched,
  shouldShowInterstitial,
} from '../src/services/ads/policy';

const ads = () => createNewSave(CONTENT.newGame).ads;
const HOUR = 3_600_000;

describe('ad pacing', () => {
  it('never interrupts the first nights', () => {
    const state = { ...ads(), nightsSinceInterstitial: 10 };
    expect(shouldShowInterstitial(state, AD_RULES.graceNights - 1, HOUR)).toBe(false);
    expect(shouldShowInterstitial(state, AD_RULES.graceNights, HOUR)).toBe(true);
  });

  it('spaces interstitials out by nights and time', () => {
    let state = noteInterstitialShown({ ...ads(), nightsSinceInterstitial: 5 }, HOUR);
    state = noteNightCompleted(state);
    expect(shouldShowInterstitial(state, 10, 2 * HOUR)).toBe(false);
    state = noteNightCompleted(state);
    expect(shouldShowInterstitial(state, 10, 2 * HOUR)).toBe(true);
    expect(shouldShowInterstitial(state, 10, HOUR + 60_000)).toBe(false);
  });

  it('skips the interstitial right after a rewarded ad', () => {
    const state = noteRewardedWatched({ ...ads(), nightsSinceInterstitial: 5 }, HOUR);
    expect(shouldShowInterstitial(state, 10, HOUR + 30_000)).toBe(false);
    expect(shouldShowInterstitial(state, 10, HOUR + 10 * 60_000)).toBe(true);
  });

  it('respects remove-ads and keeps banners off the puzzle screen', () => {
    const state = { ...ads(), removeAds: true, nightsSinceInterstitial: 5 };
    expect(shouldShowInterstitial(state, 10, HOUR)).toBe(false);
    expect(bannerAllowed(state, 'hub')).toBe(false);
    expect(bannerAllowed(ads(), 'hub')).toBe(true);
    expect(bannerAllowed(ads(), 'service')).toBe(false);
  });
});
