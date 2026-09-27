import { computed, signal } from '@preact/signals';
import { CONTENT } from '../content';
import { totalBonuses } from '../game/bonuses';
import type { Dictionary } from '../game/dictionary';
import type { GrantedReward, LevelNews } from '../game/night';
import { levelFromXp, levelProgress } from '../game/progression';
import { createNewSave, type SaveData } from '../game/save';
import type { DialogueLine, PortraitSpec } from '../game/types';

export type Screen =
  'loading' | 'title' | 'hub' | 'service' | 'summary' | 'shop' | 'recipes' | 'guests';

export const screen = signal<Screen>('loading');
export const save = signal<SaveData>(createNewSave(CONTENT.newGame));
export const dictionary = signal<Dictionary | null>(null);
export const bootError = signal<string | null>(null);
/** False while the app is in the background. */
export const appActive = signal(true);

export const level = computed(() => levelFromXp(save.value.xp));
export const renown = computed(() => levelProgress(save.value.xp));
export const bonuses = computed(() => totalBonuses(save.value.furniture.placed, CONTENT.furniture));

export function updateSave(fn: (s: SaveData) => SaveData) {
  save.value = fn(save.value);
}

export function setFlag(flag: string, value = true) {
  if (save.value.flags[flag] === value) return;
  updateSave((s) => ({ ...s, flags: { ...s.flags, [flag]: value } }));
}

// ── Modals (shown one at a time, queued) ─────────────────────────────────
export type Modal =
  | { kind: 'settings' }
  | { kind: 'credits' }
  | { kind: 'levelUp'; news: LevelNews }
  | { kind: 'reward'; title: string; body?: string; reward: GrantedReward; guestId?: string }
  | { kind: 'daily'; amount: number; streak: number }
  | { kind: 'hint' }
  | { kind: 'serveEarly' }
  | { kind: 'resume' }
  | {
      kind: 'confirm';
      title: string;
      body: string;
      confirm: string;
      danger?: boolean;
      onConfirm: () => void;
    };

export const modalQueue = signal<Array<Modal & { id: number; onClose?: () => void }>>([]);
export const modal = computed(() => modalQueue.value[0] ?? null);
let modalIds = 0;

/** Queues a modal; resolves once it has been closed. */
export function openModal(m: Modal): Promise<void> {
  return new Promise((resolve) => {
    modalQueue.value = [...modalQueue.value, { ...m, id: ++modalIds, onClose: resolve }];
  });
}

export function closeModal() {
  const [first, ...rest] = modalQueue.value;
  modalQueue.value = rest;
  first?.onClose?.();
}

// ── Dialogue ─────────────────────────────────────────────────────────────
export interface DialogueState {
  lines: DialogueLine[];
  index: number;
  guestName: string;
  guestTitle?: string;
  guestSpec?: PortraitSpec;
  resolve: () => void;
}

export const dialogue = signal<DialogueState | null>(null);

/** Plays a conversation; resolves when the player has tapped through it. */
export function playDialogue(
  lines: DialogueLine[],
  guest?: { name: string; title?: string; portrait: PortraitSpec },
): Promise<void> {
  if (lines.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    dialogue.value = {
      lines,
      index: 0,
      guestName: guest?.name ?? 'Guest',
      guestTitle: guest?.title,
      guestSpec: guest?.portrait,
      resolve,
    };
  });
}

export function advanceDialogue() {
  const d = dialogue.value;
  if (!d) return;
  if (d.index + 1 < d.lines.length) {
    dialogue.value = { ...d, index: d.index + 1 };
  } else {
    dialogue.value = null;
    d.resolve();
  }
}

// ── Toasts ───────────────────────────────────────────────────────────────
export interface Toast {
  id: number;
  text: string;
  icon?: 'coin' | 'star' | 'heart' | 'sparkle' | 'lock' | 'info';
}

export const toasts = signal<Toast[]>([]);
let toastIds = 0;

export function toast(text: string, icon?: Toast['icon']) {
  const t = { id: ++toastIds, text, icon };
  toasts.value = [...toasts.value.slice(-2), t];
  setTimeout(() => {
    toasts.value = toasts.value.filter((x) => x.id !== t.id);
  }, 2600);
}
