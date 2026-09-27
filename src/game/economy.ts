import type { Bonuses, RecipeDef } from './types';
import { filledSlots, patienceFraction, type Order } from './order';

/** Share of the menu price a guest tips when served with full patience. */
export const TIP_RATE = 0.6;
/** Relaxed mode freezes patience; tips settle at this fraction instead. */
export const RELAXED_PATIENCE = 0.6;
export const FAVORITE_BONUS = 0.5;
export const BASE_HINT_COST = 15;
export const MIN_HINT_COST = 5;
export const BONUS_WORD_COINS = 1;
export const STARTING_COINS = 60;

export interface PayoutInput {
  recipe: RecipeDef;
  order: Order;
  bonuses: Bonuses;
  tipMult: number;
  isFavorite: boolean;
  relaxed: boolean;
}

export interface Payout {
  base: number;
  tip: number;
  favorite: number;
  bonusWords: number;
  total: number;
  xp: number;
  /** 1-5 star review. */
  stars: number;
  complete: boolean;
}

export function hintCost(bonuses: Bonuses): number {
  return Math.max(MIN_HINT_COST, BASE_HINT_COST - bonuses.hintDiscount);
}

export function effectivePatience(recipe: RecipeDef, guestPatienceMult: number, bonuses: Bonuses) {
  return Math.round(recipe.patience * guestPatienceMult * (1 + bonuses.patiencePct / 100));
}

export function computePayout(input: PayoutInput): Payout {
  const { recipe, order, bonuses } = input;
  const total = order.slots.length;
  const filled = filledSlots(order);
  const complete = filled === total;
  const share = total > 0 ? filled / total : 0;
  const mood = input.relaxed ? RELAXED_PATIENCE : patienceFraction(order);

  const price = recipe.price * (1 + bonuses.pricePct / 100);
  // Serving early still pays for what made it into the pot, at half price.
  const base = Math.round(complete ? price : price * share * 0.5);
  const favorite = complete && input.isFavorite ? Math.round(base * FAVORITE_BONUS) : 0;
  const tip = complete
    ? Math.round(base * TIP_RATE * mood * input.tipMult * (1 + bonuses.tipPct / 100))
    : 0;
  const bonusWords = order.bonus.length * (BONUS_WORD_COINS + bonuses.bonusWordCoins);

  const rawXp = 10 * recipe.tier + 2 * order.bonus.length + (complete ? 5 : 0);
  const xp = Math.round(rawXp * (complete ? 1 : share * 0.5) * (1 + bonuses.xpPct / 100));

  let stars: number;
  if (!complete) stars = share >= 0.5 ? 2 : 1;
  else if (input.relaxed) stars = 5;
  else stars = 3 + (mood >= 0.35 ? 1 : 0) + (mood >= 0.7 ? 1 : 0);

  return {
    base,
    tip,
    favorite,
    bonusWords,
    total: base + tip + favorite + bonusWords,
    xp,
    stars,
    complete,
  };
}
