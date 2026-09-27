/** Renown (XP) and tavern levels. */

const XP_STEP = 60;

/** Total renown needed to reach `level` (level 1 needs 0). */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return (XP_STEP * (n - 1) * n) / 2;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** Renown earned within the current level. */
  current: number;
  /** Renown this level takes in total. */
  needed: number;
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const needed = xpForLevel(level + 1) - floor;
  const current = xp - floor;
  return { level, current, needed, fraction: needed > 0 ? current / needed : 0 };
}

/** Guests per night before furniture bonuses. */
export function baseCustomersPerDay(level: number): number {
  return 3 + (level >= 4 ? 1 : 0) + (level >= 8 ? 1 : 0);
}

export const MAX_CUSTOMERS_PER_DAY = 6;

export function customersPerDay(level: number, extraCustomers: number): number {
  return Math.min(MAX_CUSTOMERS_PER_DAY, baseCustomersPerDay(level) + extraCustomers);
}

/** Recipe tier the tavern "should" be serving at this level; orders lean towards it. */
export function targetTier(level: number): number {
  if (level >= 9) return 4;
  if (level >= 6) return 3;
  if (level >= 3) return 2;
  return 1;
}
