import { computed, signal } from '@preact/signals';
import { CONTENT } from '../content';
import { BARLEY } from '../content/barley';
import { computePayout, effectivePatience, hintCost, type Payout } from '../game/economy';
import {
  applyLevelUps,
  closeNight,
  describeCustomer,
  doubleNight,
  guestProgress,
  planNight,
  serveOrder,
  startShift,
  storyComplete,
  type CustomerInfo,
  type LevelNews,
} from '../game/night';
import {
  applyHint,
  calmGuest,
  canHint,
  createOrder,
  patienceFraction,
  reshuffle,
  submitWord,
  tickPatience,
  type Order,
} from '../game/order';
import { generatePuzzle } from '../game/puzzle';
import { createRng, pick, randomSeed } from '../game/rng';
import type { CustomerPlan, ShiftState } from '../game/save';
import type { GuestLines, Mood, RecipeDef, StoryChapter } from '../game/types';
import { ads, showInterstitialAd, showRewardedAd } from '../services/ads';
import {
  noteInterstitialShown,
  noteNightCompleted,
  noteRewardedWatched,
  shouldShowInterstitial,
} from '../services/ads/policy';
import { audio } from '../services/audio';
import { haptics } from '../services/haptics';
import { flushSave } from '../services/storage';
import {
  appActive,
  bonuses,
  dialogue,
  dictionary,
  modal,
  openModal,
  playDialogue,
  save,
  screen,
  setFlag,
  toast,
  updateSave,
} from './state';

export type Phase = 'enter' | 'story' | 'ordering' | 'cooking' | 'served' | 'leaving';

export interface ServiceState {
  key: string;
  plan: CustomerPlan;
  who: CustomerInfo;
  lines: Omit<GuestLines, 'banter'> & { banter: string[] };
  recipe: RecipeDef;
  chapter?: StoryChapter;
  isFavorite: boolean;
  order: Order;
  phase: Phase;
  mood: Mood;
  talking: boolean;
  bubble: string | null;
  payout?: Payout;
}

export interface Feedback {
  id: number;
  kind: 'good' | 'bonus' | 'bad' | 'repeat';
  text: string;
}

export interface CoachTip {
  id: string;
  text: string;
  anchor: 'wheel' | 'order' | 'hint' | 'patience';
}

export const service = signal<ServiceState | null>(null);
/** Indices into the order's letters, in the order they were picked. */
export const selection = signal<number[]>([]);
export const feedback = signal<Feedback | null>(null);
export const barleySays = signal<string | null>(null);
export const coach = signal<CoachTip | null>(null);
export const filledFlash = signal<{ slot: number; id: number } | null>(null);
export const pendingLevelUps = signal<LevelNews[]>([]);
/** Snapshot of the night just finished, for the summary screen. */
export const finishedShift = signal<ShiftState | null>(null);

export const paused = computed(
  () =>
    !!dialogue.value ||
    !!modal.value ||
    !appActive.value ||
    ads.showing.value ||
    screen.value !== 'service',
);

const rng = createRng(randomSeed());
let flow = 0;
let feedbackIds = 0;
let talkTimer: ReturnType<typeof setTimeout> | undefined;
let barleyTimer: ReturnType<typeof setTimeout> | undefined;
let misses = 0;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Async flows check this after every pause so a stale flow never touches a newer order. */
const alive = (id: number) => id === flow && screen.value === 'service';
const fill = (text: string, recipe: RecipeDef) => text.replaceAll('{recipe}', recipe.name);

function patch(fn: (s: ServiceState) => ServiceState) {
  if (service.value) service.value = fn(service.value);
}

function say(text: string | null, mood?: Mood) {
  clearTimeout(talkTimer);
  patch((s) => ({ ...s, bubble: text, mood: mood ?? s.mood, talking: !!text }));
  if (text) {
    talkTimer = setTimeout(
      () => patch((s) => ({ ...s, talking: false })),
      Math.min(2600, 500 + text.length * 28),
    );
  }
}

export function barley(text: string, ms = 2600) {
  clearTimeout(barleyTimer);
  barleySays.value = text;
  barleyTimer = setTimeout(() => (barleySays.value = null), ms);
}

function coachOnce(id: string, text: string, anchor: CoachTip['anchor']) {
  if (save.value.flags[`tip:${id}`]) return;
  setFlag(`tip:${id}`);
  coach.value = { id, text, anchor };
}

export function dismissCoach() {
  coach.value = null;
}

function linesFor(plan: CustomerPlan, who: CustomerInfo): ServiceState['lines'] {
  if (who.guest) return who.guest.lines;
  const def =
    (plan.townsfolk && CONTENT.townsfolk.get(plan.townsfolk.archetype)) ??
    CONTENT.townsfolkList[0]!;
  return { ...def.lines, banter: [] };
}

// ── Opening and running the night ─────────────────────────────────────────
export function openTavern() {
  if (!save.value.shift) {
    const plan = planNight(save.value, CONTENT, bonuses.value, rng);
    updateSave((s) => startShift(s, plan));
    pendingLevelUps.value = [];
  }
  finishedShift.value = null;
  screen.value = 'service';
  barley(pick(rng, BARLEY.openNight));
  void beginCustomer();
}

async function beginCustomer() {
  const id = ++flow;
  const dict = dictionary.value;
  const shift = save.value.shift;
  if (!dict || !shift) return;
  if (shift.index >= shift.customers.length) {
    finishService();
    return;
  }
  const plan = shift.customers[shift.index]!;
  const who = describeCustomer(plan, CONTENT);
  const lines = linesFor(plan, who);
  const recipe = CONTENT.recipes.get(plan.recipeId) ?? CONTENT.recipeList[0]!;
  const progress = who.guest ? guestProgress(save.value, who.guest.id) : undefined;
  const chapter =
    who.guest && plan.chapter !== undefined && progress?.chapter === plan.chapter
      ? who.guest.story[plan.chapter]
      : undefined;
  const puzzle = generatePuzzle(recipe, dict, rng, { avoid: new Set(save.value.recentRoots) });
  const order = createOrder(
    recipe,
    puzzle,
    effectivePatience(recipe, who.guest?.patienceMult ?? 1, bonuses.value),
  );

  misses = 0;
  selection.value = [];
  feedback.value = null;
  service.value = {
    key: `${shift.day}-${shift.index}`,
    plan,
    who,
    lines,
    recipe,
    chapter,
    isFavorite: !!who.guest?.favorites.includes(recipe.id),
    order,
    phase: 'enter',
    mood: 'neutral',
    talking: false,
    bubble: null,
  };
  audio.play('bell');
  await wait(950);
  if (!alive(id)) return;

  let orderLine: string;
  if (chapter) {
    patch((s) => ({ ...s, phase: 'story' }));
    await playDialogue(
      chapter.arrive.map((l) => ({ ...l, text: fill(l.text, recipe) })),
      who,
    );
    if (!alive(id)) return;
    orderLine = chapter.order;
  } else {
    patch((s) => ({ ...s, phase: 'ordering' }));
    const chatty = who.guest && storyComplete(save.value, who.guest) ? lines.banter : [];
    say(pick(rng, [...lines.greet, ...chatty]), 'happy');
    await wait(2000);
    if (!alive(id)) return;
    orderLine = pick(rng, lines.order);
  }
  say(fill(orderLine, recipe), 'neutral');
  patch((s) => ({ ...s, phase: 'cooking' }));

  coachOnce('forge', BARLEY.tips.forge, 'wheel');
  if (recipe.slots.some((sl) => sl.all)) coachOnce('allLetters', BARLEY.tips.allLetters, 'order');
}

function finishService() {
  flow++;
  finishedShift.value = save.value.shift ?? null;
  service.value = null;
  screen.value = 'summary';
}

// ── Cooking ───────────────────────────────────────────────────────────────
function show(kind: Feedback['kind'], text: string) {
  feedback.value = { id: ++feedbackIds, kind, text };
}

export function submit(word: string) {
  const s = service.value;
  const dict = dictionary.value;
  if (!s || !dict || s.phase !== 'cooking') return;
  const { order, outcome } = submitWord(s.order, word, dict);
  if (coach.value?.id === 'forge') coach.value = null;

  switch (outcome.kind) {
    case 'too-short':
      show('bad', pick(rng, BARLEY.tooShort));
      audio.play('bad');
      haptics.warning();
      return;
    case 'not-letters':
    case 'unknown':
      show('bad', pick(rng, BARLEY.invalid));
      audio.play('bad');
      haptics.error();
      if (++misses === 4) coachOnce('stuck', BARLEY.tips.stuck, 'hint');
      return;
    case 'repeat':
      show('repeat', pick(rng, BARLEY.repeat));
      audio.play('repeat');
      haptics.warning();
      return;
    case 'bonus':
      patch((x) => ({ ...x, order }));
      show('bonus', `+${1 + bonuses.value.bonusWordCoins} tip · ${pick(rng, BARLEY.bonus)}`);
      audio.play('bonus');
      haptics.tap();
      coachOnce('bonus', BARLEY.tips.bonus, 'order');
      return;
    case 'slot': {
      patch((x) => ({ ...x, order }));
      show('good', word.toUpperCase());
      filledFlash.value = { slot: outcome.slotIndex, id: feedbackIds };
      audio.play('word');
      haptics.success();
      if (outcome.complete) {
        void serve();
      } else {
        coachOnce('slots', BARLEY.tips.slots, 'order');
      }
      return;
    }
  }
}

/** Serves the order: in full when every slot is filled, otherwise early at a reduced price. */
export async function serve() {
  const s = service.value;
  if (!s || s.phase !== 'cooking') return;
  const id = flow;
  selection.value = [];
  coach.value = null;
  const payout = computePayout({
    recipe: s.recipe,
    order: s.order,
    bonuses: bonuses.value,
    tipMult: s.who.guest?.tipMult ?? 1,
    isFavorite: s.isFavorite,
    relaxed: save.value.settings.relaxed,
  });
  const xpBefore = save.value.xp;
  const out = serveOrder(
    save.value,
    CONTENT,
    payout,
    {
      found: s.order.found,
      bonus: s.order.bonus,
      hintsUsed: s.order.hintsUsed,
      root: s.order.root,
    },
    rng,
  );
  const levels = applyLevelUps(out.save, xpBefore, CONTENT);
  save.value = levels.save;
  if (levels.news.length) pendingLevelUps.value = [...pendingLevelUps.value, ...levels.news];
  void flushSave();

  const mood: Mood = payout.complete ? (payout.stars >= 4 ? 'happy' : 'neutral') : 'grumpy';
  patch((x) => ({ ...x, phase: 'served', payout }));
  say(pick(rng, payout.complete ? s.lines.happy : s.lines.grumpy), mood);
  audio.play(payout.complete ? 'serve' : 'repeat');
  setTimeout(() => audio.play('coin', Math.ceil(payout.total / 12)), 380);
  haptics.success();
  await wait(2300);
  if (!alive(id)) return;

  if (out.chapterCompleted && s.who.guest) {
    await playDialogue(
      out.chapterCompleted.done.map((l) => ({ ...l, text: fill(l.text, s.recipe) })),
      s.who,
    );
    if (!alive(id)) return;
    const reward = out.reward;
    if (reward && (reward.furniture || reward.recipe)) {
      audio.play('levelup');
      await openModal({
        kind: 'reward',
        title: out.chapterCompleted.title,
        body: `A gift from ${s.who.name}`,
        reward,
        guestId: s.who.guest.id,
      });
      if (!alive(id)) return;
    } else if (reward?.coins) {
      toast(`${s.who.name} left ${reward.coins} extra coins`, 'coin');
    }
  }

  patch((x) => ({ ...x, phase: 'leaving', bubble: null, talking: false }));
  await wait(750);
  if (!alive(id)) return;
  void beginCustomer();
}

export function shuffleLetters() {
  const s = service.value;
  if (!s || s.phase !== 'cooking') return;
  selection.value = [];
  patch((x) => ({ ...x, order: reshuffle(x.order, rng) }));
  audio.play('shuffle');
  haptics.tap();
}

export function hintAvailable(): boolean {
  const s = service.value;
  return !!s && s.phase === 'cooking' && canHint(s.order);
}

/** Taste Test paid with coins. */
export function buyHint(): boolean {
  const s = service.value;
  const dict = dictionary.value;
  if (!s || !dict || !hintAvailable()) return false;
  const cost = hintCost(bonuses.value);
  if (save.value.coins < cost) {
    toast('Not enough coins for a Taste Test', 'coin');
    return false;
  }
  const order = applyHint(s.order, dict, rng);
  if (!order) return false;
  updateSave((sv) => ({ ...sv, coins: sv.coins - cost }));
  patch((x) => ({ ...x, order }));
  audio.play('hint');
  return true;
}

/** Taste Test paid for by watching a rewarded ad. */
export async function adHint(): Promise<boolean> {
  if (!hintAvailable()) return false;
  const earned = await showRewardedAd('free_hint');
  if (!earned) return false;
  updateSave((sv) => ({ ...sv, ads: noteRewardedWatched(sv.ads, Date.now()) }));
  const s = service.value;
  const dict = dictionary.value;
  if (!s || !dict) return false;
  const order = applyHint(s.order, dict, rng);
  if (order) patch((x) => ({ ...x, order }));
  audio.play('hint');
  return !!order;
}

export const canCalm = computed(() => {
  const s = service.value;
  return (
    !!s &&
    s.phase === 'cooking' &&
    !s.order.calmed &&
    !save.value.settings.relaxed &&
    patienceFraction(s.order) < 0.4 &&
    ads.rewardedReady.value
  );
});

/** Rewarded ad: Barley hums a tune and the guest's patience recovers. */
export async function calm() {
  if (!canCalm.value) return;
  const earned = await showRewardedAd('calm_guest');
  if (!earned) return;
  updateSave((sv) => ({ ...sv, ads: noteRewardedWatched(sv.ads, Date.now()) }));
  patch((x) => ({ ...x, order: calmGuest(x.order) }));
  say('Oh! What a lovely tune. Take your time.', 'happy');
  barley('♪ Hmm-hmm-hmm ♪');
}

/** Called a few times a second by the service screen. */
export function tick(seconds: number) {
  const s = service.value;
  if (!s || s.phase !== 'cooking' || paused.value || save.value.settings.relaxed) return;
  const before = patienceFraction(s.order);
  const order = tickPatience(s.order, seconds);
  const after = patienceFraction(order);
  patch((x) => ({ ...x, order }));
  if (before > 0.5 && after <= 0.5) {
    say(pick(rng, s.lines.waiting));
    coachOnce('patience', BARLEY.tips.patience, 'patience');
  }
  if (before > 0.25 && after <= 0.25) {
    say(pick(rng, s.lines.grumpy), 'grumpy');
    barley(pick(rng, BARLEY.lowPatience));
  }
}

// ── After closing time ────────────────────────────────────────────────────
export async function doubleTonight(): Promise<boolean> {
  const earned = await showRewardedAd('double_night');
  if (!earned) return false;
  updateSave((s) => ({ ...doubleNight(s), ads: noteRewardedWatched(s.ads, Date.now()) }));
  finishedShift.value = save.value.shift ?? finishedShift.value;
  audio.play('coin', 6);
  return true;
}

export async function closeUp() {
  const nightsCompleted = save.value.stats.nightsOpened;
  const firstNight = !save.value.flags.firstNightDone;
  updateSave((s) => ({ ...closeNight(s), ads: noteNightCompleted(s.ads) }));
  void flushSave();
  if (shouldShowInterstitial(save.value.ads, nightsCompleted, Date.now())) {
    const shown = await showInterstitialAd('night_closed');
    if (shown) updateSave((s) => ({ ...s, ads: noteInterstitialShown(s.ads, Date.now()) }));
  }
  finishedShift.value = null;
  screen.value = 'hub';
  if (firstNight) {
    // Barley's pep talk comes first; the daily gift waits until it's over.
    await playDialogue(BARLEY.afterFirstNight);
    setFlag('firstNightDone');
  }
}

export function levelUpNewsShown() {
  pendingLevelUps.value = [];
}
