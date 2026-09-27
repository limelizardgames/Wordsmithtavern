import type { Dictionary } from './dictionary';
import { canSpell, letterCounts, normalizeWord } from './letters';
import type { Puzzle } from './puzzle';
import { shuffle, type Rng } from './rng';
import type { IngredientId, RecipeDef, RecipeId } from './types';

export const MIN_WORD_LENGTH = 3;

export interface SlotState {
  ingredient: IngredientId;
  min: number;
  all: boolean;
  word?: string;
  /** Word the Taste Test hint is steering towards, and how many of its letters are revealed. */
  hint?: string;
  revealed: number;
}

export interface Order {
  recipeId: RecipeId;
  root: string;
  letters: string[];
  slots: SlotState[];
  /** Every accepted word, in the order it was found. */
  found: string[];
  /** Accepted words that didn't fill a slot. They go in the tip jar. */
  bonus: string[];
  familiar: string[];
  patienceMax: number;
  patienceLeft: number;
  /** The rewarded "calm the guest" boost can be used once per order. */
  calmed: boolean;
  hintsUsed: number;
  complete: boolean;
}

export type SubmitOutcome =
  | { kind: 'too-short' }
  | { kind: 'not-letters' }
  | { kind: 'unknown' }
  | { kind: 'repeat' }
  | { kind: 'slot'; slotIndex: number; complete: boolean }
  | { kind: 'bonus' };

export function createOrder(recipe: RecipeDef, puzzle: Puzzle, patienceSeconds: number): Order {
  return {
    recipeId: recipe.id,
    root: puzzle.root,
    letters: puzzle.letters.slice(),
    slots: recipe.slots.map((s) => ({
      ingredient: s.ingredient,
      min: s.min,
      all: !!s.all,
      revealed: 0,
    })),
    found: [],
    bonus: [],
    familiar: puzzle.familiar.slice(),
    patienceMax: patienceSeconds,
    patienceLeft: patienceSeconds,
    calmed: false,
    hintsUsed: 0,
    complete: false,
  };
}

function slotAccepts(slot: SlotState, word: string, letterCount: number): boolean {
  if (slot.word) return false;
  return slot.all ? word.length === letterCount : word.length >= slot.min;
}

/**
 * Chooses the slot a word should fill: the one the hint was steering towards if it matches,
 * otherwise the most demanding open slot the word qualifies for (signature slots first).
 */
export function chooseSlot(order: Order, word: string): number {
  const n = order.letters.length;
  const hinted = order.slots.findIndex((s) => s.hint === word && slotAccepts(s, word, n));
  if (hinted >= 0) return hinted;
  let best = -1;
  let bestScore = -1;
  order.slots.forEach((slot, i) => {
    if (!slotAccepts(slot, word, n)) return;
    const score = slot.all ? 100 : slot.min;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

export function submitWord(
  order: Order,
  raw: string,
  dict: Dictionary,
): { order: Order; outcome: SubmitOutcome } {
  const word = normalizeWord(raw);
  if (order.complete) return { order, outcome: { kind: 'repeat' } };
  if (word.length < MIN_WORD_LENGTH) return { order, outcome: { kind: 'too-short' } };
  if (!canSpell(word, letterCounts(order.letters.join('')))) {
    return { order, outcome: { kind: 'not-letters' } };
  }
  if (order.found.includes(word)) return { order, outcome: { kind: 'repeat' } };
  if (!dict.isValid(word)) return { order, outcome: { kind: 'unknown' } };

  const found = [...order.found, word];
  const slotIndex = chooseSlot(order, word);
  if (slotIndex < 0) {
    return { order: { ...order, found, bonus: [...order.bonus, word] }, outcome: { kind: 'bonus' } };
  }

  const slots = order.slots.map((slot, i) => {
    if (i === slotIndex) return { ...slot, word, hint: undefined, revealed: 0 };
    // A hint pointing at a word that's now used elsewhere is stale.
    if (slot.hint === word) return { ...slot, hint: undefined, revealed: 0 };
    return slot;
  });
  const complete = slots.every((s) => s.word);
  return {
    order: { ...order, found, slots, complete },
    outcome: { kind: 'slot', slotIndex, complete },
  };
}

/** Never reveal a hint's final letter: the player should still get to "cook" it. */
function hintMaxed(slot: SlotState): boolean {
  return !!slot.hint && slot.revealed >= slot.hint.length - 1;
}

/**
 * The open slot a Taste Test would help with: one already being hinted, otherwise the most
 * demanding open slot (signature slots first, then the longest).
 */
export function hintTargetSlot(order: Order): number {
  let best = -1;
  let bestScore = -1;
  order.slots.forEach((slot, i) => {
    if (slot.word || hintMaxed(slot)) return;
    const score = (slot.hint ? 1000 : 0) + (slot.all ? 100 : slot.min);
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

function pickHintWord(order: Order, slot: SlotState, dict: Dictionary, rng: Rng): string | undefined {
  const n = order.letters.length;
  const taken = new Set([...order.found, ...order.slots.map((s) => s.hint).filter(Boolean)]);
  const candidates = order.familiar.filter(
    (w) => !taken.has(w) && (slot.all ? w.length === n : w.length >= slot.min),
  );
  if (candidates.length === 0) return undefined;
  if (slot.all && candidates.includes(order.root)) return order.root;
  // Prefer the most familiar words of exactly the needed length.
  const rank = (w: string) =>
    (dict.tierOf(w) === 'core' ? 0 : 10) + (slot.all ? 0 : w.length - slot.min);
  const bestRank = Math.min(...candidates.map(rank));
  const best = candidates.filter((w) => rank(w) === bestRank);
  return shuffle(rng, best)[0];
}

/** Can another Taste Test be used right now? */
export function canHint(order: Order): boolean {
  return !order.complete && hintTargetSlot(order) >= 0;
}

/** Reveals one more letter towards a word for the most demanding open slot. */
export function applyHint(order: Order, dict: Dictionary, rng: Rng): Order | undefined {
  if (!canHint(order)) return undefined;
  const target = hintTargetSlot(order);
  const slot = order.slots[target]!;
  let next: SlotState;
  if (slot.hint) {
    next = { ...slot, revealed: slot.revealed + 1 };
  } else {
    const word = pickHintWord(order, slot, dict, rng);
    if (!word) return undefined;
    next = { ...slot, hint: word, revealed: 1 };
  }
  return {
    ...order,
    slots: order.slots.map((s, i) => (i === target ? next : s)),
    hintsUsed: order.hintsUsed + 1,
  };
}

export function filledSlots(order: Order): number {
  return order.slots.filter((s) => s.word).length;
}

export function tickPatience(order: Order, seconds: number): Order {
  if (order.complete || order.patienceLeft <= 0) return order;
  return { ...order, patienceLeft: Math.max(0, order.patienceLeft - seconds) };
}

export function patienceFraction(order: Order): number {
  return order.patienceMax > 0 ? Math.max(0, Math.min(1, order.patienceLeft / order.patienceMax)) : 0;
}

/** Rewarded "a song from the bard" boost: tops patience back up to at least 75%. */
export function calmGuest(order: Order): Order {
  if (order.calmed) return order;
  return {
    ...order,
    calmed: true,
    patienceLeft: Math.max(order.patienceLeft, Math.round(order.patienceMax * 0.75)),
  };
}

export function reshuffle(order: Order, rng: Rng): Order {
  let letters = shuffle(rng, order.letters);
  for (let i = 0; i < 5 && letters.join('') === order.letters.join(''); i++) {
    letters = shuffle(rng, order.letters);
  }
  return { ...order, letters };
}
