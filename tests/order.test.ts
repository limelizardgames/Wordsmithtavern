import { describe, expect, it } from 'vitest';
import {
  applyHint,
  calmGuest,
  canHint,
  chooseSlot,
  createOrder,
  hintTargetSlot,
  patienceFraction,
  reshuffle,
  submitWord,
  tickPatience,
  type Order,
} from '../src/game/order';
import { createRng } from '../src/game/rng';
import type { RecipeDef } from '../src/game/types';
import { tinyDictionary } from './helpers';

const dict = tinyDictionary();

const recipe: RecipeDef = {
  id: 'test-brew',
  name: 'Test Brew',
  icon: 'ale',
  tier: 1,
  letters: 5,
  slots: [
    { ingredient: 'hops', min: 3 },
    { ingredient: 'grain', min: 3 },
    { ingredient: 'honey', min: 4 },
    { ingredient: 'magic', min: 4, all: true },
  ],
  price: 20,
  patience: 100,
  unlockLevel: 1,
  cost: 0,
  blurb: '',
};

function newOrder(): Order {
  // Letters of "seat"; the recipe's letter count doesn't matter to the order itself.
  return createOrder(
    recipe,
    { root: 'seat', letters: ['t', 'a', 'e', 's'], familiar: dict.familiarSubwords('seat') },
    100,
  );
}

function play(order: Order, ...words: string[]) {
  let current = order;
  const outcomes = [];
  for (const w of words) {
    const r = submitWord(current, w, dict);
    current = r.order;
    outcomes.push(r.outcome);
  }
  return { order: current, outcomes };
}

describe('submitWord', () => {
  it('rejects short words, foreign letters, unknown words and repeats', () => {
    const o = newOrder();
    expect(submitWord(o, 'at', dict).outcome.kind).toBe('too-short');
    expect(submitWord(o, 'bat', dict).outcome.kind).toBe('not-letters');
    expect(submitWord(o, 'seet', dict).outcome.kind).toBe('not-letters');
    expect(submitWord(o, 'tsa', dict).outcome.kind).toBe('unknown');
    const { outcomes } = play(o, 'eat', 'EAT');
    expect(outcomes[1]!.kind).toBe('repeat');
  });

  it('puts full-length words in the signature slot first', () => {
    const { order, outcomes } = play(newOrder(), 'east');
    expect(outcomes[0]).toEqual({ kind: 'slot', slotIndex: 3, complete: false });
    expect(order.slots[3]!.word).toBe('east');
  });

  it('fills the most demanding slot a word qualifies for', () => {
    const { order } = play(newOrder(), 'seat', 'teas', 'eat');
    expect(order.slots.map((s) => s.word)).toEqual(['eat', undefined, 'teas', 'seat']);
  });

  it('counts leftover words as bonus words and completes the order', () => {
    const { order, outcomes } = play(newOrder(), 'eat', 'tea', 'ate', 'seat', 'east');
    expect(outcomes.map((o) => o.kind)).toEqual(['slot', 'slot', 'bonus', 'slot', 'slot']);
    expect(order.bonus).toEqual(['ate']);
    expect(order.complete).toBe(true);
    expect(outcomes[4]).toEqual({ kind: 'slot', slotIndex: 2, complete: true });
    expect(submitWord(order, 'sat', dict).outcome.kind).toBe('repeat');
  });

  it('accepts rarer dictionary words', () => {
    const { outcomes } = play(newOrder(), 'etas');
    expect(outcomes[0]!.kind).toBe('slot');
  });
});

describe('hints', () => {
  it('targets the signature slot first and reveals one letter at a time', () => {
    const rng = createRng(1);
    let order = newOrder();
    expect(hintTargetSlot(order)).toBe(3);
    order = applyHint(order, dict, rng)!;
    const slot = order.slots[3]!;
    expect(slot.hint).toBe('seat');
    expect(slot.revealed).toBe(1);
    order = applyHint(order, dict, rng)!;
    order = applyHint(order, dict, rng)!;
    expect(order.slots[3]!.revealed).toBe(3);
    expect(order.hintsUsed).toBe(3);
    // The final letter is never revealed; the next hint moves on to another slot.
    order = applyHint(order, dict, rng)!;
    expect(order.slots[3]!.revealed).toBe(3);
    expect(order.slots[2]!.hint).toBeDefined();
  });

  it('prefers the hinted slot when the hinted word is played', () => {
    const rng = createRng(3);
    let order = play(newOrder(), 'seat').order;
    order = applyHint(order, dict, rng)!;
    const hinted = order.slots[2]!.hint!;
    expect(hinted).toHaveLength(4);
    expect(chooseSlot(order, hinted)).toBe(2);
    order = submitWord(order, hinted, dict).order;
    expect(order.slots[2]!.word).toBe(hinted);
    expect(order.slots[2]!.hint).toBeUndefined();
  });

  it('stops offering hints once the order is complete', () => {
    const { order } = play(newOrder(), 'eat', 'tea', 'seat', 'east');
    expect(order.complete).toBe(true);
    expect(canHint(order)).toBe(false);
    expect(applyHint(order, dict, createRng(1))).toBeUndefined();
  });
});

describe('patience', () => {
  it('drains, bottoms out at zero and can be topped up once', () => {
    let order = tickPatience(newOrder(), 30);
    expect(patienceFraction(order)).toBeCloseTo(0.7);
    order = tickPatience(order, 500);
    expect(order.patienceLeft).toBe(0);
    order = calmGuest(order);
    expect(patienceFraction(order)).toBeCloseTo(0.75);
    order = tickPatience(order, 10);
    expect(calmGuest(order).patienceLeft).toBe(order.patienceLeft);
  });

  it('stops draining once the order is served', () => {
    const { order } = play(newOrder(), 'eat', 'tea', 'seat', 'east');
    expect(tickPatience(order, 50).patienceLeft).toBe(100);
  });
});

it('reshuffle keeps the same letters in a new order', () => {
  const order = newOrder();
  const shuffled = reshuffle(order, createRng(5));
  expect(shuffled.letters.slice().sort()).toEqual(order.letters.slice().sort());
  expect(shuffled.letters.join('')).not.toBe(order.letters.join(''));
});
