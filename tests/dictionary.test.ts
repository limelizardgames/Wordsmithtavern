import { describe, expect, it } from 'vitest';
import { loadTestDictionary } from './helpers';

const dict = loadTestDictionary();

describe('dictionary', () => {
  it('accepts everyday words and knows their tier', () => {
    for (const w of ['ale', 'stew', 'bread', 'tavern', 'dragon', 'wizard']) {
      expect(dict.isValid(w), w).toBe(true);
    }
    expect(dict.tierOf('bread')).toBe('core');
    expect(dict.tierOf('stew')).toBe('common');
    expect(dict.isFamiliar('tavern')).toBe(true);
  });

  it('accepts rarer words and other spellings without suggesting them', () => {
    expect(dict.isValid('colour')).toBe(true);
    expect(dict.isValid('color')).toBe(true);
    expect(dict.tierOf('colour')).toBe('extra');
  });

  it('rejects non-words, short words and proper nouns', () => {
    expect(dict.isValid('xqzt')).toBe(false);
    expect(dict.isValid('at')).toBe(false);
    expect(dict.isValid('london')).toBe(false);
  });

  it('never accepts blocked words, and never suggests softened ones', () => {
    const rot13 = (s: string) =>
      s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));
    // Encoded so the test file stays clean: a slur and a strong swear word.
    for (const encoded of ['avttre', 'shpx']) expect(dict.isValid(rot13(encoded))).toBe(false);
    // Softened words: fine to type, never a hint or signature word.
    expect(dict.isValid('vomit')).toBe(true);
    expect(dict.isFamiliar('vomit')).toBe(false);
  });

  it('finds every familiar word hidden in a set of letters', () => {
    const words = dict.familiarSubwords('tavern');
    expect(words[0]).toBe('tavern');
    expect(words).toEqual(expect.arrayContaining(['tavern', 'ant', 'eat', 'rent', 'vent', 'near']));
    for (const w of words) expect(w.length).toBeGreaterThanOrEqual(3);
    expect(words).not.toContain('tavernr');
  });

  it('ships pre-screened roots for every letter-set size', () => {
    for (const len of [5, 6, 7, 8]) {
      const roots = dict.rootsOfLength(len);
      expect(roots.length).toBeGreaterThan(300);
      for (const r of roots.slice(0, 50)) {
        expect(r).toHaveLength(len);
        expect(dict.tierOf(r)).toBe('core');
      }
    }
  });
});
