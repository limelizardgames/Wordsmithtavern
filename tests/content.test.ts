import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { BARLEY, REVIEWS } from '../src/content/barley';
import { FURNITURE_SLOTS } from '../src/content/furniture';
import { isSolvable } from '../src/game/puzzle';
import { loadTestDictionary } from './helpers';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('content integrity', () => {
  it('has unique ids', () => {
    expect(unique(CONTENT.recipeList.map((r) => r.id))).toBe(true);
    expect(unique(CONTENT.furnitureList.map((f) => f.id))).toBe(true);
    expect(unique(CONTENT.guestList.map((g) => g.id))).toBe(true);
    expect(unique(CONTENT.townsfolkList.map((t) => t.id))).toBe(true);
  });

  it('only references things that exist', () => {
    for (const g of CONTENT.guestList) {
      for (const fav of g.favorites) expect(CONTENT.recipes.has(fav), `${g.id} favourite ${fav}`).toBe(true);
      if (g.unlock.furniture) expect(CONTENT.furniture.has(g.unlock.furniture)).toBe(true);
      if (g.unlock.afterStoryOf) expect(CONTENT.guests.has(g.unlock.afterStoryOf)).toBe(true);
      for (const ch of g.story) {
        if (ch.recipe) expect(CONTENT.recipes.has(ch.recipe)).toBe(true);
        if (ch.reward?.recipe) expect(CONTENT.recipes.has(ch.reward.recipe)).toBe(true);
        if (ch.reward?.furniture) expect(CONTENT.furniture.has(ch.reward.furniture)).toBe(true);
        for (const dep of ch.after ?? []) expect(CONTENT.guests.has(dep)).toBe(true);
      }
    }
    for (const f of CONTENT.furnitureList) {
      if (f.attracts) {
        const g = CONTENT.guests.get(f.attracts);
        expect(g?.unlock.furniture, `${f.id} attracts ${f.attracts}`).toBe(f.id);
      }
    }
  });

  it('gives every story guest a full tale with a special keepsake at the end', () => {
    const specials = new Set<string>();
    for (const g of CONTENT.guestList) {
      expect(g.story, g.id).toHaveLength(5);
      const finale = g.story[4]!.reward;
      if (finale?.furniture) specials.add(finale.furniture);
      for (const key of ['greet', 'order', 'happy', 'grumpy', 'waiting', 'banter'] as const) {
        expect(g.lines[key].length, `${g.id}.${key}`).toBeGreaterThan(0);
      }
    }
    // Every special furniture piece is somebody's keepsake (so none is unobtainable).
    for (const f of CONTENT.furnitureList.filter((x) => x.special)) {
      expect(specials.has(f.id), f.id).toBe(true);
    }
  });

  it('uses only the {recipe} placeholder', () => {
    const texts: string[] = [];
    for (const g of CONTENT.guestList) {
      texts.push(...Object.values(g.lines).flat());
      for (const ch of g.story) texts.push(ch.order, ...ch.arrive.map((l) => l.text), ...ch.done.map((l) => l.text));
    }
    for (const t of CONTENT.townsfolkList) texts.push(...Object.values(t.lines).flat());
    texts.push(...Object.values(REVIEWS).flat());
    for (const text of texts) {
      expect(text.replaceAll('{recipe}', ''), text).not.toMatch(/[{}]/);
    }
    for (const g of CONTENT.guestList) {
      for (const line of g.lines.order) expect(line, g.id).toContain('{recipe}');
      for (const ch of g.story) expect(ch.order, `${g.id}: ${ch.title}`).toContain('{recipe}');
    }
    expect(BARLEY.intro.length).toBeGreaterThan(0);
  });

  it('places furniture in known slots and has a default for the essentials', () => {
    const slots = new Set(FURNITURE_SLOTS.map((s) => s.slot));
    for (const f of CONTENT.furnitureList) expect(slots.has(f.slot)).toBe(true);
    for (const slot of ['hearth', 'lights', 'window', 'floorRight'] as const) {
      expect(CONTENT.furnitureList.filter((f) => f.slot === slot && f.default)).toHaveLength(1);
    }
  });

  it('makes every recipe solvable from nearly every root word', () => {
    const dict = loadTestDictionary();
    for (const r of CONTENT.recipeList) {
      expect(r.slots.length).toBeGreaterThanOrEqual(3);
      for (const s of r.slots) expect(s.min).toBeLessThanOrEqual(r.letters);
      const roots = dict.rootsOfLength(r.letters);
      const sample = roots.filter((_, i) => i % 5 === 0);
      const ok = sample.filter((root) => isSolvable(r.slots, dict.familiarSubwords(root), r.letters, 2));
      expect(ok.length / sample.length, r.id).toBeGreaterThan(0.85);
    }
  });
});
