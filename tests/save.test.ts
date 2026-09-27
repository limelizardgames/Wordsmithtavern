import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { claimDailyGift, dailyGiftStatus, DAILY_GIFTS, localDateKey } from '../src/game/daily';
import { createNewSave, migrateSave } from '../src/game/save';

describe('saves', () => {
  it('starts a new game with starter recipes and default furniture on display', () => {
    const save = createNewSave(CONTENT.newGame, 0);
    expect(save.recipes).toEqual(['frothy-ale', 'hearty-stew']);
    expect(save.furniture.placed.hearth).toBe('hearth-sooty');
    expect(save.furniture.owned).toContain('window-dusty');
    expect(save.day).toBe(1);
  });

  it('recovers from garbage', () => {
    for (const junk of [null, 42, 'save', [], { coins: 'lots' }]) {
      const save = migrateSave(junk, CONTENT.newGame);
      expect(save.coins).toBe(createNewSave(CONTENT.newGame).coins);
      expect(save.recipes.length).toBeGreaterThan(0);
    }
  });

  it('keeps valid progress and drops invalid fields', () => {
    const original = createNewSave(CONTENT.newGame, 5);
    const raw = JSON.parse(
      JSON.stringify({
        ...original,
        coins: 999,
        xp: 1234,
        recipes: ['honey-mead', 7],
        guests: { barnaby: { chapter: 2, friendship: 3, visits: 4, lastChapterDay: 6 }, junk: 1 },
        settings: { sound: false, music: 'loud' },
        flags: { introDone: true, weird: 'yes' },
      }),
    );
    const save = migrateSave(raw, CONTENT.newGame);
    expect(save.coins).toBe(999);
    expect(save.xp).toBe(1234);
    expect(save.recipes).toEqual(['frothy-ale', 'hearty-stew', 'honey-mead']);
    expect(save.guests.barnaby).toEqual({
      chapter: 2,
      friendship: 3,
      visits: 4,
      lastChapterDay: 6,
    });
    expect(save.guests.junk).toBeUndefined();
    expect(save.settings).toEqual({ sound: false, music: true, haptics: true, relaxed: false });
    expect(save.flags).toEqual({ introDone: true });
  });

  it('round-trips a shift in progress', () => {
    const save = createNewSave(CONTENT.newGame);
    save.shift = {
      day: 3,
      customers: [{ guestId: 'barnaby', recipeId: 'frothy-ale', chapter: 1 }],
      index: 0,
      results: [],
      levelBefore: 2,
      doubled: false,
    };
    const restored = migrateSave(JSON.parse(JSON.stringify(save)), CONTENT.newGame);
    expect(restored.shift).toEqual(save.shift);
  });
});

describe('daily gift', () => {
  const fresh = () => createNewSave(CONTENT.newGame);

  it('builds a streak on consecutive days and resets after a gap', () => {
    let save = fresh();
    expect(dailyGiftStatus(save, '2026-03-01')).toEqual({
      available: true,
      streak: 1,
      amount: DAILY_GIFTS[0],
    });
    save = claimDailyGift(save, '2026-03-01');
    expect(dailyGiftStatus(save, '2026-03-01').available).toBe(false);
    expect(dailyGiftStatus(save, '2026-03-02').streak).toBe(2);
    save = claimDailyGift(save, '2026-03-02');
    expect(save.daily.streak).toBe(2);
    expect(dailyGiftStatus(save, '2026-03-05').streak).toBe(1);
  });

  it('handles month boundaries and doubling', () => {
    let save = claimDailyGift(fresh(), '2026-02-28');
    const coins = save.coins;
    save = claimDailyGift(save, '2026-03-01', 2);
    expect(save.daily.streak).toBe(2);
    expect(save.coins - coins).toBe(DAILY_GIFTS[1]! * 2);
  });

  it('formats local dates', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
