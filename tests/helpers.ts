import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Dictionary, DICTIONARY_FILES } from '../src/game/dictionary';

let cached: Dictionary | undefined;

/** The real game dictionary, read straight from public/data. */
export function loadTestDictionary(): Dictionary {
  if (!cached) {
    const read = (p: string) => readFileSync(resolve(__dirname, '..', 'public', p), 'utf8');
    cached = new Dictionary({
      core: read(DICTIONARY_FILES.core),
      common: read(DICTIONARY_FILES.common),
      extra: read(DICTIONARY_FILES.extra),
      roots: read(DICTIONARY_FILES.roots),
    });
  }
  return cached;
}

/** A tiny hand-made dictionary for precise order tests. */
export function tinyDictionary(): Dictionary {
  return new Dictionary({
    core: ['ate', 'eat', 'tea', 'seat', 'east', 'eats', 'teas', 'sate', 'seta', 'tase', 'set'].join('\n'),
    common: ['sat', 'tas', 'eta'].join('\n'),
    extra: ['ates', 'etas'].join('\n'),
    roots: JSON.stringify({ '4': ['seat'] }),
  });
}
