#!/usr/bin/env node
/**
 * Builds the game's word lists from SCOWL (via the `wordlist-english` package).
 *
 * Outputs (committed, so the app never needs this script at runtime):
 *   public/data/words-core.txt    The most familiar words (SCOWL 10-20). First choice for hints.
 *   public/data/words-common.txt  Further familiar words (SCOWL 35). Core + common decide whether an
 *                                 order is solvable, and back up the hints.
 *   public/data/words-extra.txt   Everything else we accept as a valid guess (rarer words, other spellings).
 *   public/data/roots.json        Candidate "signature" words per letter-set length, pre-screened so each
 *                                 one hides plenty of familiar sub-words.
 *
 * Run with: npm run dictionary
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORDLIST_DIR = path.dirname(require.resolve('wordlist-english/package.json'));
const NAUGHTY_EN = require.resolve('naughty-words/en.json');
const OUT_DIR = path.join(ROOT, 'public', 'data');

const MIN_LEN = 3;
const MAX_LEN = 8;
const ALL_LEVELS = [10, 20, 35, 40, 50, 55, 60, 70];
const CORE_LEVELS = [10, 20];
const COMMON_LEVELS = [35];
const ACCEPT_VARIANTS = ['english', 'american', 'british', 'canadian', 'australian'];
const COMMON_VARIANTS = ['english', 'american'];

/** Minimum sub-words (3+ letters, excluding the root) a root must hide: [familiar, of which core]. */
const ROOT_MIN_SUBWORDS = { 5: [7, 5], 6: [12, 8], 7: [16, 10], 8: [20, 12] };

/** Interjections without vowels that are fine to accept. Other vowel-less entries are abbreviations. */
const VOWELLESS_OK = new Set([
  'brr',
  'hmm',
  'shh',
  'psst',
  'nth',
  'cwm',
  'crwth',
  'tsk',
  'pfft',
  'zzz',
]);

const rot13 = (s) =>
  s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));

function loadLevel(variant, level) {
  const file = path.join(WORDLIST_DIR, `${variant}-words-${level}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
}

function collect(variants, levels) {
  const out = new Set();
  for (const variant of variants) {
    for (const level of levels) {
      for (const word of loadLevel(variant, level)) {
        if (!/^[a-z]+$/.test(word)) continue; // drops proper nouns, abbreviations like "OK", apostrophes
        if (word.length < MIN_LEN || word.length > MAX_LEN) continue;
        if (!/[aeiouy]/.test(word) && !VOWELLESS_OK.has(word)) continue;
        out.add(word);
      }
    }
  }
  return out;
}

function loadFilter() {
  const filter = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'scripts', 'word-filter.json'), 'utf8'),
  );
  const soft = new Set(filter.soft.map(rot13));
  const block = new Set(filter.block.map(rot13));
  // Anything on the community list that we didn't explicitly soften is blocked outright.
  for (const entry of JSON.parse(fs.readFileSync(NAUGHTY_EN, 'utf8'))) {
    const w = entry.toLowerCase();
    if (/^[a-z]+$/.test(w) && !soft.has(w)) block.add(w);
  }
  return { block, soft };
}

const ALPHA = 26;
function letterCounts(word) {
  const counts = new Uint8Array(ALPHA);
  for (let i = 0; i < word.length; i++) counts[word.charCodeAt(i) - 97]++;
  return counts;
}
function letterMask(word) {
  let mask = 0;
  for (let i = 0; i < word.length; i++) mask |= 1 << (word.charCodeAt(i) - 97);
  return mask;
}

function main() {
  const { block, soft } = loadFilter();

  const accepted = collect(ACCEPT_VARIANTS, ALL_LEVELS);
  const coreSet = collect(COMMON_VARIANTS, CORE_LEVELS);
  const commonSet = collect(COMMON_VARIANTS, COMMON_LEVELS);

  for (const w of block) {
    accepted.delete(w);
    coreSet.delete(w);
    commonSet.delete(w);
  }
  for (const w of soft) {
    coreSet.delete(w);
    commonSet.delete(w);
  }

  const core = [...coreSet].filter((w) => accepted.has(w)).sort();
  const common = [...commonSet].filter((w) => accepted.has(w) && !coreSet.has(w)).sort();
  const familiar = new Set([...core, ...common]);
  const extra = [...accepted].filter((w) => !familiar.has(w)).sort();

  // Pre-screen roots: core words, not lazy plurals, hiding plenty of familiar sub-words.
  const indexed = [...familiar].map((w) => ({
    w,
    core: coreSet.has(w),
    mask: letterMask(w),
    counts: letterCounts(w),
  }));
  const roots = {};
  const rootStats = {};
  for (let len = 5; len <= MAX_LEN; len++) {
    const candidates = core
      .filter((w) => w.length === len)
      .filter((w) => !(w.endsWith('s') && !w.endsWith('ss')));
    const [minFamiliar, minCore] = ROOT_MIN_SUBWORDS[len];
    const keep = [];
    for (const root of candidates) {
      const rootMask = letterMask(root);
      const rootCounts = letterCounts(root);
      let subwords = 0;
      let coreSubwords = 0;
      for (const item of indexed) {
        if (item.w.length > len || item.w === root) continue;
        if ((item.mask & ~rootMask) !== 0) continue;
        let fits = true;
        for (let i = 0; i < ALPHA; i++) {
          if (item.counts[i] > rootCounts[i]) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        subwords++;
        if (item.core) coreSubwords++;
      }
      if (subwords >= minFamiliar && coreSubwords >= minCore) keep.push(root);
    }
    roots[len] = keep;
    rootStats[len] = `${keep.length}/${candidates.length}`;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const write = (name, words) =>
    fs.writeFileSync(path.join(OUT_DIR, name), words.join('\n') + '\n');
  write('words-core.txt', core);
  write('words-common.txt', common);
  write('words-extra.txt', extra);
  fs.writeFileSync(path.join(OUT_DIR, 'roots.json'), JSON.stringify(roots) + '\n');

  console.log(`core words:   ${core.length}`);
  console.log(`common words: ${common.length}`);
  console.log(`extra words:  ${extra.length}`);
  console.log(`roots kept per length (kept/candidates): ${JSON.stringify(rootStats)}`);
}

main();
