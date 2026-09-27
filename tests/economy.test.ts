import { describe, expect, it } from 'vitest';
import { NO_BONUSES } from '../src/game/bonuses';
import { computePayout, hintCost } from '../src/game/economy';
import { createOrder, submitWord, tickPatience, type Order } from '../src/game/order';
import { levelFromXp, levelProgress, xpForLevel, customersPerDay } from '../src/game/progression';
import type { RecipeDef } from '../src/game/types';
import { tinyDictionary } from './helpers';

const dict = tinyDictionary();
const recipe: RecipeDef = {
  id: 'r',
  name: 'R',
  icon: 'ale',
  tier: 2,
  letters: 5,
  slots: [
    { ingredient: 'hops', min: 3 },
    { ingredient: 'honey', min: 4 },
  ],
  price: 20,
  patience: 100,
  unlockLevel: 1,
  cost: 0,
  blurb: '',
};

/** Waits `elapsed` seconds, then plays the words. */
function order(words: string[], elapsed = 0): Order {
  let o = createOrder(recipe, { root: 'seat', letters: ['s', 'e', 'a', 't'], familiar: [] }, 100);
  o = tickPatience(o, elapsed);
  for (const w of words) o = submitWord(o, w, dict).order;
  return o;
}

const base = { recipe, bonuses: NO_BONUSES, tipMult: 1, isFavorite: false, relaxed: false };

describe('computePayout', () => {
  it('pays price plus a patience-scaled tip for a complete order', () => {
    const p = computePayout({ ...base, order: order(['eat', 'seat']) });
    expect(p.complete).toBe(true);
    expect(p.base).toBe(20);
    expect(p.tip).toBe(12);
    expect(p.stars).toBe(5);
    expect(p.total).toBe(32);
    expect(p.xp).toBe(25);
  });

  it('shrinks the tip as patience runs out, but always pays the price', () => {
    const slow = computePayout({ ...base, order: order(['eat', 'seat'], 100) });
    expect(slow.tip).toBe(0);
    expect(slow.base).toBe(20);
    expect(slow.stars).toBe(3);
  });

  it('pays half price for what made it into the pot when served early', () => {
    const p = computePayout({ ...base, order: order(['eat']) });
    expect(p.complete).toBe(false);
    expect(p.base).toBe(5);
    expect(p.tip).toBe(0);
    expect(p.stars).toBe(2);
  });

  it('adds favourites, bonus words and furniture bonuses', () => {
    const p = computePayout({
      ...base,
      isFavorite: true,
      order: order(['eat', 'tea', 'seat']),
      bonuses: { ...NO_BONUSES, tipPct: 50, bonusWordCoins: 2, pricePct: 10 },
    });
    expect(p.base).toBe(22);
    expect(p.favorite).toBe(11);
    expect(p.tip).toBe(20);
    expect(p.bonusWords).toBe(3);
  });

  it('keeps tips steady in relaxed mode', () => {
    const p = computePayout({ ...base, relaxed: true, order: order(['eat', 'seat'], 100) });
    expect(p.tip).toBe(7);
    expect(p.stars).toBe(5);
  });

  it('prices hints with a floor', () => {
    expect(hintCost(NO_BONUSES)).toBe(15);
    expect(hintCost({ ...NO_BONUSES, hintDiscount: 50 })).toBe(5);
  });
});

describe('progression', () => {
  it('maps renown to levels and back', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(60);
    expect(xpForLevel(3)).toBe(180);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(59)).toBe(1);
    expect(levelFromXp(60)).toBe(2);
    expect(levelFromXp(xpForLevel(12))).toBe(12);
    expect(levelProgress(120)).toEqual({ level: 2, current: 60, needed: 120, fraction: 0.5 });
  });

  it('grows the nightly crowd with level and furniture, up to a cap', () => {
    expect(customersPerDay(1, 0)).toBe(3);
    expect(customersPerDay(4, 0)).toBe(4);
    expect(customersPerDay(8, 0)).toBe(5);
    expect(customersPerDay(8, 5)).toBe(6);
  });
});
