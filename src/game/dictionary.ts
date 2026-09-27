import { canSpell, letterCounts } from './letters';

/**
 * core   - the most familiar words (first choice for hints and signature words)
 * common - further familiar words (used to prove an order is solvable)
 * extra  - rarer words and regional spellings: accepted, never suggested
 */
export type WordTier = 'core' | 'common' | 'extra';

export interface DictionarySource {
  core: string;
  common: string;
  extra: string;
  /** JSON: { "5": ["plain", ...], "6": [...], ... } */
  roots: string;
}

export const DICTIONARY_FILES = {
  core: 'data/words-core.txt',
  common: 'data/words-common.txt',
  extra: 'data/words-extra.txt',
  roots: 'data/roots.json',
} as const;

function splitWords(text: string): string[] {
  return text.split(/\r?\n/).filter((w) => w.length > 0);
}

function maskOf(word: string): number {
  let mask = 0;
  for (let i = 0; i < word.length; i++) mask |= 1 << (word.charCodeAt(i) - 97);
  return mask;
}

export class Dictionary {
  private readonly tiers = new Map<string, WordTier>();
  private readonly familiarWords: string[];
  private readonly familiarMasks: Int32Array;
  private readonly roots: Map<number, string[]>;

  constructor(source: DictionarySource) {
    for (const w of splitWords(source.extra)) this.tiers.set(w, 'extra');
    for (const w of splitWords(source.common)) this.tiers.set(w, 'common');
    for (const w of splitWords(source.core)) this.tiers.set(w, 'core');

    this.familiarWords = [];
    for (const [word, tier] of this.tiers) if (tier !== 'extra') this.familiarWords.push(word);
    this.familiarMasks = new Int32Array(this.familiarWords.length);
    this.familiarWords.forEach((w, i) => (this.familiarMasks[i] = maskOf(w)));

    const parsedRoots = JSON.parse(source.roots) as Record<string, string[]>;
    this.roots = new Map(Object.entries(parsedRoots).map(([len, list]) => [Number(len), list]));
  }

  get size(): number {
    return this.tiers.size;
  }

  isValid(word: string): boolean {
    return this.tiers.has(word);
  }

  tierOf(word: string): WordTier | undefined {
    return this.tiers.get(word);
  }

  isFamiliar(word: string): boolean {
    const tier = this.tiers.get(word);
    return tier === 'core' || tier === 'common';
  }

  rootsOfLength(length: number): readonly string[] {
    return this.roots.get(length) ?? [];
  }

  /** Familiar words (3+ letters) that can be spelled from `letters`, longest first. */
  familiarSubwords(letters: string, minLength = 3): string[] {
    const pool = letterCounts(letters);
    const poolMask = maskOf(letters);
    const out: string[] = [];
    for (let i = 0; i < this.familiarWords.length; i++) {
      const word = this.familiarWords[i]!;
      if (word.length < minLength || word.length > letters.length) continue;
      if ((this.familiarMasks[i]! & ~poolMask) !== 0) continue;
      if (canSpell(word, pool)) out.push(word);
    }
    return out.sort((a, b) => b.length - a.length || a.localeCompare(b));
  }
}

/** Loads the dictionary with a caller-provided text loader (fetch in the app, fs in tests). */
export async function loadDictionary(readText: (path: string) => Promise<string>): Promise<Dictionary> {
  const [core, common, extra, roots] = await Promise.all([
    readText(DICTIONARY_FILES.core),
    readText(DICTIONARY_FILES.common),
    readText(DICTIONARY_FILES.extra),
    readText(DICTIONARY_FILES.roots),
  ]);
  return new Dictionary({ core, common, extra, roots });
}
