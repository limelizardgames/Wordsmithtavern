/** Letter-multiset helpers. Words are lowercase a-z throughout the game logic. */

const A = 97;

export function letterCounts(word: string): Uint8Array {
  const counts = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) counts[word.charCodeAt(i) - A]!++;
  return counts;
}

/** True if `word` can be spelled using each letter of `pool` at most once. */
export function canSpell(word: string, pool: Uint8Array): boolean {
  const used = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) - A;
    if (c < 0 || c > 25) return false;
    if (++used[c]! > pool[c]!) return false;
  }
  return true;
}

export function normalizeWord(input: string): string {
  return input.trim().toLowerCase();
}

export function isAlphaWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}
