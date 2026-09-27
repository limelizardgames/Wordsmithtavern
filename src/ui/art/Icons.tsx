import type { JSX } from 'preact';
import type { IngredientId, RecipeIconId } from '../../game/types';
import { INK } from './color';

const S = {
  stroke: INK,
  'stroke-width': 1.6,
  'stroke-linejoin': 'round' as const,
  'stroke-linecap': 'round' as const,
};

interface IconProps {
  size?: number | string;
  class?: string;
  title?: string;
}

function svg(
  viewBox: string,
  body: JSX.Element,
  { size = 24, class: className, title }: IconProps,
) {
  return (
    <svg
      class={['icon', className].filter(Boolean).join(' ')}
      viewBox={viewBox}
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {body}
    </svg>
  );
}

// ── UI icons (24 x 24) ────────────────────────────────────────────────────
const UI: Record<string, JSX.Element> = {
  coin: (
    <g>
      <circle cx="12" cy="12" r="9.5" fill="#f2c14e" {...S} />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#c98a1b" stroke-width="1.4" />
      <path
        d="M9 9.5 L10.3 15 L12 11 L13.7 15 L15 9.5"
        fill="none"
        stroke="#8a5a0e"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <path
        d="M7 7.5 q2 -2 4 -2.4"
        stroke="#fff6c8"
        stroke-width="1.4"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  star: (
    <path
      d="M12 2.5 L14.8 8.6 L21.4 9.3 L16.4 13.7 L17.9 20.3 L12 16.9 L6.1 20.3 L7.6 13.7 L2.6 9.3 L9.2 8.6 Z"
      fill="#f2c14e"
      {...S}
    />
  ),
  starEmpty: (
    <path
      d="M12 2.5 L14.8 8.6 L21.4 9.3 L16.4 13.7 L17.9 20.3 L12 16.9 L6.1 20.3 L7.6 13.7 L2.6 9.3 L9.2 8.6 Z"
      fill="rgba(0,0,0,0.25)"
      stroke="#8a6a44"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
  ),
  heart: (
    <path
      d="M12 20.5 C 4 15, 2 10.5, 4.2 7 C 6.5 3.6, 10.5 4.3, 12 7.4 C 13.5 4.3, 17.5 3.6, 19.8 7 C 22 10.5, 20 15, 12 20.5 Z"
      fill="#e0664f"
      {...S}
    />
  ),
  heartEmpty: (
    <path
      d="M12 20.5 C 4 15, 2 10.5, 4.2 7 C 6.5 3.6, 10.5 4.3, 12 7.4 C 13.5 4.3, 17.5 3.6, 19.8 7 C 22 10.5, 20 15, 12 20.5 Z"
      fill="rgba(0,0,0,0.2)"
      stroke="#8a6a44"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
  ),
  gear: (
    <g>
      <path
        d="M10.2 2.5 h3.6 l0.6 2.7 a7.6 7.6 0 0 1 1.9 1.1 l2.6 -0.9 l1.8 3.1 l-2.1 1.8 a7.6 7.6 0 0 1 0 2.2 l2.1 1.8 l-1.8 3.1 l-2.6 -0.9 a7.6 7.6 0 0 1 -1.9 1.1 l-0.6 2.7 h-3.6 l-0.6 -2.7 a7.6 7.6 0 0 1 -1.9 -1.1 l-2.6 0.9 l-1.8 -3.1 l2.1 -1.8 a7.6 7.6 0 0 1 0 -2.2 l-2.1 -1.8 l1.8 -3.1 l2.6 0.9 a7.6 7.6 0 0 1 1.9 -1.1 Z"
        fill="#d8c3a0"
        {...S}
      />
      <circle cx="12" cy="12" r="3.2" fill="#7a4b2a" {...S} />
    </g>
  ),
  shuffle: (
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 7 h4 c4 0 6 10 10 10 h3" />
      <path d="M3 17 h4 c1.6 0 2.8 -1.6 3.8 -3.4 M13.2 10 c1 -1.7 2.2 -3 3.8 -3 h3" />
      <path d="M17.5 4 l3 3 l-3 3 M17.5 14 l3 3 l-3 3" />
    </g>
  ),
  spoon: (
    <g>
      <path d="M14.5 10 L5 19.5 a1.6 1.6 0 0 0 2.2 2.2 L16.7 12.2" fill="#c48a55" {...S} />
      <ellipse
        cx="17.5"
        cy="7"
        rx="4.2"
        ry="5.4"
        transform="rotate(45 17.5 7)"
        fill="#dba56a"
        {...S}
      />
      <ellipse cx="18" cy="6.6" rx="2" ry="3" transform="rotate(45 18 6.6)" fill="#b27a45" />
    </g>
  ),
  check: (
    <path
      d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  ),
  close: (
    <path
      d="M6 6 L18 18 M18 6 L6 18"
      fill="none"
      stroke="currentColor"
      stroke-width="2.8"
      stroke-linecap="round"
    />
  ),
  back: (
    <path
      d="M15 4.5 L7.5 12 L15 19.5"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  ),
  book: (
    <g>
      <path
        d="M3 5 C 6 3.6, 9.5 3.6, 12 5.6 C 14.5 3.6, 18 3.6, 21 5 L21 19.5 C 18 18.2, 14.5 18.2, 12 20 C 9.5 18.2, 6 18.2, 3 19.5 Z"
        fill="#8e2c3c"
        {...S}
      />
      <path d="M12 5.6 L12 20" stroke={INK} stroke-width="1.4" />
      <path
        d="M5.5 8 q3 -1 5 0 M5.5 11 q3 -1 5 0 M13.5 8 q3 -1 5 0 M13.5 11 q3 -1 5 0"
        stroke="#f2c14e"
        stroke-width="1.1"
        fill="none"
      />
    </g>
  ),
  shop: (
    <g>
      <path d="M4 9 L20 9 L18.5 20.5 L5.5 20.5 Z" fill="#c48a55" {...S} />
      <path d="M8 9 C 8 3.5, 16 3.5, 16 9" fill="none" {...S} stroke-width={2} />
      <path d="M6 13 h12" stroke="#7a4b2a" stroke-width="1.4" />
      <circle cx="12" cy="16" r="2" fill="#f2c14e" stroke={INK} stroke-width="1" />
    </g>
  ),
  scroll: (
    <g>
      <path
        d="M6 4 h11 a2.5 2.5 0 0 1 2.5 2.5 v11 a2.5 2.5 0 0 1 -2.5 2.5 H7"
        fill="#f3e3bd"
        {...S}
      />
      <path
        d="M6 4 a2.5 2.5 0 0 0 -2.5 2.5 v1.5 h5 V6.5 A2.5 2.5 0 0 0 6 4 Z"
        fill="#dcc084"
        {...S}
      />
      <path
        d="M7 20 a2.5 2.5 0 0 1 -2.5 -2.5 v-1 h5 v1 A2.5 2.5 0 0 1 7 20 Z"
        fill="#dcc084"
        {...S}
      />
      <path
        d="M11 9 h6 M11 12 h6 M11 15 h4"
        stroke="#8a6a44"
        stroke-width="1.3"
        stroke-linecap="round"
      />
    </g>
  ),
  play: (
    <g>
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" fill="#3f7d3a" {...S} />
      <path d="M10 9 L15.5 12 L10 15 Z" fill="#fff4dc" />
    </g>
  ),
  ad: (
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" />
      <path d="M10 9 L15.5 12 L10 15 Z" fill="currentColor" />
    </g>
  ),
  lock: (
    <g>
      <rect x="5" y="10.5" width="14" height="10" rx="2" fill="#b8925a" {...S} />
      <path d="M8 10.5 V8 a4 4 0 0 1 8 0 v2.5" fill="none" {...S} stroke-width={2} />
      <circle cx="12" cy="15" r="1.6" fill={INK} />
    </g>
  ),
  sparkle: (
    <path
      d="M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2 Z"
      fill="#ffd36b"
      {...S}
      stroke-width={1.3}
    />
  ),
  music: (
    <g>
      <path
        d="M9 17.5 V5.5 L19 3.5 V15.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <ellipse cx="6.7" cy="17.7" rx="2.8" ry="2.2" fill="currentColor" />
      <ellipse cx="16.7" cy="15.7" rx="2.8" ry="2.2" fill="currentColor" />
    </g>
  ),
  sound: (
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 9.5 h3.5 L12 5.5 v13 L7.5 14.5 H4 Z" fill="currentColor" />
      <path d="M15.5 9 q2 3 0 6 M18.5 6.5 q4 5.5 0 11" />
    </g>
  ),
  vibrate: (
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <rect x="8" y="4" width="8" height="16" rx="2" />
      <path d="M4.5 8 v8 M19.5 8 v8 M2 10 v4 M22 10 v4" />
    </g>
  ),
  leaf: (
    <path d="M5 19 C 5 9, 11 4, 20 4 C 20 13, 15 19, 5 19 Z M5 19 L13 11" fill="#7fb85a" {...S} />
  ),
  door: (
    <g>
      <path d="M5 21 V6 a7 5 0 0 1 14 0 V21 Z" fill="#7a4b2a" {...S} />
      <path d="M12 3 V21 M5 11 h14" stroke="#4a2c18" stroke-width="1.3" />
      <circle cx="15" cy="14.5" r="1.3" fill="#f2c14e" stroke={INK} stroke-width="0.8" />
    </g>
  ),
  crown: (
    <path d="M3.5 18 L2.5 7 L8 11.5 L12 4.5 L16 11.5 L21.5 7 L20.5 18 Z" fill="#f2c14e" {...S} />
  ),
  hourglass: (
    <g>
      <path d="M6 3 h12 M6 21 h12" {...S} stroke-width={2} />
      <path
        d="M7 3 C 7 9, 11 10, 11 12 C 11 14, 7 15, 7 21 H17 C 17 15, 13 14, 13 12 C 13 10, 17 9, 17 3 Z"
        fill="#f3e3bd"
        {...S}
      />
      <path d="M9 19.5 C 9 17, 12 15.5, 12 14 C 12 15.5, 15 17, 15 19.5 Z" fill="#dcb46a" />
    </g>
  ),
  gift: (
    <g>
      <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" fill="#b8432f" {...S} />
      <rect x="2.5" y="6.5" width="19" height="4.5" rx="1.2" fill="#e0664f" {...S} />
      <path d="M12 6.5 V20.5" stroke="#f2c14e" stroke-width="2.6" />
      <path
        d="M12 6.5 C 9 2, 5.5 4, 8 6.5 M12 6.5 C 15 2, 18.5 4, 16 6.5"
        fill="none"
        stroke="#f2c14e"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </g>
  ),
  bell: (
    <g>
      <path
        d="M5 17 C 6.5 15, 6 12, 6.5 9.5 C 7.2 6, 9.5 4.5, 12 4.5 C 14.5 4.5, 16.8 6, 17.5 9.5 C 18 12, 17.5 15, 19 17 Z"
        fill="#f2c14e"
        {...S}
      />
      <circle cx="12" cy="19" r="1.8" fill="#c98a1b" {...S} />
    </g>
  ),
  info: (
    <g>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" />
      <path
        d="M12 11 v6 M12 7.5 v0.2"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
      />
    </g>
  ),
  shield: (
    <path
      d="M12 2.8 L19.5 5.6 C 19.5 13, 17 18, 12 21.2 C 7 18, 4.5 13, 4.5 5.6 Z"
      fill="#6aa0d8"
      {...S}
    />
  ),
  trash: (
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4.5 6.5 h15 M9.5 6.5 V4 h5 v2.5 M6.5 6.5 l1 14 h9 l1 -14 M10 10 v7 M14 10 v7" />
    </g>
  ),
};

export type UiIconName = keyof typeof UI;

export function Icon({ name, ...props }: IconProps & { name: UiIconName }) {
  return svg('0 0 24 24', UI[name]!, props);
}

// ── Ingredients (24 x 24) ─────────────────────────────────────────────────
const INGREDIENTS: Record<IngredientId, JSX.Element> = {
  grain: (
    <g>
      <path d="M12 22 V9" stroke="#b8862f" stroke-width="1.8" stroke-linecap="round" />
      {[5, 8.5, 12].map((y) => (
        <g fill="#e8c05a" {...S} stroke-width={1.1}>
          <ellipse cx="9.6" cy={y + 1} rx="2" ry="3.1" transform={`rotate(-30 9.6 ${y + 1})`} />
          <ellipse cx="14.4" cy={y + 1} rx="2" ry="3.1" transform={`rotate(30 14.4 ${y + 1})`} />
        </g>
      ))}
      <ellipse cx="12" cy="3.6" rx="1.9" ry="2.8" fill="#e8c05a" {...S} stroke-width={1.1} />
    </g>
  ),
  hops: (
    <g>
      <path d="M12 2 q3 1 3 4" stroke="#3f7d3a" stroke-width="1.6" fill="none" />
      <path d="M12 5 C 5 7, 6 18, 12 22 C 18 18, 19 7, 12 5 Z" fill="#9fd06a" {...S} />
      <path
        d="M8 10 q4 2 8 0 M7.5 14 q4.5 2 9 0 M9 18 q3 1.6 6 0"
        stroke="#5d9a3a"
        stroke-width="1.2"
        fill="none"
      />
    </g>
  ),
  honey: (
    <g>
      <path d="M6 9 C 4 14, 5 20, 12 21 C 19 20, 20 14, 18 9 Z" fill="#e8a53a" {...S} />
      <rect x="6" y="6" width="12" height="4" rx="1.5" fill="#c48a55" {...S} />
      <path d="M8 13 q4 2 8 0" stroke="#fff1b0" stroke-width="1.4" fill="none" />
      <path d="M16 5 L20 1.5" stroke="#8a5a36" stroke-width="1.6" stroke-linecap="round" />
    </g>
  ),
  apple: (
    <g>
      <path
        d="M12 7 C 7 4, 3 8, 4.5 13.5 C 6 19, 9.5 21.5, 12 20 C 14.5 21.5, 18 19, 19.5 13.5 C 21 8, 17 4, 12 7 Z"
        fill="#d9483b"
        {...S}
      />
      <path
        d="M12 7 q0 -3 1.8 -4.5"
        stroke="#6b4226"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M13 5 C 15 2, 19 3, 19 4.5 C 17 6, 14 6, 13 5 Z"
        fill="#6fae4f"
        stroke={INK}
        stroke-width="1"
      />
      <path
        d="M7.5 11 q0.5 -2 2.5 -2.6"
        stroke="#fff"
        stroke-width="1.3"
        fill="none"
        opacity="0.7"
        stroke-linecap="round"
      />
    </g>
  ),
  berry: (
    <g>
      <g fill="#6b3b8c" {...S} stroke-width={1.2}>
        <circle cx="8.5" cy="14" r="4" />
        <circle cx="15.5" cy="14" r="4" />
        <circle cx="12" cy="18.5" r="4" />
      </g>
      <path d="M12 10 q-1 -4 1 -7" stroke="#3f7d3a" stroke-width="1.5" fill="none" />
      <path
        d="M12 6 C 8 4, 6 7, 7 8 C 9 9, 11 8, 12 6 Z"
        fill="#6fae4f"
        stroke={INK}
        stroke-width="1"
      />
      <g fill="#fff" opacity="0.6">
        <circle cx="7.5" cy="12.8" r="0.9" />
        <circle cx="14.5" cy="12.8" r="0.9" />
      </g>
    </g>
  ),
  carrot: (
    <g>
      <path d="M17 7 C 13 6, 5 16, 4 20 C 8 19, 18 11, 17 7 Z" fill="#f08a2c" {...S} />
      <path d="M8 14 l2 1 M11 11 l2 1" stroke="#b85a14" stroke-width="1.1" />
      <path
        d="M17 7 C 17 4, 19 2, 21 2 M17 7 C 19 6, 21 6.5, 22 8 M17 7 C 16 4.5, 15 3.5, 13.5 3"
        stroke="#4f8a35"
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  potato: (
    <g>
      <path
        d="M5 11 C 4 6, 10 3.5, 14.5 5 C 19.5 6.5, 21 11, 19.5 15 C 18 19.5, 12 21, 8 19 C 5 17.5, 5.5 14, 5 11 Z"
        fill="#c9a062"
        {...S}
      />
      <g fill="#8a6a38">
        <circle cx="9" cy="10" r="0.9" />
        <circle cx="14" cy="9" r="0.8" />
        <circle cx="16" cy="14" r="0.9" />
        <circle cx="10.5" cy="15.5" r="0.8" />
      </g>
    </g>
  ),
  onion: (
    <g>
      <path
        d="M12 5 C 5 8, 4 16, 8 19.5 C 10 21, 14 21, 16 19.5 C 20 16, 19 8, 12 5 Z"
        fill="#e8cfa8"
        {...S}
      />
      <path
        d="M12 5 C 9 9, 9 17, 12 21 M12 5 C 15 9, 15 17, 12 21"
        stroke="#c9a57a"
        stroke-width="1.1"
        fill="none"
      />
      <path
        d="M12 5 q-1 -2 -3 -3 M12 5 q1 -2.5 3.5 -3"
        stroke="#6fae4f"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  mushroom: (
    <g>
      <path d="M9.5 13 L9 20 Q12 21.5 15 20 L14.5 13 Z" fill="#f3e3bd" {...S} />
      <path d="M3 13.5 C 3 5, 21 5, 21 13.5 Z" fill="#c0392b" {...S} />
      <g fill="#fff4dc">
        <circle cx="8" cy="10" r="1.5" />
        <circle cx="13.5" cy="8.4" r="1.2" />
        <circle cx="16.8" cy="11.2" r="1.1" />
      </g>
    </g>
  ),
  meat: (
    <g>
      <path d="M14 10 C 11 3, 3 5, 4 11 C 5 16, 10 17, 13 14 Z" fill="#b8563a" {...S} />
      <path d="M6 9.5 q3 -3 6 0" stroke="#e0906a" stroke-width="1.3" fill="none" />
      <path d="M12.5 13 L18 18.5" stroke={INK} stroke-width="4.4" stroke-linecap="round" />
      <path d="M12.5 13 L18 18.5" stroke="#f6eedc" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="19.2" cy="17.2" r="1.8" fill="#f6eedc" {...S} stroke-width={1.1} />
      <circle cx="17.2" cy="19.8" r="1.8" fill="#f6eedc" {...S} stroke-width={1.1} />
    </g>
  ),
  fish: (
    <g>
      <path d="M3 12 C 7 5.5, 14 5.5, 17 12 C 14 18.5, 7 18.5, 3 12 Z" fill="#6aa0d8" {...S} />
      <path d="M17 12 L22 7.5 L21 12 L22 16.5 Z" fill="#4a80b8" {...S} />
      <circle cx="7.5" cy="11" r="1.1" fill={INK} />
      <path d="M10 9 q2 3 0 6 M13 9.5 q1.6 2.5 0 5" stroke="#3f6fb0" stroke-width="1" fill="none" />
    </g>
  ),
  cheese: (
    <g>
      <path d="M3 17 L3 11 L19 5 L21 10 L21 17 Z" fill="#f2c94e" {...S} />
      <path d="M3 11 L21 10" stroke={INK} stroke-width="1.2" />
      <g fill="#d9a92e">
        <circle cx="8" cy="14" r="1.4" />
        <circle cx="14" cy="13" r="1.1" />
        <circle cx="17.5" cy="15.2" r="1" />
      </g>
    </g>
  ),
  egg: (
    <g>
      <path
        d="M12 3 C 7 3, 5 11, 5 14 C 5 18.5, 8 21, 12 21 C 16 21, 19 18.5, 19 14 C 19 11, 17 3, 12 3 Z"
        fill="#fbf6ea"
        {...S}
      />
      <path
        d="M8.5 9 q1 -3 3 -3.6"
        stroke="#fff"
        stroke-width="1.4"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  herb: (
    <g>
      <path
        d="M12 22 C 12 15, 11 9, 8 3"
        stroke="#3f7d3a"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
      />
      {[
        [9.5, 6, -40],
        [13.5, 9, 40],
        [10.8, 12.5, -40],
        [14.5, 15.5, 40],
      ].map(([x, y, a]) => (
        <ellipse
          cx={x}
          cy={y}
          rx="3.3"
          ry="1.8"
          transform={`rotate(${a} ${x} ${y})`}
          fill="#7fb85a"
          {...S}
          stroke-width={1.1}
        />
      ))}
    </g>
  ),
  pepper: (
    <g>
      <path
        d="M15 6 C 20 8, 17 16, 11 19 C 7.5 21, 4 21, 3.5 19.5 C 8 18.5, 10 13, 11 9 C 11.6 6.8, 13 5.5, 15 6 Z"
        fill="#d9362b"
        {...S}
      />
      <path
        d="M15 6 q1 -2.5 3 -3.5"
        stroke="#3f7d3a"
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M12 9 q1 -1.6 2.4 -1.6"
        stroke="#fff"
        stroke-width="1.2"
        fill="none"
        opacity="0.7"
        stroke-linecap="round"
      />
    </g>
  ),
  milk: (
    <g>
      <path
        d="M9 3 h6 v3 l2 3 v11 a1.5 1.5 0 0 1 -1.5 1.5 h-7 a1.5 1.5 0 0 1 -1.5 -1.5 V9 l2 -3 Z"
        fill="#fbfaf5"
        {...S}
      />
      <rect x="9" y="2" width="6" height="2.5" rx="1" fill="#6aa0d8" {...S} stroke-width={1.1} />
      <path d="M7 12 h10 v4 H7 Z" fill="#6aa0d8" opacity="0.7" />
    </g>
  ),
  butter: (
    <g>
      <path d="M3 14 L9 9 L21 11 L21 16 L15 20 L3 18 Z" fill="#ffe28a" {...S} />
      <path d="M3 14 L15 16 L21 11 M15 16 L15 20" stroke={INK} stroke-width="1.2" fill="none" />
    </g>
  ),
  salt: (
    <g>
      <path
        d="M8 9 C 8 5, 16 5, 16 9 L17 20 a1.5 1.5 0 0 1 -1.5 1.5 h-7 A1.5 1.5 0 0 1 7 20 Z"
        fill="#e8f1f5"
        {...S}
      />
      <path d="M8 9 C 8 5, 16 5, 16 9 Z" fill="#9aa3a8" {...S} />
      <g fill={INK}>
        <circle cx="10.5" cy="6.8" r="0.6" />
        <circle cx="12" cy="6.2" r="0.6" />
        <circle cx="13.5" cy="6.8" r="0.6" />
      </g>
      <path d="M9 14 h6" stroke="#b8c6cc" stroke-width="1.2" />
    </g>
  ),
  fire: (
    <g>
      <path
        d="M12 22 C 5 20, 5 13, 9 8 C 9 11.5, 11 12, 11.5 10 C 12 7, 11 4.5, 13 2 C 14 6.5, 20 9, 18.5 15.5 C 17.8 19, 15 22, 12 22 Z"
        fill="#ff8a3c"
        {...S}
      />
      <path
        d="M12 21 C 9 20, 8.5 16.5, 10.5 14 C 11 15.5, 12.5 15.5, 12.8 13.5 C 15 15.5, 15.5 19.5, 12 21 Z"
        fill="#ffd36b"
      />
    </g>
  ),
  magic: (
    <g>
      <path
        d="M12 2 L13.9 9.5 L21 12 L13.9 14.5 L12 22 L10.1 14.5 L3 12 L10.1 9.5 Z"
        fill="#ffd36b"
        {...S}
        stroke-width={1.3}
      />
      <path
        d="M19 3 L19.7 5.3 L22 6 L19.7 6.7 L19 9 L18.3 6.7 L16 6 L18.3 5.3 Z"
        fill="#c9a0ff"
        stroke={INK}
        stroke-width="0.8"
      />
    </g>
  ),
  moon: (
    <g>
      <path
        d="M15.5 3 C 9 3.5, 5 8, 5 13 C 5 18, 9 21.5, 14 21.5 C 17 21.5, 19.5 20, 21 17.5 C 14.5 18.5, 10.5 13.5, 11.5 8.5 C 12 6, 13.5 4, 15.5 3 Z"
        fill="#fff1b0"
        {...S}
      />
      <circle cx="9.5" cy="15" r="1.1" fill="#e8d27a" />
    </g>
  ),
  bone: (
    <g transform="rotate(-35 12 12)">
      <path
        d="M5 9.5 a2.6 2.6 0 1 1 3 -2.6 L16 6.9 a2.6 2.6 0 1 1 3 2.6 a2.6 2.6 0 1 1 -3 2.6 L8 12.1 a2.6 2.6 0 1 1 -3 -2.6 Z"
        fill="#f6eedc"
        {...S}
        stroke-width={1.3}
        transform="translate(0 2.5)"
      />
    </g>
  ),
  sock: (
    <g>
      <path
        d="M8 2.5 h7 v10 l3.5 4 a3 3 0 0 1 -1 4.5 l-2 0.8 a3 3 0 0 1 -3.6 -1 L8 15.5 Z"
        fill="#6aa0d8"
        {...S}
      />
      <path d="M8 2.5 h7 v3 H8 Z" fill="#e0664f" {...S} stroke-width={1.2} />
      <circle cx="14.5" cy="18" r="1.3" fill="#2b1a10" />
    </g>
  ),
  crown: (
    <path d="M3.5 18 L2.5 7 L8 11.5 L12 4.5 L16 11.5 L21.5 7 L20.5 18 Z" fill="#f2c14e" {...S} />
  ),
};

export function IngredientIcon({ id, ...props }: IconProps & { id: IngredientId }) {
  return svg('0 0 24 24', INGREDIENTS[id], props);
}

export const INGREDIENT_NAMES: Record<IngredientId, string> = {
  grain: 'Grain',
  hops: 'Hops',
  honey: 'Honey',
  apple: 'Apple',
  berry: 'Berries',
  carrot: 'Carrot',
  potato: 'Potato',
  onion: 'Onion',
  mushroom: 'Mushroom',
  meat: 'Meat',
  fish: 'Fish',
  cheese: 'Cheese',
  egg: 'Egg',
  herb: 'Herbs',
  pepper: 'Pepper',
  milk: 'Milk',
  butter: 'Butter',
  salt: 'Sea salt',
  fire: 'Fire',
  magic: 'Magic',
  moon: 'Moonlight',
  bone: 'Bone',
  sock: 'Sock',
  crown: 'Royalty',
};

// ── Recipes (40 x 40) ─────────────────────────────────────────────────────
function Mug({ fill, foam = '#fff8e8' }: { fill: string; foam?: string }) {
  return (
    <g>
      <path d="M28 14 C 36 14, 36 28, 28 28" fill="none" stroke={INK} stroke-width="6" />
      <path d="M28 14 C 36 14, 36 28, 28 28" fill="none" stroke="#a8b1b6" stroke-width="3" />
      <path d="M8 11 L30 11 L28.5 34 a2 2 0 0 1 -2 2 H11.5 a2 2 0 0 1 -2 -2 Z" fill={fill} {...S} />
      <path
        d="M13 14 L13 32 M19 14 L19 32 M25 14 L25 32"
        stroke="rgba(0,0,0,0.18)"
        stroke-width="1.4"
      />
      <path
        d="M6 12 C 4 7, 10 4, 13 6 C 15 2, 23 2, 24 6 C 28 3, 34 6, 32 11 C 30 14, 27 13, 26 12 C 20 14, 14 14, 9 13.5 C 8 15, 6 14.5, 6 12 Z"
        fill={foam}
        {...S}
      />
    </g>
  );
}

function Bowl({ soup, children }: { soup: string; children?: JSX.Element }) {
  return (
    <g>
      <path d="M4 20 L36 20 C 35 30, 28 35, 20 35 C 12 35, 5 30, 4 20 Z" fill="#a0673a" {...S} />
      <ellipse cx="20" cy="20" rx="16" ry="4" fill={soup} {...S} />
      {children}
      <path d="M14 35 L26 35 L25 37.5 L15 37.5 Z" fill="#7a4b2a" {...S} stroke-width={1.2} />
      <path d="M8 26 q12 6 24 0" stroke="rgba(255,255,255,0.25)" stroke-width="1.6" fill="none" />
    </g>
  );
}

function Steam() {
  return (
    <g stroke="#fff4dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.85">
      <path d="M14 13 q-2 -3 0 -6 q2 -3 0 -6" />
      <path d="M22 13 q-2 -3 0 -6 q2 -3 0 -6" />
    </g>
  );
}

const RECIPES: Record<RecipeIconId, JSX.Element> = {
  ale: <Mug fill="#e8a53a" />,
  stout: <Mug fill="#4a2c18" foam="#f3e3bd" />,
  stew: (
    <g>
      <Steam />
      <Bowl soup="#b8563a">
        <g {...S} stroke-width={1}>
          <circle cx="14" cy="19.5" r="2.4" fill="#f08a2c" />
          <circle cx="22" cy="18.5" r="2.2" fill="#c9a062" />
          <circle cx="27" cy="20" r="2" fill="#7fb85a" />
        </g>
      </Bowl>
    </g>
  ),
  chowder: (
    <g>
      <Steam />
      <Bowl soup="#f3e7cf">
        <g>
          <path d="M22 19 L28 15 L27.5 19.5 L28.5 23 Z" fill="#6aa0d8" {...S} stroke-width={1.1} />
          <circle cx="14" cy="20" r="1.8" fill="#e8cfa8" stroke={INK} stroke-width="0.9" />
        </g>
      </Bowl>
    </g>
  ),
  chili: (
    <g>
      <Steam />
      <Bowl soup="#c0392b">
        <path
          d="M18 19 C 22 15, 30 15, 31 18 C 28 20, 22 21, 18 19 Z"
          fill="#3f7d3a"
          {...S}
          stroke-width={1.1}
        />
      </Bowl>
      <path
        d="M26 6 C 32 7, 31 14, 25 16"
        stroke="#d9362b"
        stroke-width="3.4"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  goulash: (
    <g>
      <Steam />
      <path d="M5 16 L35 16 L33 32 a4 4 0 0 1 -4 4 H11 a4 4 0 0 1 -4 -4 Z" fill="#3d3d44" {...S} />
      <ellipse cx="20" cy="16" rx="15" ry="3.6" fill="#7a3b2a" {...S} />
      <path d="M21 17 L21 9 h5 v5 l3 3" fill="#6aa0d8" {...S} stroke-width={1.3} />
      <path d="M3 18 h4 M33 18 h4" stroke={INK} stroke-width="2.4" stroke-linecap="round" />
    </g>
  ),
  bread: (
    <g>
      <path
        d="M4 26 C 3 14, 12 10, 20 10 C 28 10, 37 14, 36 26 C 36 30, 33 32, 30 32 H10 C 7 32, 4 30, 4 26 Z"
        fill="#d99a4e"
        {...S}
      />
      <path
        d="M12 16 l3 6 M19 14 l3 7 M26 15 l3 6"
        stroke="#9a5a22"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path d="M20 24 L31 20 L33 25 L22 29 Z" fill="#ffe28a" {...S} stroke-width={1.2} />
    </g>
  ),
  pie: (
    <g>
      <path d="M3 23 C 3 16, 37 16, 37 23 L35 31 C 34 33, 6 33, 5 31 Z" fill="#c9843e" {...S} />
      <ellipse cx="20" cy="22" rx="17" ry="6" fill="#e0a55e" {...S} />
      <path
        d="M8 22 L32 22 M12 18.5 L28 25.5 M28 18.5 L12 25.5"
        stroke="#a8652a"
        stroke-width="1.6"
      />
      <path d="M17 12 q3 -4 6 0" stroke="#8a5a36" stroke-width="1.4" fill="none" />
      <path d="M15 14 C 15 9, 25 9, 25 14 Z" fill="#c9a062" stroke={INK} stroke-width="1" />
    </g>
  ),
  feast: (
    <g>
      <path d="M3 25 C 3 18, 37 18, 37 25 L35 32 C 34 34.5, 6 34.5, 5 32 Z" fill="#c9843e" {...S} />
      <ellipse cx="20" cy="24" rx="17" ry="6" fill="#e0a55e" {...S} />
      <path
        d="M8 24 L32 24 M12 20.5 L28 27.5 M28 20.5 L12 27.5"
        stroke="#a8652a"
        stroke-width="1.6"
      />
      <path d="M11 17 L10 6 L15.5 10.5 L20 3 L24.5 10.5 L30 6 L29 17 Z" fill="#f2c14e" {...S} />
    </g>
  ),
  tart: (
    <g>
      <path d="M4 22 L36 22 L33 32 H7 Z" fill="#d99a4e" {...S} />
      <path d="M4 22 C 6 17, 34 17, 36 22 Z" fill="#6b3b8c" {...S} />
      <g fill="#9b6ad0" stroke={INK} stroke-width="0.9">
        <circle cx="12" cy="19" r="2.4" />
        <circle cx="19" cy="18" r="2.4" />
        <circle cx="26" cy="19" r="2.4" />
      </g>
      <path
        d="M26 5 C 21 5.5, 18.5 9, 19 12.5 C 19.5 15.5, 23 17.5, 26.5 16 C 23 14.5, 22 9, 26 5 Z"
        fill="#fff1b0"
        {...S}
        stroke-width={1.2}
      />
    </g>
  ),
  mead: (
    <g>
      <path d="M11 6 H29 C 29 18, 25 22, 20 22 C 15 22, 11 18, 11 6 Z" fill="#f2c14e" {...S} />
      <path d="M11.5 10 H28.5" stroke="#fff6c8" stroke-width="1.6" />
      <path d="M20 22 V32" stroke={INK} stroke-width="4" />
      <path d="M20 22 V32" stroke="#c9a227" stroke-width="2" />
      <path d="M12 34 C 14 31, 26 31, 28 34 Z" fill="#c9a227" {...S} />
      <path
        d="M28 8 q4 0 5 -4"
        stroke="#e8a53a"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  fizz: (
    <g>
      <path
        d="M16 4 H24 V13 L32 29 a4 4 0 0 1 -3.6 5.8 H11.6 A4 4 0 0 1 8 29 L16 13 Z"
        fill="#8ee0d0"
        {...S}
      />
      <path
        d="M11 24 H29 L32 29 a4 4 0 0 1 -3.6 5.8 H11.6 A4 4 0 0 1 8 29 Z"
        fill="#b06ad8"
        stroke={INK}
        stroke-width="1.2"
      />
      <rect
        x="14.5"
        y="2"
        width="11"
        height="4"
        rx="1.5"
        fill="#a0673a"
        {...S}
        stroke-width={1.2}
      />
      <g fill="#fff">
        <circle cx="17" cy="27" r="1.3" />
        <circle cx="22" cy="30" r="1" />
        <circle cx="20" cy="20" r="1.1" />
      </g>
    </g>
  ),
  tea: (
    <g>
      <Steam />
      <path d="M29 18 C 36 18, 36 27, 28 27" fill="none" stroke={INK} stroke-width="5" />
      <path d="M29 18 C 36 18, 36 27, 28 27" fill="none" stroke="#fbf6ea" stroke-width="2.4" />
      <path d="M6 16 H30 C 30 28, 25 32, 18 32 C 11 32, 6 28, 6 16 Z" fill="#fbf6ea" {...S} />
      <ellipse cx="18" cy="16" rx="12" ry="2.6" fill="#b8763a" {...S} stroke-width={1.2} />
      <path d="M3 33 C 8 36, 28 36, 33 33" stroke={INK} stroke-width="1.8" fill="#e8dcc6" />
      <path
        d="M12 23 C 14 21, 17 22, 16 25 C 13 26, 12 25, 12 23 Z"
        fill="#7fb85a"
        stroke={INK}
        stroke-width="0.9"
      />
    </g>
  ),
  grog: (
    <g>
      <path
        d="M15 3 h10 v8 C 31 13, 32 18, 32 23 V33 a3 3 0 0 1 -3 3 H11 a3 3 0 0 1 -3 -3 V23 C 8 18, 9 13, 15 11 Z"
        fill="#5a8a5a"
        {...S}
      />
      <rect
        x="14"
        y="1.5"
        width="12"
        height="4"
        rx="1.5"
        fill="#a0673a"
        {...S}
        stroke-width={1.2}
      />
      <path
        d="M20 17 V30 M16 20 H24 M15 26 C 16 30, 24 30, 25 26"
        stroke="#f2c14e"
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="20" cy="16" r="1.8" fill="none" stroke="#f2c14e" stroke-width="1.4" />
    </g>
  ),
  shake: (
    <g>
      <path
        d="M11 9 H29 L26.5 35 a2 2 0 0 1 -2 1.8 h-9 a2 2 0 0 1 -2 -1.8 Z"
        fill="#f3d9f0"
        {...S}
      />
      <path d="M11.8 16 H28.2" stroke="#d9a0d0" stroke-width="1.4" />
      <path
        d="M9 10 C 7 5, 14 3, 16 5.5 C 18 1.5, 25 2, 26 5.5 C 30 4, 33 8, 31 10 Z"
        fill="#fff8f0"
        {...S}
      />
      <g transform="rotate(20 26 8)">
        <path
          d="M23 -2 a2 2 0 1 1 2 -2 h2 a2 2 0 1 1 2 2 v12 a2 2 0 1 1 -2 2 h-2 a2 2 0 1 1 -2 -2 Z"
          fill="#f6eedc"
          {...S}
          stroke-width={1.1}
        />
      </g>
    </g>
  ),
  cheese: (
    <g>
      <rect x="3" y="28" width="34" height="6" rx="2.5" fill="#a0673a" {...S} />
      <path d="M5 28 L5 19 L27 10 L31 18 L31 28 Z" fill="#f2c94e" {...S} />
      <path d="M5 19 L31 18" stroke={INK} stroke-width="1.2" />
      <g fill="#d9a92e">
        <circle cx="12" cy="23" r="2" />
        <circle cx="21" cy="22" r="1.6" />
        <circle cx="27" cy="25" r="1.3" />
      </g>
      <path
        d="M31 12 q3 -3 1 -6 M35 14 q3 -3 1 -6"
        stroke="#7fb85a"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  ),
  kebab: (
    <g>
      <path d="M4 36 L36 4" stroke={INK} stroke-width="3.4" stroke-linecap="round" />
      <path d="M4 36 L36 4" stroke="#c9c1b0" stroke-width="1.6" stroke-linecap="round" />
      <g {...S} stroke-width={1.3}>
        <rect
          x="9"
          y="21"
          width="9"
          height="9"
          rx="2.5"
          fill="#b8563a"
          transform="rotate(-45 13.5 25.5)"
        />
        <rect
          x="15.5"
          y="14.5"
          width="9"
          height="9"
          rx="2.5"
          fill="#d9362b"
          transform="rotate(-45 20 19)"
        />
        <rect
          x="22"
          y="8"
          width="9"
          height="9"
          rx="2.5"
          fill="#b8563a"
          transform="rotate(-45 26.5 12.5)"
        />
      </g>
      <path
        d="M12 12 q2 -3 0 -6 M18 8 q2 -3 0 -5"
        stroke="#fff4dc"
        stroke-width="1.4"
        fill="none"
        stroke-linecap="round"
        opacity="0.8"
      />
    </g>
  ),
  roast: (
    <g>
      <ellipse cx="20" cy="31" rx="17" ry="5" fill="#d8c3a0" {...S} />
      <path
        d="M8 26 C 6 16, 16 10, 24 12 C 31 13.5, 34 20, 32 26 C 30 30, 12 31, 8 26 Z"
        fill="#b8563a"
        {...S}
      />
      <path
        d="M12 18 q6 -4 12 -2"
        stroke="#e0906a"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="31" cy="19" r="3.4" fill="#d9483b" {...S} stroke-width={1.2} />
      <path d="M31 15.6 q0 -2 1.5 -3" stroke="#6b4226" stroke-width="1.2" fill="none" />
    </g>
  ),
};

export function RecipeIcon({ id, ...props }: IconProps & { id: RecipeIconId }) {
  return svg('0 0 40 40', RECIPES[id], props);
}
