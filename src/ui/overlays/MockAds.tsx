import { useEffect, useMemo, useState } from 'preact/hooks';
import { ads } from '../../services/ads';
import { MOCK_BANNER_HEIGHT, mockAdRequest, mockBannerVisible } from '../../services/ads/mock';
import { Icon } from '../art/Icons';
import './mock-ads.css';

/** In-world pretend adverts, used in the browser so ad flows can be tested without a device. */
const ADVERTS = [
  {
    title: 'Pip’s Genuine Dragon Eggs',
    line: 'Definitely not potatoes. Probably. No refunds.',
    color: '#4f8a35',
  },
  {
    title: 'Fizzlewick’s Spelling School',
    line: 'Learn to spell FIREBALL correctly. Most students survive!',
    color: '#5b3b8c',
  },
  {
    title: 'Stonebeard Forge',
    line: 'Tankards so sturdy they outlive you. Guaranteed.',
    color: '#8a5a36',
  },
  {
    title: 'Zephyrine’s Fortunes',
    line: 'She already knows you’re reading this.',
    color: '#2a6f73',
  },
];

const REWARD_SECONDS = 5;
const SKIP_SECONDS = 3;

export function MockAdOverlay() {
  const request = mockAdRequest.value;
  const [left, setLeft] = useState(REWARD_SECONDS);
  const advert = useMemo(() => ADVERTS[Math.floor(Math.random() * ADVERTS.length)]!, [request]);

  useEffect(() => {
    if (!request) return;
    setLeft(request.kind === 'rewarded' ? REWARD_SECONDS : SKIP_SECONDS);
    const timer = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [request]);

  if (!request) return null;
  const rewarded = request.kind === 'rewarded';
  const done = left === 0;
  return (
    <div class="mock-ad" role="dialog" aria-label="Advertisement">
      <div class="mock-ad-top">
        <span class="mock-ad-label">Test ad · {rewarded ? 'Rewarded' : 'Interstitial'}</span>
        {done ? (
          <button
            class="mock-ad-close"
            onClick={() => request.resolve(rewarded)}
            aria-label="Close ad"
          >
            <Icon name="close" size={22} />
          </button>
        ) : (
          <span class="mock-ad-timer">{rewarded ? `Reward in ${left}s` : `Skip in ${left}s`}</span>
        )}
      </div>
      <div class="mock-ad-body" style={{ background: advert.color }}>
        <div class="mock-ad-title">{advert.title}</div>
        <p>{advert.line}</p>
        {rewarded && !done && (
          <button class="mock-ad-skip" onClick={() => request.resolve(false)}>
            Close early (no reward)
          </button>
        )}
        {rewarded && done && (
          <p class="mock-ad-earned">Reward earned! Close the ad to collect it.</p>
        )}
      </div>
    </div>
  );
}

export function MockBanner() {
  if (!mockBannerVisible.value || ads.kind.value !== 'mock') return null;
  return (
    <div class="mock-banner" style={{ height: MOCK_BANNER_HEIGHT }} aria-label="Advertisement">
      <span class="mock-ad-label">Test banner</span> Stonebeard Forge · Tankards that outlive you
    </div>
  );
}
