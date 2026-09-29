import { effect } from '@preact/signals';
import { CONTENT } from '../content';
import { BARLEY } from '../content/barley';
import { claimDailyGift, dailyGiftStatus, localDateKey } from '../game/daily';
import { loadDictionary } from '../game/dictionary';
import { createNewSave, migrateSave, type Settings } from '../game/save';
import { buyFurniture, buyRecipe, placeFurniture } from '../game/shop';
import type { FurnitureDef, RecipeDef } from '../game/types';
import { ads, initAds, setBannerVisible, showRewardedAd } from '../services/ads';
import { bannerAllowed, noteRewardedWatched } from '../services/ads/policy';
import { audio } from '../services/audio';
import { haptics, setHapticsEnabled } from '../services/haptics';
import {
  hideSplash,
  onAppActiveChange,
  onBackButton,
  setupNativeChrome,
} from '../services/platform';
import { deleteSave, flushSave, readSave, scheduleSave } from '../services/storage';
import { preloadTavern } from '../ui/art/renders';
import { openTavern } from './service';
import {
  advanceDialogue,
  appActive,
  bootError,
  closeModal,
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

let giftOfferedThisSession = false;

async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.text();
}

export async function boot() {
  void setupNativeChrome();

  const raw = await readSave();
  save.value = raw ? migrateSave(raw, CONTENT.newGame) : createNewSave(CONTENT.newGame);

  effect(() => scheduleSave(save.value));
  effect(() => {
    const s = save.value.settings;
    audio.setSfxEnabled(s.sound);
    audio.setMusicEnabled(s.music);
    setHapticsEnabled(s.haptics);
  });
  effect(() => audio.setActive(appActive.value && !ads.showing.value));
  effect(() => {
    document.documentElement.style.setProperty('--banner-h', `${ads.bannerHeight.value}px`);
  });
  effect(() => {
    const show = bannerAllowed(save.value.ads, screen.value) && !dialogue.value;
    void setBannerVisible(show);
  });
  effect(() => {
    if (screen.value === 'hub' && !dialogue.value && !modal.value) maybeOfferDailyGift();
  });

  onAppActiveChange((active) => {
    appActive.value = active;
    if (!active) void flushSave();
  });
  onBackButton(handleBack);
  // Browsers keep audio locked until the first touch.
  window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
  window.addEventListener('keydown', () => audio.unlock());

  try {
    dictionary.value = await loadDictionary(fetchText);
  } catch (err) {
    bootError.value = err instanceof Error ? err.message : String(err);
    await hideSplash();
    return;
  }
  void initAds();
  await preloadTavern(save.value.furniture.placed);
  screen.value = 'title';
  await hideSplash();
}

/** From the title screen: first-timers meet Barley and go straight into their first night. */
export async function enterTavern() {
  audio.unlock();
  audio.playMusic(true);
  if (!save.value.flags.introDone) {
    screen.value = 'hub';
    await playDialogue(BARLEY.intro);
    setFlag('introDone');
    openTavern();
    return;
  }
  screen.value = 'hub';
}

function maybeOfferDailyGift() {
  if (giftOfferedThisSession || !save.value.flags.firstNightDone) return;
  const status = dailyGiftStatus(save.value, localDateKey());
  if (!status.available) return;
  giftOfferedThisSession = true;
  void openModal({ kind: 'daily', amount: status.amount, streak: status.streak });
}

export async function claimGift(double: boolean) {
  let multiplier = 1;
  if (double) {
    const earned = await showRewardedAd('double_gift');
    if (earned) {
      multiplier = 2;
      updateSave((s) => ({ ...s, ads: noteRewardedWatched(s.ads, Date.now()) }));
    }
  }
  const before = save.value.coins;
  updateSave((s) => claimDailyGift(s, localDateKey(), multiplier));
  closeModal();
  audio.play('coin', 5);
  toast(`+${save.value.coins - before} coins from the tip jar`, 'coin');
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  updateSave((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  if (key === 'music' && value) {
    audio.unlock();
    audio.playMusic(true);
  }
  if (key === 'haptics' && value) haptics.tap();
}

export async function resetProgress() {
  await deleteSave();
  save.value = createNewSave(CONTENT.newGame);
  giftOfferedThisSession = false;
  screen.value = 'title';
}

// ── Shop ────────────────────────────────────────────────────────────────
export function purchaseFurniture(item: FurnitureDef) {
  const before = save.value;
  updateSave((s) => buyFurniture(s, item));
  if (save.value === before) return;
  audio.play('buy');
  haptics.success();
  const guest = item.attracts ? CONTENT.guests.get(item.attracts) : undefined;
  toast(guest ? `${item.name} is up! Word will spread…` : `${item.name} is on display`, 'sparkle');
}

export function displayFurniture(item: FurnitureDef) {
  updateSave((s) => placeFurniture(s, item));
  audio.play('click');
}

export function learnRecipe(recipe: RecipeDef) {
  const before = save.value;
  updateSave((s) => buyRecipe(s, recipe));
  if (save.value === before) return;
  audio.play('buy');
  haptics.success();
  toast(`${recipe.name} added to the menu`, 'sparkle');
}

// ── Android back button ──────────────────────────────────────────────────
function handleBack(): boolean {
  if (ads.showing.value) return true;
  if (dialogue.value) {
    advanceDialogue();
    return true;
  }
  if (modal.value) {
    // Reward and level-up popups must be acknowledged with their button.
    if (
      modal.value.kind === 'settings' ||
      modal.value.kind === 'credits' ||
      modal.value.kind === 'hint' ||
      modal.value.kind === 'serveEarly' ||
      modal.value.kind === 'confirm'
    ) {
      closeModal();
    }
    return true;
  }
  switch (screen.value) {
    case 'shop':
    case 'recipes':
    case 'guests':
      screen.value = 'hub';
      return true;
    case 'service':
      void openModal({ kind: 'settings' });
      return true;
    case 'summary':
    case 'loading':
      return true;
    default:
      return false;
  }
}
