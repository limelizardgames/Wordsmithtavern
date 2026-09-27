import { expect, type Page } from '@playwright/test';

export interface DebugOrder {
  letters: string[];
  slots: Array<{ min: number; all: boolean; word?: string; hint?: string; revealed: number }>;
  found: string[];
  familiar: string[];
  complete: boolean;
}

export const SAVE_KEY = 'CapacitorStorage.wordsmith-tavern/save';

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A tavern a few nights in, with every tutorial tip already seen. */
export function seasonedSave(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    createdAt: Date.now(),
    coins: 500,
    xp: 200,
    day: 4,
    recipes: ['frothy-ale', 'hearty-stew'],
    furniture: {
      owned: ['hearth-sooty', 'lights-candles', 'window-dusty', 'table-wobbly'],
      placed: {
        hearth: 'hearth-sooty',
        lights: 'lights-candles',
        window: 'window-dusty',
        floorRight: 'table-wobbly',
      },
    },
    guests: {
      barnaby: { chapter: 1, friendship: 1, visits: 1, lastChapterDay: 1 },
      grizelda: { chapter: 1, friendship: 1, visits: 1, lastChapterDay: 2 },
    },
    stats: {
      ordersServed: 9,
      perfectOrders: 9,
      wordsFound: 27,
      bonusWords: 0,
      longestWord: 'tale',
      coinsEarned: 300,
      nightsOpened: 3,
      hintsUsed: 0,
    },
    settings: { sound: false, music: false, haptics: false, relaxed: false },
    flags: {
      introDone: true,
      firstNightDone: true,
      'tip:forge': true,
      'tip:slots': true,
      'tip:bonus': true,
      'tip:patience': true,
      'tip:allLetters': true,
      'tip:stuck': true,
    },
    daily: { lastClaim: todayKey(), streak: 1 },
    ads: {
      removeAds: false,
      lastInterstitialAt: 0,
      lastRewardedAt: 0,
      nightsSinceInterstitial: 0,
      interstitialsShown: 0,
      rewardedWatched: 0,
    },
    recentRoots: [],
    ...overrides,
  };
}

/**
 * Seeds storage before any app code runs (once per test, so reloads keep progress), then opens
 * the game with the debug hook enabled.
 */
export async function startWith(page: Page, save: unknown | null) {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      localStorage.clear();
      if (value) localStorage.setItem(key as string, JSON.stringify(value));
      sessionStorage.setItem('e2e-seeded', '1');
    },
    [SAVE_KEY, save] as const,
  );
  await page.goto('/?debug');
  await expect(page.locator('.title-screen')).toBeVisible();
}

export const screenName = (page: Page) =>
  page.evaluate(() => (window as any).wordsmith.screen() as string);
export const phase = (page: Page) =>
  page.evaluate(() => (window as any).wordsmith.phase() as string | null);
export const order = (page: Page) =>
  page.evaluate(() => (window as any).wordsmith.order() as DebugOrder | null);
export const saveData = (page: Page) => page.evaluate(() => (window as any).wordsmith.save());

/** Taps through any conversation that's showing. */
export async function tapThroughDialogue(page: Page) {
  for (let i = 0; i < 80; i++) {
    const dialog = page.locator('.dialogue');
    if (!(await dialog.count())) return;
    await dialog.click();
    await page.waitForTimeout(80);
  }
}

/** A familiar word that fills the most demanding open slot. */
export function wordForNextSlot(o: DebugOrder): string {
  const n = o.letters.length;
  const open = o.slots
    .filter((s) => !s.word)
    .sort((a, b) => (b.all ? 99 : b.min) - (a.all ? 99 : a.min));
  const slot = open[0]!;
  const fits = (w: string) =>
    !o.found.includes(w) && (slot.all ? w.length === n : w.length >= slot.min && w.length < n);
  return o.familiar.find(fits) ?? o.familiar.find((w) => !o.found.includes(w))!;
}

/** Swipes across the wheel tiles to spell a word, like a player would. */
export async function swipeWord(page: Page, word: string) {
  const tiles = page.locator('.wheel-tile');
  const count = await tiles.count();
  const boxes: Array<{ letter: string; x: number; y: number; used: boolean }> = [];
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i);
    const box = (await tile.boundingBox())!;
    boxes.push({
      letter: (await tile.innerText()).trim().toLowerCase(),
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      used: false,
    });
  }
  const path = word.split('').map((ch) => {
    const b = boxes.find((t) => t.letter === ch && !t.used)!;
    b.used = true;
    return b;
  });
  await page.mouse.move(path[0]!.x, path[0]!.y);
  await page.mouse.down();
  for (const p of path.slice(1)) await page.mouse.move(p.x, p.y, { steps: 6 });
  await page.mouse.up();
}

export async function waitForCooking(page: Page) {
  await expect
    .poll(
      async () => {
        await tapThroughDialogue(page);
        return phase(page);
      },
      { timeout: 20_000 },
    )
    .toBe('cooking');
}

/** Cooks the current order to completion. */
export async function cookOrder(page: Page, { swipe = false } = {}) {
  await waitForCooking(page);
  for (let i = 0; i < 12; i++) {
    const o = await order(page);
    if (!o || o.complete) break;
    const word = wordForNextSlot(o);
    if (swipe) await swipeWord(page, word);
    else {
      await page.keyboard.type(word);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(150);
    if ((await phase(page)) !== 'cooking') break;
  }
  await expect.poll(() => phase(page)).not.toBe('cooking');
}

/** Serves every remaining guest tonight and waits for the closing-time summary. */
export async function serveTheNight(page: Page, { swipe = false } = {}) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await tapThroughDialogue(page);
    await dismissPopups(page);
    if ((await screenName(page)) === 'summary') return;
    if ((await phase(page)) === 'cooking') await cookOrder(page, { swipe });
    else await page.waitForTimeout(250);
  }
  expect(await screenName(page)).toBe('summary');
}

/** Acknowledges reward and level-up popups. */
export async function dismissPopups(page: Page) {
  for (let i = 0; i < 5; i++) {
    const btn = page.locator('.modal .btn-gold');
    if (!(await btn.count())) return;
    await btn.first().click();
    await page.waitForTimeout(200);
  }
}
