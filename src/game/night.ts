import type { GameContent } from '../content';
import { REVIEWS } from '../content/barley';
import type { Payout } from './economy';
import { customersPerDay, levelFromXp, targetTier } from './progression';
import { pick, pickWeighted, shuffle, type Rng } from './rng';
import {
  newGuestProgress,
  RECENT_ROOTS_KEPT,
  type CustomerPlan,
  type OrderResult,
  type SaveData,
  type ShiftState,
} from './save';
import type {
  Bonuses,
  FurnitureDef,
  GuestDef,
  PortraitSpec,
  RecipeDef,
  Reward,
  StoryChapter,
} from './types';

/** Nights between two chapters of the same guest's story. */
export const CHAPTER_GAP = 2;

export function guestProgress(save: SaveData, guestId: string) {
  return save.guests[guestId] ?? newGuestProgress();
}

export function storyComplete(save: SaveData, guest: GuestDef): boolean {
  return guestProgress(save, guest.id).chapter >= guest.story.length;
}

export function isGuestUnlocked(guest: GuestDef, save: SaveData, content: GameContent): boolean {
  const level = levelFromXp(save.xp);
  if (level < guest.unlock.level) return false;
  if (guest.unlock.furniture && !save.furniture.owned.includes(guest.unlock.furniture))
    return false;
  if (guest.unlock.afterStoryOf) {
    const other = content.guests.get(guest.unlock.afterStoryOf);
    if (other && !storyComplete(save, other)) return false;
  }
  return true;
}

function chapterDepsMet(chapter: StoryChapter, save: SaveData, content: GameContent): boolean {
  return (chapter.after ?? []).every((id) => {
    const other = content.guests.get(id);
    return !other || storyComplete(save, other);
  });
}

/** The chapter this guest would play if they visited on `day`, if one is due. */
export function dueChapter(
  guest: GuestDef,
  save: SaveData,
  content: GameContent,
  day: number,
): number | undefined {
  const progress = guestProgress(save, guest.id);
  if (progress.chapter >= guest.story.length) return undefined;
  if (progress.visits > 0 && day - progress.lastChapterDay < CHAPTER_GAP) return undefined;
  const chapter = guest.story[progress.chapter]!;
  return chapterDepsMet(chapter, save, content) ? progress.chapter : undefined;
}

export function chooseRecipe(
  save: SaveData,
  content: GameContent,
  rng: Rng,
  guest?: GuestDef,
): RecipeDef {
  const known = save.recipes
    .map((id) => content.recipes.get(id))
    .filter((r): r is RecipeDef => !!r);
  if (known.length === 0) return content.recipeList[0]!;
  if (guest) {
    const favourites = known.filter((r) => guest.favorites.includes(r.id));
    if (favourites.length > 0 && rng() < 0.5) return pick(rng, favourites);
  }
  const target = targetTier(levelFromXp(save.xp));
  return pickWeighted(rng, known, (r) => {
    const distance = Math.abs(r.tier - target);
    return distance === 0 ? 4 : distance === 1 ? 2 : 1;
  });
}

function townsfolkVisit(content: GameContent, rng: Rng) {
  const def = pick(rng, content.townsfolkList);
  return { archetype: def.id, name: pick(rng, def.names), look: Math.floor(rng() * 1e9) };
}

/**
 * Decides who walks in tonight. At most one newcomer per night; story chapters are spread out
 * so each guest's tale unfolds over several nights; townsfolk fill the remaining stools.
 */
export function planNight(
  save: SaveData,
  content: GameContent,
  bonuses: Bonuses,
  rng: Rng,
): CustomerPlan[] {
  const level = levelFromXp(save.xp);
  const count = customersPerDay(level, bonuses.extraCustomers);
  const day = save.day;
  const unlocked = content.guestList.filter((g) => isGuestUnlocked(g, save, content));
  // Returning guests' chapters per night, on top of any newcomer's introduction.
  const chaptersAllowed = count >= 5 ? 2 : 1;

  const plans: CustomerPlan[] = [];
  const used = new Set<string>();

  const newcomer = unlocked.find((g) => guestProgress(save, g.id).visits === 0);
  if (newcomer) {
    plans.push({ guestId: newcomer.id, chapter: 0, recipeId: '' });
    used.add(newcomer.id);
  }
  const storyVisitsAllowed = plans.length + chaptersAllowed;

  const due = unlocked
    .filter((g) => !used.has(g.id) && guestProgress(save, g.id).visits > 0)
    .map((g) => ({
      g,
      chapter: dueChapter(g, save, content, day),
      since: guestProgress(save, g.id).lastChapterDay,
    }))
    .filter((x): x is { g: GuestDef; chapter: number; since: number } => x.chapter !== undefined);
  // Longest-waiting stories first. Shuffling first breaks ties randomly (sort is stable).
  const dueOrdered = shuffle(rng, due).sort((a, b) => a.since - b.since);
  for (const { g, chapter } of dueOrdered) {
    if (plans.length >= storyVisitsAllowed) break;
    plans.push({ guestId: g.id, chapter, recipeId: '' });
    used.add(g.id);
  }

  // A familiar face or two dropping in for a chat and a meal.
  const regulars = shuffle(
    rng,
    unlocked.filter((g) => !used.has(g.id) && guestProgress(save, g.id).visits > 0),
  );
  for (const g of regulars) {
    if (plans.length >= count - 1) break;
    if (rng() < 0.35) {
      plans.push({ guestId: g.id, recipeId: '' });
      used.add(g.id);
    }
  }

  while (plans.length < count)
    plans.push({ townsfolk: townsfolkVisit(content, rng), recipeId: '' });

  // The very first night keeps the story guest first so the tutorial meets a named character.
  const ordered = save.stats.nightsOpened === 0 ? plans : shuffle(rng, plans);
  return ordered.map((plan) => {
    const guest = plan.guestId ? content.guests.get(plan.guestId) : undefined;
    const chapter = guest && plan.chapter !== undefined ? guest.story[plan.chapter] : undefined;
    const recipeId = chapter?.recipe ?? chooseRecipe(save, content, rng, guest).id;
    return { ...plan, recipeId };
  });
}

export function startShift(save: SaveData, customers: CustomerPlan[]): SaveData {
  const shift: ShiftState = {
    day: save.day,
    customers,
    index: 0,
    results: [],
    levelBefore: levelFromXp(save.xp),
    doubled: false,
  };
  return { ...save, shift, stats: { ...save.stats, nightsOpened: save.stats.nightsOpened + 1 } };
}

export interface CustomerInfo {
  name: string;
  title: string;
  portrait: PortraitSpec;
  guest?: GuestDef;
}

export function describeCustomer(plan: CustomerPlan, content: GameContent): CustomerInfo {
  if (plan.guestId) {
    const guest = content.guests.get(plan.guestId);
    if (guest) return { name: guest.name, title: guest.title, portrait: guest.portrait, guest };
  }
  const visit = plan.townsfolk;
  const def = (visit && content.townsfolk.get(visit.archetype)) ?? content.townsfolkList[0]!;
  const look = def.looks[(visit?.look ?? 0) % def.looks.length]!;
  return { name: visit?.name ?? def.names[0]!, title: def.title, portrait: look };
}

export interface GrantedReward {
  coins: number;
  recipe?: RecipeDef;
  furniture?: FurnitureDef;
}

/** Adds a reward to the save. Special furniture goes straight onto display. */
export function applyReward(
  save: SaveData,
  reward: Reward,
  content: GameContent,
): { save: SaveData; granted: GrantedReward } {
  let next = { ...save, coins: save.coins + (reward.coins ?? 0) };
  const granted: GrantedReward = { coins: reward.coins ?? 0 };
  const recipe = reward.recipe ? content.recipes.get(reward.recipe) : undefined;
  if (recipe && !next.recipes.includes(recipe.id)) {
    next = { ...next, recipes: [...next.recipes, recipe.id] };
    granted.recipe = recipe;
  }
  const furniture = reward.furniture ? content.furniture.get(reward.furniture) : undefined;
  if (furniture && !next.furniture.owned.includes(furniture.id)) {
    next = {
      ...next,
      furniture: {
        owned: [...next.furniture.owned, furniture.id],
        placed: { ...next.furniture.placed, [furniture.slot]: furniture.id },
      },
    };
    granted.furniture = furniture;
  }
  return { save: next, granted };
}

export function writeReview(
  stars: number,
  recipe: RecipeDef,
  rng: Rng,
  avoid: readonly string[] = [],
): string {
  const pool = REVIEWS[Math.max(1, Math.min(5, stars))] ?? REVIEWS[3]!;
  const fresh = pool.filter((t) => !avoid.includes(t.replaceAll('{recipe}', recipe.name)));
  return pick(rng, fresh.length ? fresh : pool).replaceAll('{recipe}', recipe.name);
}

export interface ServeOutcome {
  save: SaveData;
  result: OrderResult;
  /** Story reward, when a chapter was completed. */
  reward?: GrantedReward;
  chapterCompleted?: StoryChapter;
}

/** Books a finished (or served-early) order: coins, renown, stats, friendship and story. */
export function serveOrder(
  save: SaveData,
  content: GameContent,
  payout: Payout,
  words: { found: string[]; bonus: string[]; hintsUsed: number; root: string },
  rng: Rng,
): ServeOutcome {
  const shift = save.shift;
  if (!shift) throw new Error('No shift in progress');
  const plan = shift.customers[shift.index];
  if (!plan) throw new Error('No customer to serve');
  const recipe = content.recipes.get(plan.recipeId) ?? content.recipeList[0]!;
  const who = describeCustomer(plan, content);

  const longest = words.found.reduce(
    (best, w) => (w.length > best.length ? w : best),
    save.stats.longestWord,
  );
  let next: SaveData = {
    ...save,
    coins: save.coins + payout.total,
    xp: save.xp + payout.xp,
    stats: {
      ...save.stats,
      ordersServed: save.stats.ordersServed + 1,
      perfectOrders: save.stats.perfectOrders + (payout.complete && payout.stars === 5 ? 1 : 0),
      wordsFound: save.stats.wordsFound + words.found.length,
      bonusWords: save.stats.bonusWords + words.bonus.length,
      longestWord: longest,
      coinsEarned: save.stats.coinsEarned + payout.total,
      hintsUsed: save.stats.hintsUsed + words.hintsUsed,
    },
    recentRoots: [...save.recentRoots.filter((r) => r !== words.root), words.root].slice(
      -RECENT_ROOTS_KEPT,
    ),
  };

  let reward: GrantedReward | undefined;
  let chapterCompleted: StoryChapter | undefined;
  if (who.guest) {
    const progress = guestProgress(next, who.guest.id);
    const updated = {
      ...progress,
      visits: progress.visits + 1,
      friendship: progress.friendship + (payout.complete ? 1 : 0),
    };
    const playingChapter = plan.chapter !== undefined && plan.chapter === progress.chapter;
    if (playingChapter && payout.complete) {
      chapterCompleted = who.guest.story[plan.chapter!];
      updated.chapter = progress.chapter + 1;
      updated.lastChapterDay = shift.day;
    }
    next = { ...next, guests: { ...next.guests, [who.guest.id]: updated } };
    if (chapterCompleted?.reward) {
      const applied = applyReward(next, chapterCompleted.reward, content);
      next = applied.save;
      reward = applied.granted;
    }
  }

  const result: OrderResult = {
    who: who.name,
    guestId: who.guest?.id,
    recipeId: recipe.id,
    coins: payout.total,
    tip: payout.tip,
    bonusWords: words.bonus.length,
    xp: payout.xp,
    stars: payout.stars,
    complete: payout.complete,
    review: writeReview(
      payout.stars,
      recipe,
      rng,
      shift.results.map((r) => r.review),
    ),
  };
  next = {
    ...next,
    shift: { ...shift, index: shift.index + 1, results: [...shift.results, result] },
  };
  return { save: next, result, reward, chapterCompleted };
}

export interface NightTotals {
  coins: number;
  tips: number;
  bonusWords: number;
  xp: number;
  orders: number;
  complete: number;
  averageStars: number;
}

export function nightTotals(shift: ShiftState): NightTotals {
  const r = shift.results;
  const sum = (f: (x: OrderResult) => number) => r.reduce((acc, x) => acc + f(x), 0);
  return {
    coins: sum((x) => x.coins),
    tips: sum((x) => x.tip),
    bonusWords: sum((x) => x.bonusWords),
    xp: sum((x) => x.xp),
    orders: r.length,
    complete: r.filter((x) => x.complete).length,
    averageStars: r.length ? sum((x) => x.stars) / r.length : 0,
  };
}

/** The rewarded "double tonight's takings" bonus. */
export function doubleNight(save: SaveData): SaveData {
  const shift = save.shift;
  if (!shift || shift.doubled) return save;
  const extra = nightTotals(shift).coins;
  return {
    ...save,
    coins: save.coins + extra,
    stats: { ...save.stats, coinsEarned: save.stats.coinsEarned + extra },
    shift: { ...shift, doubled: true },
  };
}

export function closeNight(save: SaveData): SaveData {
  const { shift, ...rest } = save;
  return { ...rest, day: (shift?.day ?? save.day) + 1 };
}

export const levelUpCoins = (level: number) => 25 * level;

export interface LevelNews {
  level: number;
  coins: number;
  recipes: RecipeDef[];
  furniture: FurnitureDef[];
  guests: GuestDef[];
  moreGuestsPerNight: boolean;
}

/** What reaching `level` opens up, for the level-up celebration. */
export function levelNews(level: number, content: GameContent): LevelNews {
  return {
    level,
    coins: levelUpCoins(level),
    recipes: content.recipeList.filter((r) => r.unlockLevel === level && !r.special && r.cost > 0),
    furniture: content.furnitureList.filter(
      (f) => f.unlockLevel === level && !f.special && !f.default,
    ),
    guests: content.guestList.filter((g) => g.unlock.level === level),
    moreGuestsPerNight: level === 4 || level === 8,
  };
}

/** Grants level-up coins for every level crossed between two renown totals. */
export function applyLevelUps(
  save: SaveData,
  xpBefore: number,
  content: GameContent,
): { save: SaveData; news: LevelNews[] } {
  const from = levelFromXp(xpBefore);
  const to = levelFromXp(save.xp);
  const news: LevelNews[] = [];
  let coins = 0;
  for (let level = from + 1; level <= to; level++) {
    const n = levelNews(level, content);
    news.push(n);
    coins += n.coins;
  }
  return { save: coins ? { ...save, coins: save.coins + coins } : save, news };
}
