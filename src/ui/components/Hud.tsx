import type { ComponentChildren } from 'preact';
import { level, renown, save } from '../../app/state';
import { Icon } from '../art/Icons';
import { formatNumber, useTween } from './Counter';

export function CoinPill({ amount }: { amount?: number }) {
  const coins = useTween(amount ?? save.value.coins);
  return (
    <div class="pill coin-pill" aria-label={`${coins} coins`}>
      <Icon name="coin" size={22} />
      <span class="pill-value">{formatNumber(coins)}</span>
    </div>
  );
}

export function LevelBadge() {
  const { fraction } = renown.value;
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div class="level-badge" aria-label={`Tavern renown level ${level.value}`}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="#2b1a10" stroke="#5a3820" stroke-width="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#f2b134"
          stroke-width="4"
          stroke-dasharray={`${c * fraction} ${c}`}
          stroke-linecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span class="level-badge-num">{level.value}</span>
    </div>
  );
}

/** Top bar: renown level, a title, coins, and an action (usually settings). */
export function Hud({
  title,
  subtitle,
  right,
}: {
  title?: ComponentChildren;
  subtitle?: ComponentChildren;
  right?: ComponentChildren;
}) {
  return (
    <header class="hud">
      <LevelBadge />
      <div class="hud-title">
        {title && <div class="hud-title-main">{title}</div>}
        {subtitle && <div class="hud-title-sub">{subtitle}</div>}
      </div>
      <CoinPill />
      {right}
    </header>
  );
}
