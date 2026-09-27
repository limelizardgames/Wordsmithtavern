import type { Dictionary } from './dictionary';
import { pick, shuffle, type Rng } from './rng';
import type { RecipeDef, SlotSpec } from './types';

export interface Puzzle {
  /** The signature word that uses every letter. */
  root: string;
  /** Letters in the order they're laid out on the wheel. */
  letters: string[];
  /** Familiar words hidden in the letters (root included), longest first. */
  familiar: string[];
}

/**
 * Can every slot be filled with a *different* familiar word?
 *
 * "All letters" slots need full-length words. The remaining slots accept any word at least `min`
 * letters long; those sets are nested, so Hall's condition reduces to a check per threshold.
 * `slack` demands a few spare words at the short thresholds so orders never feel razor-thin.
 */
export function isSolvable(
  slots: readonly SlotSpec[],
  familiar: readonly string[],
  letterCount: number,
  slack = 0,
): boolean {
  const allSlots = slots.filter((s) => s.all).length;
  const fullLength = familiar.filter((w) => w.length === letterCount).length;
  if (fullLength < allSlots) return false;

  // Full-length words beyond those reserved for signature slots can still fill ordinary slots.
  const lengths = familiar.map((w) => w.length).sort((a, b) => b - a);
  const spareLengths = lengths.slice(allSlots);

  const thresholds = [...new Set(slots.filter((s) => !s.all).map((s) => s.min))];
  for (const t of thresholds) {
    const needed = slots.filter((s) => !s.all && s.min >= t).length;
    const available = spareLengths.filter((len) => len >= t).length;
    const extra = t <= 4 ? slack : 0;
    if (available < needed + extra) return false;
  }
  return true;
}

function scramble(root: string, familiar: readonly string[], rng: Rng): string[] {
  const letters = root.split('');
  const fullWords = new Set(familiar.filter((w) => w.length === root.length));
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = shuffle(rng, letters);
    if (!fullWords.has(candidate.join(''))) return candidate;
  }
  return shuffle(rng, letters);
}

export interface GenerateOptions {
  /** Roots to avoid (recently played). */
  avoid?: ReadonlySet<string>;
  maxAttempts?: number;
}

export function generatePuzzle(
  recipe: Pick<RecipeDef, 'letters' | 'slots'>,
  dict: Dictionary,
  rng: Rng,
  options: GenerateOptions = {},
): Puzzle {
  const roots = dict.rootsOfLength(recipe.letters);
  if (roots.length === 0) throw new Error(`No root words of length ${recipe.letters}`);
  const avoid = options.avoid ?? new Set<string>();
  const maxAttempts = options.maxAttempts ?? 80;

  // Progressively relax: fresh roots with slack, then any root with slack, then any solvable root.
  const passes: Array<{ allowRecent: boolean; slack: number }> = [
    { allowRecent: false, slack: 2 },
    { allowRecent: true, slack: 2 },
    { allowRecent: true, slack: 0 },
  ];
  for (const pass of passes) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const root = pick(rng, roots);
      if (!pass.allowRecent && avoid.has(root)) continue;
      const familiar = dict.familiarSubwords(root);
      if (!isSolvable(recipe.slots, familiar, recipe.letters, pass.slack)) continue;
      return { root, letters: scramble(root, familiar, rng), familiar };
    }
  }
  throw new Error(`Could not generate a solvable ${recipe.letters}-letter puzzle`);
}
