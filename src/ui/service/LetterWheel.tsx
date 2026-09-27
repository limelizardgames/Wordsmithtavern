import { useEffect, useRef, useState } from 'preact/hooks';
import { paused, selection, shuffleLetters, submit } from '../../app/service';
import { audio } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { Icon } from '../art/Icons';
import './wheel.css';

interface Point {
  x: number;
  y: number;
}

/** Tile centres as fractions of the wheel's size. */
function layout(count: number) {
  const radius = count <= 5 ? 0.33 : count <= 6 ? 0.35 : 0.36;
  const chord = 2 * radius * Math.sin(Math.PI / count);
  const tile = Math.min(0.235, chord * 0.84);
  const centres = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return { x: 0.5 + radius * Math.cos(a), y: 0.5 + radius * Math.sin(a) };
  });
  return { centres, tile };
}

export function wordFrom(letters: string[], picked: number[]) {
  return picked.map((i) => letters[i]).join('');
}

/**
 * The forge wheel. Swipe across letters and let go to submit, or tap letters one at a time
 * (tap the last one again to take it back) and press the check button.
 */
export function LetterWheel({ letters, disabled }: { letters: string[]; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; added: number; startedOnLast: boolean } | null>(null);
  const [pointer, setPointer] = useState<Point | null>(null);
  const { centres, tile } = layout(letters.length);
  const picked = selection.value;

  const hit = (clientX: number, clientY: number, slack: number): number => {
    const el = ref.current;
    if (!el) return -1;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const r = (tile / 2) * slack;
    let best = -1;
    let bestD = Infinity;
    centres.forEach((c, i) => {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < r && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    return best;
  };

  const add = (i: number) => {
    const next = [...selection.value, i];
    selection.value = next;
    audio.play('tile', next.length - 1);
    haptics.tick();
  };

  const toLocal = (clientX: number, clientY: number): Point | null => {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const onPointerDown = (e: PointerEvent) => {
    if (disabled) return;
    const i = hit(e.clientX, e.clientY, 1.15);
    if (i < 0) return;
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    const current = selection.value;
    const at = current.indexOf(i);
    const startedOnLast = at >= 0 && at === current.length - 1;
    if (at < 0) add(i);
    else if (!startedOnLast) selection.value = current.slice(0, at + 1);
    drag.current = { id: e.pointerId, added: 0, startedOnLast };
    setPointer(toLocal(e.clientX, e.clientY));
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setPointer(toLocal(e.clientX, e.clientY));
    const i = hit(e.clientX, e.clientY, 0.9);
    const current = selection.value;
    if (i < 0 || i === current[current.length - 1]) return;
    if (i === current[current.length - 2]) {
      // Sliding back over the previous letter takes the last one back.
      selection.value = current.slice(0, -1);
      d.added = Math.max(0, d.added - 1);
      haptics.tick();
      return;
    }
    if (!current.includes(i)) {
      add(i);
      d.added++;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPointer(null);
    if (d.added > 0) {
      // A swipe: serve the word straight away.
      const word = wordFrom(letters, selection.value);
      selection.value = [];
      submit(word);
    } else if (d.startedOnLast) {
      // Tapping the last letter again takes it back.
      selection.value = selection.value.slice(0, -1);
      haptics.tick();
    }
  };

  const onPointerCancel = () => {
    drag.current = null;
    setPointer(null);
  };

  // Physical keyboards (tablets with keyboards, desktop browsers).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || paused.value || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (/^[a-z]$/.test(key)) {
        const current = selection.value;
        const i = letters.findIndex((l, idx) => l === key && !current.includes(idx));
        if (i >= 0) add(i);
      } else if (e.key === 'Backspace') {
        selection.value = selection.value.slice(0, -1);
      } else if (e.key === 'Enter') {
        const word = wordFrom(letters, selection.value);
        selection.value = [];
        if (word) submit(word);
      } else if (e.key === 'Escape') {
        selection.value = [];
      } else if (e.key === ' ') {
        e.preventDefault();
        shuffleLetters();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [letters, disabled]);

  const path = picked.map((i) => centres[i]!);
  const last = path[path.length - 1];

  return (
    <div
      ref={ref}
      class={`wheel ${disabled ? 'is-disabled' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="group"
      aria-label={`Letters: ${letters.join(' ').toUpperCase()}`}
    >
      <div class="wheel-plate" />
      <svg class="wheel-lines" viewBox="0 0 100 100" aria-hidden="true">
        {path.length > 1 && (
          <polyline
            points={path.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
            class="wheel-line"
          />
        )}
        {last && pointer && (
          <line
            x1={last.x * 100}
            y1={last.y * 100}
            x2={pointer.x * 100}
            y2={pointer.y * 100}
            class="wheel-line is-live"
          />
        )}
      </svg>
      {letters.map((letter, i) => {
        const c = centres[i]!;
        const order = picked.indexOf(i);
        return (
          <div
            key={`${i}-${letter}`}
            class={`wheel-tile ${order >= 0 ? 'is-picked' : ''}`}
            style={{
              left: `${c.x * 100}%`,
              top: `${c.y * 100}%`,
              width: `${tile * 100}%`,
              height: `${tile * 100}%`,
              animationDelay: `${i * 35}ms`,
            }}
          >
            <span>{letter.toUpperCase()}</span>
          </div>
        );
      })}
      <button
        class="wheel-shuffle"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={shuffleLetters}
        disabled={disabled}
        aria-label="Shuffle letters"
      >
        <Icon name="shuffle" size={26} />
      </button>
    </div>
  );
}
