import { Preferences } from '@capacitor/preferences';
import type { SaveData } from '../game/save';

/**
 * Save storage. Capacitor Preferences maps to UserDefaults / SharedPreferences on devices (which
 * the OS won't evict like WebView storage) and to localStorage in the browser.
 */
const KEY = 'wordsmith-tavern/save';
const DEBOUNCE_MS = 400;

let pending: SaveData | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export async function readSave(): Promise<unknown> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.warn('[save] could not read save', err);
    return null;
  }
}

async function write(data: SaveData) {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(data) });
  } catch (err) {
    console.warn('[save] could not write save', err);
  }
}

/** Coalesces rapid changes into one write. */
export function scheduleSave(data: SaveData): void {
  pending = data;
  clearTimeout(timer);
  timer = setTimeout(() => void flushSave(), DEBOUNCE_MS);
}

export async function flushSave(): Promise<void> {
  clearTimeout(timer);
  if (!pending) return;
  const data = pending;
  pending = null;
  await write(data);
}

export async function deleteSave(): Promise<void> {
  clearTimeout(timer);
  pending = null;
  try {
    await Preferences.remove({ key: KEY });
  } catch {
    /* nothing to remove */
  }
}
