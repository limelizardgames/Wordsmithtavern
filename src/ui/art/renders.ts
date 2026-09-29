/**
 * The tavern's rendered art (see art/blender/). Every layer is a crop of one camera frame, so
 * it is placed by its box in scene units: the same coordinates TavernScene's viewBox uses.
 */
import type { Mood } from '../../game/types';
import manifest from './renders/manifest.json';

export interface Layer {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Entry = { file: string; x: number; y: number; w: number; h: number };
type Manifest = {
  full: [number, number, number, number];
  layers: Record<string, Entry>;
  portraits?: Record<string, { file: string }>;
  fx?: { fire: [number, number]; lamps: [number, number][] };
};

const data = manifest as unknown as Manifest;

const urls = import.meta.glob('./renders/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function url(file: string): string | undefined {
  return urls[`./renders/${file}`];
}

/** A rendered layer ('base', 'counter', 'item:<furniture id>', 'barley:<mood>'). */
export function layer(key: string): Layer | undefined {
  const e = data.layers[key];
  const u = e && url(e.file);
  return u ? { url: u, x: e.x, y: e.y, w: e.w, h: e.h } : undefined;
}

function portrait(art: string, mood: Mood): string | undefined {
  const e = data.portraits?.[`${art}:${mood}`] ?? data.portraits?.[`${art}:neutral`];
  return e && url(e.file);
}

export function barleyPortrait(mood: Mood): string | undefined {
  return portrait('barley', mood);
}

/** A rendered guest or townsfolk portrait, if one exists for this art key. */
export function portraitImage(art: string | undefined, mood: Mood): string | undefined {
  return art ? portrait(art, mood) : undefined;
}

export const SCENE_FX = data.fx ?? {
  fire: [88.96, 189.29] as [number, number],
  lamps: [
    [112.17, 29.0],
    [367.83, 29.0],
  ] as [number, number][],
};

/**
 * Decode the given layers (and Barley) before the tavern first appears, so it never pops in a
 * piece at a time. Resolves after `timeoutMs` at the latest; the rest keep loading.
 */
export function preloadTavern(
  placed: Record<string, string | undefined>,
  timeoutMs = 2500,
): Promise<void> {
  const keys = ['base', 'counter', 'barley:happy', 'barley:neutral'];
  for (const id of Object.values(placed)) if (id) keys.push(`item:${id}`);
  const wanted = keys.map((k) => layer(k)?.url).filter((u): u is string => !!u);
  const portrait = barleyPortrait('neutral');
  if (portrait) wanted.push(portrait);
  const loads = wanted.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
      }),
  );
  return Promise.race([
    Promise.all(loads).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
