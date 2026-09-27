import { INK } from './color';

/** The hanging tavern sign used as the game's logo. */
export function Sign({ class: className }: { class?: string }) {
  return (
    <svg class={className} viewBox="0 0 320 190" role="img" aria-label="Wordsmith Tavern">
      <g stroke={INK} stroke-width="3" stroke-linecap="round">
        <path
          d="M40 0 L70 42 M280 0 L250 42"
          stroke="#8a8f94"
          stroke-dasharray="6 5"
          stroke-width="4"
        />
      </g>
      <path
        d="M18 48 Q160 30 302 48 L296 168 Q160 184 24 168 Z"
        fill="#7a4b2a"
        stroke={INK}
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M30 58 Q160 42 290 58 L285 158 Q160 172 35 158 Z"
        fill="#8f5a33"
        stroke="#4a2c18"
        stroke-width="2"
      />
      <g stroke="#6a3f22" stroke-width="1.6" opacity="0.7">
        <path d="M40 84 Q160 72 280 84" fill="none" />
        <path d="M40 136 Q160 148 280 136" fill="none" />
      </g>
      <g fill="#c9a227" stroke={INK} stroke-width="1.5">
        <circle cx="70" cy="52" r="5" />
        <circle cx="250" cy="52" r="5" />
      </g>
      <text
        x="160"
        y="108"
        text-anchor="middle"
        font-family="var(--font-logo)"
        font-size="37"
        fill="#ffd36b"
        stroke="#2a1a10"
        stroke-width="6"
        paint-order="stroke"
      >
        Wordsmith
      </text>
      <text
        x="160"
        y="148"
        text-anchor="middle"
        font-family="var(--font-logo)"
        font-size="24"
        letter-spacing="6"
        fill="#fff4dc"
        stroke="#2a1a10"
        stroke-width="5"
        paint-order="stroke"
      >
        TAVERN
      </text>
      <g transform="translate(60 138) scale(0.5)">
        <path d="M-14 -14 L14 -14 L12 16 L-12 16 Z" fill="#c8d2d8" stroke={INK} stroke-width="3" />
        <path d="M13 -8 C 24 -8, 24 8, 13 8" fill="none" stroke={INK} stroke-width="6" />
        <path
          d="M-17 -12 C -18 -22, -6 -24, 0 -20 C 6 -26, 18 -22, 17 -12 Z"
          fill="#fff8e8"
          stroke={INK}
          stroke-width="3"
        />
      </g>
      <g transform="translate(260 140) scale(0.5)">
        <path
          d="M-16 10 L16 10 L20 18 L-20 18 Z M-4 10 L-4 -10 L4 -10 L4 10 Z M-14 -10 L14 -10 L10 -18 L-10 -18 Z"
          fill="#9aa3a8"
          stroke={INK}
          stroke-width="3"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
}
