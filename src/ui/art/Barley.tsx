import type { Mood } from '../../game/types';
import { INK } from './color';

const S = {
  stroke: INK,
  'stroke-width': 1.8,
  'stroke-linejoin': 'round' as const,
  'stroke-linecap': 'round' as const,
};
const MOUTH = '#7a2a22';

/** Barley, the enchanted tankard, drawn in a 64 x 72 box. */
export function BarleyGraphic({
  mood = 'neutral',
  talking = false,
}: {
  mood?: Mood;
  talking?: boolean;
}) {
  const eyes =
    mood === 'happy' ? (
      <g stroke={INK} stroke-width="2.2" fill="none" stroke-linecap="round">
        <path d="M16 41 Q19.5 37 23 41" />
        <path d="M31 41 Q34.5 37 38 41" />
      </g>
    ) : (
      <g class="portrait-eyes">
        <g fill="#fffaf0" stroke={INK} stroke-width="1.2">
          <ellipse
            cx="19.5"
            cy="40"
            rx={mood === 'surprised' ? 4.6 : 4}
            ry={mood === 'surprised' ? 5.2 : 4.6}
          />
          <ellipse
            cx="34.5"
            cy="40"
            rx={mood === 'surprised' ? 4.6 : 4}
            ry={mood === 'surprised' ? 5.2 : 4.6}
          />
        </g>
        <g fill={INK}>
          <circle cx="20.3" cy="40.6" r="2.2" />
          <circle cx="35.3" cy="40.6" r="2.2" />
        </g>
        <g fill="#fff">
          <circle cx="21" cy="39.6" r="0.8" />
          <circle cx="36" cy="39.6" r="0.8" />
        </g>
      </g>
    );
  const brows: Record<Mood, string> = {
    neutral: 'M15 33.5 Q19.5 32 24 33.5 M30 33.5 Q34.5 32 39 33.5',
    happy: 'M15 32.5 Q19.5 30 24 32 M30 32 Q34.5 30 39 32.5',
    grumpy: 'M15 31.5 L24 35 M30 35 L39 31.5',
    sad: 'M15 35 L24 32 M30 32 L39 35',
    surprised: 'M15 30.5 Q19.5 27.5 24 30 M30 30 Q34.5 27.5 39 30.5',
  };
  const mouth =
    mood === 'happy' ? (
      <path d="M21 49 Q27 57 33 49 Z" fill={MOUTH} stroke={INK} stroke-width="1.3" />
    ) : mood === 'surprised' ? (
      <ellipse cx="27" cy="51.5" rx="3" ry="3.6" fill={MOUTH} stroke={INK} stroke-width="1.3" />
    ) : mood === 'grumpy' || mood === 'sad' ? (
      <path
        d="M22 53 Q27 49 32 53"
        stroke={INK}
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
    ) : (
      <path
        d="M22 50.5 Q27 54 32 50.5"
        stroke={INK}
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
    );
  return (
    <g class={talking ? 'portrait barley is-talking' : 'portrait barley'}>
      <g class="barley-bob">
        <path
          d="M46 27 C 61 25, 63 53, 46 55"
          fill="none"
          stroke={INK}
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          d="M46 27 C 61 25, 63 53, 46 55"
          fill="none"
          stroke="#a8b1b6"
          stroke-width="6"
          stroke-linecap="round"
        />
        <path d="M7 20 L48 20 L46 65 Q46 69 42 69 L13 69 Q9 69 9 65 Z" fill="#a0673a" {...S} />
        <g stroke="#7a4b2a" stroke-width="1.3">
          <path d="M17 29 L17 62 M27.5 29 L27.5 62 M38 29 L38 62" />
        </g>
        <rect
          x="7.6"
          y="23"
          width="40"
          height="6"
          rx="1.5"
          fill="#a8b1b6"
          {...S}
          stroke-width={1.4}
        />
        <rect
          x="8.6"
          y="59"
          width="38"
          height="6"
          rx="1.5"
          fill="#a8b1b6"
          {...S}
          stroke-width={1.4}
        />
        <path
          d="M4 22 C 1 14, 9 8, 15 11 C 17 4, 29 2, 32 8 C 36 2, 48 4, 47 12 C 54 12, 56 21, 50 23 C 49 28, 44 28, 43 24 C 30 26, 19 26, 11 25 C 9 28, 3 27, 4 22 Z"
          fill="#fff8e8"
          {...S}
        />
        <circle cx="12" cy="16" r="1.4" fill="#fff" opacity="0.8" />
        <g fill="#e8746a" opacity="0.4">
          <ellipse cx="14" cy="47" rx="3.2" ry="2" />
          <ellipse cx="40" cy="47" rx="3.2" ry="2" />
        </g>
        {eyes}
        <path
          d={brows[mood]}
          stroke="#4a2c18"
          stroke-width="2.2"
          fill="none"
          stroke-linecap="round"
        />
        <g class="portrait-mouth-rest">{mouth}</g>
        <ellipse
          class="portrait-mouth-open"
          cx="27"
          cy="51.5"
          rx="3.6"
          ry="2.8"
          fill={MOUTH}
          stroke={INK}
          stroke-width="1.3"
        />
      </g>
    </g>
  );
}

export function Barley({
  mood,
  talking,
  class: className,
}: {
  mood?: Mood;
  talking?: boolean;
  class?: string;
}) {
  return (
    <svg class={className} viewBox="0 0 64 72" aria-hidden="true">
      <BarleyGraphic mood={mood} talking={talking} />
    </svg>
  );
}
