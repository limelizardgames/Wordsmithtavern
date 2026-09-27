import type { SaveData } from './save';

/** Coins for each day of a daily-visit streak; the cycle repeats after a week. */
export const DAILY_GIFTS = [25, 35, 45, 60, 75, 90, 120];

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return localDateKey(new Date(y, m - 1, d - 1));
}

export interface DailyGiftStatus {
  available: boolean;
  /** Streak length if claimed today. */
  streak: number;
  amount: number;
}

export function dailyGiftStatus(save: SaveData, today: string): DailyGiftStatus {
  const { lastClaim, streak } = save.daily;
  const continues = lastClaim !== '' && lastClaim === previousDateKey(today);
  const nextStreak = lastClaim === today ? streak : continues ? streak + 1 : 1;
  const amount = DAILY_GIFTS[(Math.max(1, nextStreak) - 1) % DAILY_GIFTS.length]!;
  return { available: lastClaim !== today, streak: nextStreak, amount };
}

/** `multiplier` is 2 when the player chose to watch a rewarded ad for a doubled gift. */
export function claimDailyGift(save: SaveData, today: string, multiplier = 1): SaveData {
  const status = dailyGiftStatus(save, today);
  if (!status.available) return save;
  const coins = status.amount * multiplier;
  return {
    ...save,
    coins: save.coins + coins,
    stats: { ...save.stats, coinsEarned: save.stats.coinsEarned + coins },
    daily: { lastClaim: today, streak: status.streak },
  };
}
