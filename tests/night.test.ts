import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { NO_BONUSES } from '../src/game/bonuses';
import type { Payout } from '../src/game/economy';
import {
  applyLevelUps,
  closeNight,
  describeCustomer,
  doubleNight,
  dueChapter,
  isGuestUnlocked,
  nightTotals,
  planNight,
  serveOrder,
  startShift,
} from '../src/game/night';
import { xpForLevel } from '../src/game/progression';
import { createRng } from '../src/game/rng';
import { createNewSave, type SaveData } from '../src/game/save';
import { buyFurniture } from '../src/game/shop';

const guest = (id: string) => CONTENT.guests.get(id)!;
const fullPayout: Payout = {
  base: 12,
  tip: 6,
  favorite: 0,
  bonusWords: 1,
  total: 19,
  xp: 16,
  stars: 5,
  complete: true,
};
const earlyPayout: Payout = { ...fullPayout, total: 3, tip: 0, xp: 2, stars: 1, complete: false };
const words = { found: ['ale', 'tale'], bonus: ['lea'], hintsUsed: 0, root: 'later' };

function serveAll(save: SaveData, payout = fullPayout, seed = 1): SaveData {
  const rng = createRng(seed);
  let s = save;
  while (s.shift && s.shift.index < s.shift.customers.length) {
    s = serveOrder(s, CONTENT, payout, words, rng).save;
  }
  return closeNight(s);
}

function playNights(save: SaveData, nights: number, payout = fullPayout): SaveData {
  let s = save;
  for (let n = 0; n < nights; n++) {
    const rng = createRng(100 + n);
    s = startShift(s, planNight(s, CONTENT, NO_BONUSES, rng));
    s = serveAll(s, payout, n);
  }
  return s;
}

describe('planNight', () => {
  it('opens the first night with Barnaby’s first chapter', () => {
    const save = createNewSave(CONTENT.newGame);
    const plan = planNight(save, CONTENT, NO_BONUSES, createRng(1));
    expect(plan).toHaveLength(3);
    expect(plan[0]).toMatchObject({ guestId: 'barnaby', chapter: 0 });
    for (const p of plan) expect(save.recipes).toContain(p.recipeId);
  });

  it('introduces one newcomer per night and spaces out chapters', () => {
    let save = createNewSave(CONTENT.newGame);
    save = playNights(save, 1);
    expect(save.guests.barnaby!.chapter).toBe(1);
    const night2 = planNight(save, CONTENT, NO_BONUSES, createRng(2));
    expect(night2.filter((p) => p.chapter === 0).map((p) => p.guestId)).toEqual(['grizelda']);
    // Barnaby played a chapter last night, so he isn't due again yet.
    expect(dueChapter(guest('barnaby'), save, CONTENT, save.day)).toBeUndefined();
    expect(dueChapter(guest('barnaby'), save, CONTENT, save.day + 1)).toBe(1);
  });

  it('keeps guests locked until their level and furniture requirements are met', () => {
    let save = createNewSave(CONTENT.newGame);
    save = { ...save, xp: xpForLevel(3), coins: 1000 };
    expect(isGuestUnlocked(guest('reginald'), save, CONTENT)).toBe(false);
    save = buyFurniture(save, CONTENT.furniture.get('notice-board')!);
    expect(isGuestUnlocked(guest('reginald'), save, CONTENT)).toBe(true);
    expect(isGuestUnlocked(guest('ember'), { ...save, xp: xpForLevel(12) }, CONTENT)).toBe(false);
  });

  it('eventually tells every story to the end', () => {
    let save = createNewSave(CONTENT.newGame);
    save = { ...save, xp: xpForLevel(12), coins: 100_000 };
    for (const id of [
      'notice-board',
      'potted-fern',
      'crystal-ball',
      'ship-bottle',
      'brass-register',
    ]) {
      save = buyFurniture(save, CONTENT.furniture.get(id)!);
    }
    save = playNights(save, 80);
    for (const g of CONTENT.guestList) {
      expect(save.guests[g.id]?.chapter, g.id).toBe(g.story.length);
    }
    // Story rewards landed in the tavern.
    expect(save.furniture.owned).toEqual(
      expect.arrayContaining(['legendary-tankard', 'holy-grill', 'hearth-dragon', 'golden-lute']),
    );
    expect(save.recipes).toContain('knightly-kebab');
  });
});

describe('serving', () => {
  it('pays out, advances the story, and grants chapter rewards', () => {
    let save = createNewSave(CONTENT.newGame);
    save = startShift(save, planNight(save, CONTENT, NO_BONUSES, createRng(1)));
    const coins = save.coins;
    const out = serveOrder(save, CONTENT, fullPayout, words, createRng(1));
    expect(out.chapterCompleted?.title).toBe('A Bard Arrives');
    expect(out.reward?.coins).toBe(30);
    expect(out.save.coins).toBe(coins + fullPayout.total + 30);
    expect(out.save.guests.barnaby).toMatchObject({
      chapter: 1,
      friendship: 1,
      visits: 1,
      lastChapterDay: 1,
    });
    expect(out.save.shift!.index).toBe(1);
    expect(out.result.review.length).toBeGreaterThan(0);
    expect(out.save.recentRoots).toContain('later');
  });

  it('does not advance the story when served early', () => {
    let save = createNewSave(CONTENT.newGame);
    save = startShift(save, planNight(save, CONTENT, NO_BONUSES, createRng(1)));
    const out = serveOrder(save, CONTENT, earlyPayout, words, createRng(1));
    expect(out.chapterCompleted).toBeUndefined();
    expect(out.save.guests.barnaby).toMatchObject({ chapter: 0, friendship: 0, visits: 1 });
    // They come back for the same chapter.
    const next = closeNight(serveAll(out.save));
    expect(dueChapter(guest('barnaby'), next, CONTENT, next.day)).toBe(0);
  });

  it('totals and doubles the night once', () => {
    let save = createNewSave(CONTENT.newGame);
    save = startShift(save, planNight(save, CONTENT, NO_BONUSES, createRng(1)));
    for (let i = 0; i < 3; i++)
      save = serveOrder(save, CONTENT, fullPayout, words, createRng(i)).save;
    const totals = nightTotals(save.shift!);
    expect(totals).toMatchObject({ orders: 3, complete: 3, coins: 57, tips: 18, averageStars: 5 });
    const before = save.coins;
    save = doubleNight(save);
    expect(save.coins).toBe(before + 57);
    expect(doubleNight(save).coins).toBe(save.coins);
    save = closeNight(save);
    expect(save.shift).toBeUndefined();
    expect(save.day).toBe(2);
  });

  it('describes townsfolk and named guests', () => {
    const save = createNewSave(CONTENT.newGame);
    const plan = planNight(save, CONTENT, NO_BONUSES, createRng(4));
    for (const p of plan) {
      const who = describeCustomer(p, CONTENT);
      expect(who.name.length).toBeGreaterThan(0);
      expect(who.portrait.species).toBeDefined();
    }
  });

  it('pays level-up coins for each level crossed', () => {
    const save = { ...createNewSave(CONTENT.newGame), xp: xpForLevel(4) };
    const { save: after, news } = applyLevelUps(save, 0, CONTENT);
    expect(news.map((n) => n.level)).toEqual([2, 3, 4]);
    expect(after.coins - save.coins).toBe(25 * (2 + 3 + 4));
    expect(news[2]!.moreGuestsPerNight).toBe(true);
    expect(news[0]!.recipes.map((r) => r.id)).toContain('barkroot-tea');
  });
});
