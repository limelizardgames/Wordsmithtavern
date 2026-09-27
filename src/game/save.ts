import { STARTING_COINS } from './economy';
import type { FurnitureId, FurnitureSlot, GuestId, RecipeId } from './types';

export const SAVE_VERSION = 1;

export interface GuestProgress {
  /** Next story chapter to play (equals chapter count when the story is finished). */
  chapter: number;
  /** Orders served to this guest in full. */
  friendship: number;
  visits: number;
  /** Day their last story chapter was played; chapters are spaced out over nights. */
  lastChapterDay: number;
}

export interface TownsfolkVisit {
  archetype: string;
  name: string;
  /** Seed for the look variation. */
  look: number;
}

export interface CustomerPlan {
  guestId?: GuestId;
  townsfolk?: TownsfolkVisit;
  recipeId: RecipeId;
  /** Story chapter to play during this visit, if any. */
  chapter?: number;
}

export interface OrderResult {
  who: string;
  guestId?: GuestId;
  recipeId: RecipeId;
  coins: number;
  tip: number;
  bonusWords: number;
  xp: number;
  stars: number;
  complete: boolean;
  review: string;
}

/** A night of service in progress. Saved after every order so a closed app loses nothing. */
export interface ShiftState {
  day: number;
  customers: CustomerPlan[];
  /** Index of the guest currently being (or next to be) served. */
  index: number;
  results: OrderResult[];
  levelBefore: number;
  doubled: boolean;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  /** Patience never runs out; tips settle at a steady rate. */
  relaxed: boolean;
}

export interface Stats {
  ordersServed: number;
  perfectOrders: number;
  wordsFound: number;
  bonusWords: number;
  longestWord: string;
  coinsEarned: number;
  nightsOpened: number;
  hintsUsed: number;
}

export interface AdsState {
  removeAds: boolean;
  lastInterstitialAt: number;
  lastRewardedAt: number;
  nightsSinceInterstitial: number;
  interstitialsShown: number;
  rewardedWatched: number;
}

export interface DailyState {
  /** Local date (YYYY-MM-DD) the daily gift was last claimed. */
  lastClaim: string;
  streak: number;
}

export interface SaveData {
  version: number;
  createdAt: number;
  coins: number;
  xp: number;
  /** The next night to open. */
  day: number;
  recipes: RecipeId[];
  furniture: {
    owned: FurnitureId[];
    placed: Partial<Record<FurnitureSlot, FurnitureId>>;
  };
  guests: Record<GuestId, GuestProgress>;
  stats: Stats;
  settings: Settings;
  flags: Record<string, boolean>;
  daily: DailyState;
  ads: AdsState;
  recentRoots: string[];
  shift?: ShiftState;
}

export const RECENT_ROOTS_KEPT = 60;

export interface NewGameContent {
  starterRecipes: RecipeId[];
  defaultFurniture: Array<{ id: FurnitureId; slot: FurnitureSlot }>;
}

export function newGuestProgress(): GuestProgress {
  return { chapter: 0, friendship: 0, visits: 0, lastChapterDay: -99 };
}

export function createNewSave(content: NewGameContent, now = Date.now()): SaveData {
  const placed: Partial<Record<FurnitureSlot, FurnitureId>> = {};
  for (const f of content.defaultFurniture) placed[f.slot] = f.id;
  return {
    version: SAVE_VERSION,
    createdAt: now,
    coins: STARTING_COINS,
    xp: 0,
    day: 1,
    recipes: content.starterRecipes.slice(),
    furniture: { owned: content.defaultFurniture.map((f) => f.id), placed },
    guests: {},
    stats: {
      ordersServed: 0,
      perfectOrders: 0,
      wordsFound: 0,
      bonusWords: 0,
      longestWord: '',
      coinsEarned: 0,
      nightsOpened: 0,
      hintsUsed: 0,
    },
    settings: { sound: true, music: true, haptics: true, relaxed: false },
    flags: {},
    daily: { lastClaim: '', streak: 0 },
    ads: {
      removeAds: false,
      lastInterstitialAt: 0,
      lastRewardedAt: 0,
      nightsSinceInterstitial: 0,
      interstitialsShown: 0,
      rewardedWatched: 0,
    },
    recentRoots: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const strArr = (v: unknown, fallback: string[]) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : fallback;

/**
 * Accepts anything that came out of storage and returns a valid save, keeping whatever it can.
 * Unknown content ids are kept (content may be added back later) but never crash the game.
 */
export function migrateSave(raw: unknown, content: NewGameContent): SaveData {
  const fresh = createNewSave(content);
  if (!isObj(raw)) return fresh;

  const furniture = isObj(raw.furniture) ? raw.furniture : {};
  const placedRaw = isObj(furniture.placed) ? furniture.placed : {};
  const placed: Partial<Record<FurnitureSlot, FurnitureId>> = { ...fresh.furniture.placed };
  for (const [slot, id] of Object.entries(placedRaw)) {
    if (typeof id === 'string') placed[slot as FurnitureSlot] = id;
  }
  const owned = [...new Set([...fresh.furniture.owned, ...strArr(furniture.owned, [])])];

  const guests: Record<GuestId, GuestProgress> = {};
  if (isObj(raw.guests)) {
    for (const [id, g] of Object.entries(raw.guests)) {
      if (!isObj(g)) continue;
      guests[id] = {
        chapter: Math.max(0, Math.floor(num(g.chapter, 0))),
        friendship: Math.max(0, Math.floor(num(g.friendship, 0))),
        visits: Math.max(0, Math.floor(num(g.visits, 0))),
        lastChapterDay: num(g.lastChapterDay, -99),
      };
    }
  }

  const stats = isObj(raw.stats) ? raw.stats : {};
  const settings = isObj(raw.settings) ? raw.settings : {};
  const daily = isObj(raw.daily) ? raw.daily : {};
  const ads = isObj(raw.ads) ? raw.ads : {};
  const flags: Record<string, boolean> = {};
  if (isObj(raw.flags)) {
    for (const [k, v] of Object.entries(raw.flags)) if (typeof v === 'boolean') flags[k] = v;
  }

  const save: SaveData = {
    version: SAVE_VERSION,
    createdAt: num(raw.createdAt, fresh.createdAt),
    coins: Math.max(0, Math.floor(num(raw.coins, fresh.coins))),
    xp: Math.max(0, Math.floor(num(raw.xp, 0))),
    day: Math.max(1, Math.floor(num(raw.day, 1))),
    recipes: [...new Set([...fresh.recipes, ...strArr(raw.recipes, [])])],
    furniture: { owned, placed },
    guests,
    stats: {
      ordersServed: num(stats.ordersServed, 0),
      perfectOrders: num(stats.perfectOrders, 0),
      wordsFound: num(stats.wordsFound, 0),
      bonusWords: num(stats.bonusWords, 0),
      longestWord: str(stats.longestWord, ''),
      coinsEarned: num(stats.coinsEarned, 0),
      nightsOpened: num(stats.nightsOpened, 0),
      hintsUsed: num(stats.hintsUsed, 0),
    },
    settings: {
      sound: bool(settings.sound, true),
      music: bool(settings.music, true),
      haptics: bool(settings.haptics, true),
      relaxed: bool(settings.relaxed, false),
    },
    flags,
    daily: { lastClaim: str(daily.lastClaim, ''), streak: Math.max(0, num(daily.streak, 0)) },
    ads: {
      removeAds: bool(ads.removeAds, false),
      lastInterstitialAt: num(ads.lastInterstitialAt, 0),
      lastRewardedAt: num(ads.lastRewardedAt, 0),
      nightsSinceInterstitial: num(ads.nightsSinceInterstitial, 0),
      interstitialsShown: num(ads.interstitialsShown, 0),
      rewardedWatched: num(ads.rewardedWatched, 0),
    },
    recentRoots: strArr(raw.recentRoots, []).slice(-RECENT_ROOTS_KEPT),
  };

  const shift = raw.shift;
  if (isObj(shift) && Array.isArray(shift.customers) && Array.isArray(shift.results)) {
    save.shift = {
      day: Math.max(1, Math.floor(num(shift.day, save.day))),
      customers: shift.customers.filter(
        (c): c is CustomerPlan => isObj(c) && typeof c.recipeId === 'string',
      ),
      index: Math.max(0, Math.floor(num(shift.index, 0))),
      results: shift.results.filter((r): r is OrderResult => isObj(r) && typeof r.who === 'string'),
      levelBefore: Math.max(1, Math.floor(num(shift.levelBefore, 1))),
      doubled: bool(shift.doubled, false),
    };
    if (save.shift.customers.length === 0) delete save.shift;
  }
  return save;
}
