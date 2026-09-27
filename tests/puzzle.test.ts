import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { generatePuzzle, isSolvable } from '../src/game/puzzle';
import { createRng } from '../src/game/rng';
import { loadTestDictionary } from './helpers';

const dict = loadTestDictionary();

describe('isSolvable', () => {
  const slots = [
    { ingredient: 'hops' as const, min: 3 },
    { ingredient: 'grain' as const, min: 3 },
    { ingredient: 'honey' as const, min: 4 },
  ];

  it('needs a distinct word for every slot', () => {
    expect(isSolvable(slots, ['seat', 'eat', 'tea'], 4)).toBe(true);
    expect(isSolvable(slots, ['eat', 'tea', 'ate'], 4)).toBe(false);
    expect(isSolvable(slots, ['seat', 'east'], 4)).toBe(false);
  });

  it('reserves full-length words for signature slots', () => {
    const withAll = [...slots, { ingredient: 'magic' as const, min: 4, all: true }];
    expect(isSolvable(withAll, ['seat', 'east', 'eat', 'tea'], 4)).toBe(true);
    expect(isSolvable(withAll, ['seat', 'eat', 'tea'], 4)).toBe(false);
  });

  it('can demand spare short words', () => {
    expect(isSolvable(slots, ['seat', 'eat', 'tea'], 4, 2)).toBe(false);
    expect(isSolvable(slots, ['seat', 'east', 'sate', 'eat', 'tea'], 4, 2)).toBe(true);
  });
});

describe('generatePuzzle', () => {
  it('builds a solvable puzzle for every recipe', () => {
    const rng = createRng(1234);
    for (const recipe of CONTENT.recipeList) {
      for (let i = 0; i < 5; i++) {
        const puzzle = generatePuzzle(recipe, dict, rng);
        expect(puzzle.root).toHaveLength(recipe.letters);
        expect(puzzle.letters.slice().sort().join('')).toBe(puzzle.root.split('').sort().join(''));
        expect(puzzle.letters.join('')).not.toBe(puzzle.root);
        expect(isSolvable(recipe.slots, puzzle.familiar, recipe.letters)).toBe(true);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const recipe = CONTENT.recipes.get('mushroom-pie')!;
    const a = generatePuzzle(recipe, dict, createRng(99));
    const b = generatePuzzle(recipe, dict, createRng(99));
    expect(a).toEqual(b);
  });

  it('avoids recently used roots when it can', () => {
    const recipe = CONTENT.recipes.get('frothy-ale')!;
    const recent = new Set(dict.rootsOfLength(5).slice(0, 400));
    const rng = createRng(7);
    for (let i = 0; i < 10; i++) {
      expect(recent.has(generatePuzzle(recipe, dict, rng, { avoid: recent }).root)).toBe(false);
    }
  });
});
