import type { JSX } from 'preact';
import type { FurnitureSlot } from '../../game/types';
import { INK, shade } from './color';

/**
 * Every furniture piece is drawn in tavern-scene coordinates (a 480 x 320 room), so the scene
 * simply stacks them. Shop thumbnails crop the scene to the piece's slot with SLOT_VIEW.
 */

export const SLOT_VIEW: Record<FurnitureSlot, [number, number, number, number]> = {
  hearth: [12, 78, 148, 148],
  wallLeft: [28, 10, 120, 84],
  window: [184, 12, 112, 124],
  lights: [116, 0, 84, 124],
  wallRight: [328, 12, 124, 100],
  floorRight: [312, 112, 166, 146],
  hearthside: [68, 188, 108, 74],
  counter: [348, 194, 96, 82],
};

const S = {
  stroke: INK,
  'stroke-width': 1.6,
  'stroke-linejoin': 'round' as const,
  'stroke-linecap': 'round' as const,
};
const WOOD_D = '#4a2c18';
const WOOD = '#7a4b2a';
const WOOD_L = '#a0673a';
const WOOD_H = '#c48a55';
const STONE = '#8b8378';
const STONE_D = '#6b645b';
const STONE_L = '#a8a095';
const METAL = '#9aa3a8';
const METAL_D = '#6d767b';
const BRASS = '#c9a227';
const GOLD = '#f2c14e';
const PARCH = '#f3e3bd';

// ── Shared bits ───────────────────────────────────────────────────────────
function Flame({
  x,
  y,
  size = 1,
  hue = 'warm',
}: {
  x: number;
  y: number;
  size?: number;
  hue?: 'warm' | 'magic';
}) {
  const outer = hue === 'magic' ? '#8b5cf6' : '#ff9a3c';
  const mid = hue === 'magic' ? '#e879f9' : '#ffc94a';
  const inner = hue === 'magic' ? '#fde68a' : '#fff1b0';
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <g class="flame">
        <path
          d="M0 0 C -16 -8, -12 -26, -3 -38 C -3 -26, 6 -26, 4 -44 C 18 -30, 20 -10, 0 0 Z"
          fill={outer}
          stroke={INK}
          stroke-width={1.2 / size}
        />
        <path
          d="M0 -2 C -9 -7, -7 -18, -1 -26 C 0 -18, 6 -18, 5 -28 C 12 -18, 11 -6, 0 -2 Z"
          fill={mid}
        />
        <path
          d="M0 -3 C -4 -6, -3 -12, 0 -16 C 1 -12, 4 -11, 3 -16 C 6 -10, 5 -5, 0 -3 Z"
          fill={inner}
        />
      </g>
    </g>
  );
}

function Glow({
  x,
  y,
  r,
  color = '#ffcf6b',
  strength = 0.55,
}: {
  x: number;
  y: number;
  r: number;
  color?: string;
  strength?: number;
}) {
  return (
    <circle
      class="glow-pulse"
      cx={x}
      cy={y}
      r={r}
      fill={color}
      opacity={strength}
      style={{ filter: 'blur(6px)' }}
    />
  );
}

function Logs({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} {...S}>
      <rect x="-22" y="-7" width="44" height="9" rx="4.5" fill={WOOD} transform="rotate(-8)" />
      <rect x="-22" y="-7" width="44" height="9" rx="4.5" fill={WOOD_L} transform="rotate(10)" />
      <circle cx="20" cy="-1" r="3" fill={WOOD_H} />
    </g>
  );
}

function Stones({
  x,
  y,
  w,
  h,
  seed = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
}) {
  const out: JSX.Element[] = [];
  let i = 0;
  for (let row = 0; row * 14 < h; row++) {
    const offset = row % 2 ? 11 : 0;
    for (let col = -1; col * 22 < w; col++) {
      const sx = x + col * 22 + offset;
      const sy = y + row * 14;
      if (sx + 20 < x || sx > x + w) continue;
      const tone = [STONE, STONE_L, shade(STONE, -0.08)][(i + seed) % 3];
      out.push(
        <rect
          x={Math.max(x, sx)}
          y={sy}
          width={Math.min(20, x + w - Math.max(x, sx))}
          height="12"
          rx="3"
          fill={tone}
          stroke={STONE_D}
          stroke-width="1"
        />,
      );
      i++;
    }
  }
  return <g>{out}</g>;
}

// ── Hearth ────────────────────────────────────────────────────────────────
function HearthSooty() {
  return (
    <g>
      <path d="M38 118 L132 118 L134 222 L36 222 Z" fill={STONE} {...S} />
      <Stones x={38} y={120} w={95} h={100} seed={2} />
      <path d="M56 222 L56 170 Q85 140 114 170 L114 222 Z" fill="#1c120c" {...S} />
      <g fill="#3a3a3a" opacity="0.5">
        <ellipse cx="85" cy="150" rx="18" ry="8" />
        <ellipse cx="70" cy="128" rx="10" ry="4" />
      </g>
      <rect x="30" y="110" width="110" height="10" rx="2" fill={WOOD} {...S} />
      <Logs x={85} y={214} />
      <Flame x={85} y={212} size={0.55} />
      <Glow x={85} y={200} r={20} strength={0.35} />
    </g>
  );
}

function HearthStone() {
  return (
    <g>
      <path d="M32 100 L138 100 L140 222 L30 222 Z" fill={STONE_L} {...S} />
      <Stones x={32} y={102} w={107} h={118} seed={1} />
      <path d="M52 222 L52 162 Q85 128 118 162 L118 222 Z" fill="#1c120c" {...S} />
      <path d="M52 162 Q85 128 118 162" fill="none" stroke={STONE_D} stroke-width="5" />
      <rect x="24" y="92" width="122" height="12" rx="3" fill={WOOD_L} {...S} />
      <g {...S}>
        <rect x="36" y="78" width="10" height="14" rx="2" fill="#c0504a" />
        <path d="M114 92 L114 80 Q122 74 130 80 L130 92 Z" fill={METAL} />
      </g>
      <Logs x={85} y={214} />
      <Flame x={80} y={212} size={0.8} />
      <Flame x={92} y={212} size={0.6} />
      <Glow x={85} y={190} r={30} strength={0.45} />
    </g>
  );
}

function HearthGrand() {
  return (
    <g>
      <path d="M20 90 L150 90 L154 224 L16 224 Z" fill={STONE_L} {...S} />
      <Stones x={20} y={92} w={132} h={130} seed={0} />
      <path d="M40 224 L40 150 Q85 108 130 150 L130 224 Z" fill="#1c120c" {...S} />
      <path
        d="M40 150 Q85 108 130 150"
        fill="none"
        stroke={shade(STONE_D, -0.1)}
        stroke-width="7"
      />
      <rect x="12" y="82" width="146" height="13" rx="3" fill={WOOD} {...S} />
      <g>
        <rect x="24" y="68" width="6" height="14" fill="#f3e3bd" {...S} stroke-width={1.2} />
        <rect x="140" y="68" width="6" height="14" fill="#f3e3bd" {...S} stroke-width={1.2} />
        <Flame x={27} y={68} size={0.22} />
        <Flame x={143} y={68} size={0.22} />
      </g>
      <path d="M85 132 L85 166" stroke={METAL_D} stroke-width="2" />
      <path d="M64 170 Q85 200 106 170 Z" fill="#2f2f33" {...S} />
      <ellipse cx="85" cy="170" rx="21" ry="5" fill="#3d3d44" {...S} />
      <g class="steam" fill="#ffffff" opacity="0.45">
        <circle cx="80" cy="160" r="3" />
        <circle cx="90" cy="156" r="2.5" />
      </g>
      <Logs x={85} y={216} />
      <Flame x={72} y={214} size={0.75} />
      <Flame x={96} y={214} size={0.7} />
      <Flame x={85} y={216} size={0.9} />
      <Glow x={85} y={188} r={42} strength={0.5} />
    </g>
  );
}

function HearthDragon() {
  return (
    <g>
      <path d="M20 90 L150 90 L154 224 L16 224 Z" fill="#9a8f84" {...S} />
      <Stones x={20} y={92} w={132} h={130} seed={2} />
      <path d="M40 224 L40 150 Q85 108 130 150 L130 224 Z" fill="#1a1022" {...S} />
      <rect x="12" y="82" width="146" height="13" rx="3" fill={WOOD_D} {...S} />
      <g transform="translate(85 104)" {...S}>
        <path
          d="M-16 6 C -18 -8, -8 -16, 0 -16 C 8 -16, 18 -8, 16 6 C 10 2, -10 2, -16 6 Z"
          fill="#c0504a"
        />
        <path d="M-12 -12 L-20 -24 L-6 -15 Z M12 -12 L20 -24 L6 -15 Z" fill="#f1e2bf" />
        <circle cx="-6" cy="-5" r="2.4" fill="#ffcc33" />
        <circle cx="6" cy="-5" r="2.4" fill="#ffcc33" />
      </g>
      <Logs x={85} y={216} />
      <Flame x={72} y={214} size={0.8} hue="magic" />
      <Flame x={98} y={214} size={0.75} />
      <Flame x={85} y={216} size={1} />
      <g class="sparkle" fill="#fde68a">
        <circle cx="70" cy="160" r="1.6" />
        <circle cx="100" cy="150" r="1.3" />
        <circle cx="86" cy="140" r="1.8" />
      </g>
      <Glow x={85} y={186} r={46} color="#ffb36b" strength={0.55} />
    </g>
  );
}

// ── Left wall ─────────────────────────────────────────────────────────────
function Nail({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="2" fill={METAL_D} stroke={INK} stroke-width="1" />;
}

function WallShield() {
  return (
    <g>
      <Nail x={88} y={20} />
      <circle cx="88" cy="52" r="28" fill={WOOD_L} {...S} />
      <circle cx="88" cy="52" r="28" fill="none" stroke={METAL_D} stroke-width="4" />
      <path
        d="M66 52 L88 34 L110 52 L110 60 L88 42 L66 60 Z"
        fill="#b8432f"
        stroke={INK}
        stroke-width="1.2"
      />
      <circle cx="88" cy="56" r="7" fill={METAL} {...S} />
      <path d="M100 40 l6 4 M72 70 l5 2" stroke={INK} stroke-width="1" opacity="0.5" />
    </g>
  );
}

function NoticeBoard() {
  return (
    <g>
      <rect x="42" y="20" width="92" height="64" rx="4" fill="#c89a62" {...S} />
      <rect
        x="47"
        y="25"
        width="82"
        height="54"
        rx="2"
        fill="#b98a55"
        stroke={shade('#b98a55', -0.3)}
        stroke-width="1"
      />
      <g {...S} stroke-width={1.1}>
        <rect x="52" y="30" width="26" height="30" fill={PARCH} transform="rotate(-6 65 45)" />
        <rect x="84" y="28" width="22" height="22" fill="#fff8e6" transform="rotate(5 95 39)" />
        <rect x="104" y="46" width="20" height="26" fill={PARCH} transform="rotate(-3 114 59)" />
        <rect x="70" y="56" width="26" height="18" fill="#f7d9a8" transform="rotate(4 83 65)" />
      </g>
      <g stroke={INK} stroke-width="0.9" opacity="0.6">
        <path d="M56 38 l16 -2 M57 44 l14 -1.5 M58 50 l12 -1.3" />
        <path d="M88 34 l14 1 M88 39 l12 1" />
        <path d="M107 53 l13 0 M107 58 l11 0 M107 63 l12 0" />
        <path d="M74 62 l18 1.2 M74 67 l14 1" />
      </g>
      <g fill="#c0392b" stroke={INK} stroke-width="0.8">
        <circle cx="64" cy="31" r="2.2" />
        <circle cx="95" cy="29" r="2.2" />
        <circle cx="114" cy="47" r="2.2" />
        <circle cx="82" cy="57" r="2.2" />
      </g>
    </g>
  );
}

function MountedAntlers() {
  const antler =
    'M84 44 C 76 34, 70 26, 70 14 C 74 20, 76 24, 78 26 C 77 20, 78 14, 82 8 C 82 16, 83 22, 86 28 C 88 22, 92 18, 96 16 C 92 24, 88 32, 88 42 Z';
  return (
    <g>
      <path d="M72 42 L104 42 L104 64 Q88 80 72 64 Z" fill={WOOD} {...S} />
      <g fill="#efe3c4" {...S}>
        <path d={antler} transform="translate(-8 4)" />
        <path d={antler} transform="translate(184 4) scale(-1 1)" />
      </g>
      <ellipse cx="88" cy="54" rx="10" ry="8" fill="#c9a37a" {...S} />
      <g fill={INK}>
        <circle cx="84.5" cy="52" r="1.3" />
        <circle cx="91.5" cy="52" r="1.3" />
      </g>
      <path d="M86 57 Q88 59 90 57" stroke={INK} stroke-width="1" fill="none" />
    </g>
  );
}

function LegendaryTankard() {
  return (
    <g>
      <path d="M58 24 L118 24 L118 82 L58 82 Z" fill={WOOD_D} {...S} />
      <rect
        x="62"
        y="28"
        width="52"
        height="50"
        rx="3"
        fill="#5a2a2a"
        stroke={GOLD}
        stroke-width="1.5"
      />
      <path d="M100 42 C 112 42, 112 62, 100 62" fill="none" stroke={METAL_D} stroke-width="6" />
      <path d="M100 42 C 112 42, 112 62, 100 62" fill="none" stroke="#dfe7ec" stroke-width="3" />
      <path d="M74 36 L102 36 L100 72 L76 72 Z" fill="#c8d2d8" {...S} />
      <rect x="72" y="33" width="32" height="6" rx="2" fill="#e8f4ff" {...S} stroke-width={1.2} />
      <path d="M80 44 L80 66 M88 44 L88 66 M96 44 L96 66" stroke="#9fb0ba" stroke-width="1.2" />
      <g class="sparkle" fill="#fff6c8">
        <path d="M70 30 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z" />
        <path d="M108 70 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 Z" />
      </g>
    </g>
  );
}

function ShipsWheel() {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <g transform="translate(88 50)">
      {spokes.map((a) => (
        <g>
          <line
            x1="0"
            y1="0"
            x2={Math.cos(a) * 36}
            y2={Math.sin(a) * 36}
            stroke={INK}
            stroke-width="6"
            stroke-linecap="round"
          />
          <line
            x1="0"
            y1="0"
            x2={Math.cos(a) * 36}
            y2={Math.sin(a) * 36}
            stroke={WOOD_L}
            stroke-width="3.4"
            stroke-linecap="round"
          />
        </g>
      ))}
      <circle r="25" fill="none" stroke={INK} stroke-width="8" />
      <circle r="25" fill="none" stroke={WOOD} stroke-width="5" />
      <circle r="7" fill={BRASS} {...S} />
    </g>
  );
}

// ── Window ────────────────────────────────────────────────────────────────
function WindowBase({
  children,
  dusty = true,
}: {
  children?: JSX.Element | JSX.Element[];
  dusty?: boolean;
}) {
  return (
    <g>
      <path d="M196 116 L196 58 Q240 6 284 58 L284 116 Z" fill={WOOD_D} {...S} />
      <path
        d="M203 110 L203 60 Q240 16 277 60 L277 110 Z"
        fill="url(#night-sky)"
        stroke={INK}
        stroke-width="1.2"
      />
      <g fill="#fffbe6">
        <circle cx="220" cy="54" r="1.1" />
        <circle cx="258" cy="44" r="1.3" />
        <circle cx="268" cy="72" r="0.9" />
        <circle cx="214" cy="84" r="0.9" />
        <circle cx="236" cy="32" r="0.8" />
      </g>
      <g>
        <circle cx="255" cy="58" r="9" fill="#fff4c9" />
        <circle cx="259" cy="55" r="8" fill="#26335e" />
      </g>
      {children}
      <path d="M240 26 L240 110 M203 76 L277 76" stroke={WOOD_D} stroke-width="4" />
      {dusty && (
        <g stroke="#ffffff" stroke-width="3" opacity="0.12" stroke-linecap="round">
          <path d="M210 100 q10 -6 20 -2" />
          <path d="M248 96 q10 -8 22 -4" />
        </g>
      )}
      <rect x="190" y="112" width="100" height="8" rx="2" fill={WOOD_L} {...S} />
    </g>
  );
}

function WindowFlowers() {
  return (
    <g>
      <WindowBase />
      <path d="M194 120 L286 120 L282 134 L198 134 Z" fill={WOOD} {...S} />
      <g {...S} stroke-width={1}>
        {[204, 218, 232, 248, 262, 276].map((x, i) => (
          <g>
            <path d={`M${x} 120 l${i % 2 ? 2 : -2} -10`} stroke="#3f7d3a" stroke-width="2" />
            <circle
              cx={x + (i % 2 ? 2 : -2)}
              cy={108}
              r="4.5"
              fill={['#e05a8a', '#f2c14e', '#b06ad8'][i % 3]}
            />
            <circle cx={x + (i % 2 ? 2 : -2)} cy={108} r="1.6" fill="#fff4c9" stroke="none" />
          </g>
        ))}
      </g>
    </g>
  );
}

function WindowStained() {
  const panes: Array<[string, string]> = [
    ['M203 110 L203 76 L240 76 L240 110 Z', '#8e2c3c'],
    ['M240 110 L240 76 L277 76 L277 110 Z', '#2c5f8e'],
    ['M203 76 L203 60 Q220 36 240 30 L240 76 Z', '#2f7a4a'],
    ['M240 76 L240 30 Q260 36 277 60 L277 76 Z', '#8e6a2c'],
  ];
  return (
    <g>
      <WindowBase dusty={false}>
        <g opacity="0.92">
          {panes.map(([d, c]) => (
            <path d={d} fill={c} />
          ))}
        </g>
        <g transform="translate(240 70)" {...S} stroke-width={1.2}>
          <path d="M-12 -14 L12 -14 L10 16 L-10 16 Z" fill={GOLD} />
          <path d="M11 -8 C 20 -8, 20 8, 11 8" fill="none" stroke={GOLD} stroke-width="4" />
          <path d="M-14 -16 C -14 -24, 14 -24, 14 -16 Z" fill="#fff8e8" />
        </g>
        <g stroke="#2a1a10" stroke-width="1.2" opacity="0.8" fill="none">
          <path d="M203 94 L277 94 M221 60 L221 110 M259 60 L259 110 M215 45 L265 45" />
        </g>
      </WindowBase>
    </g>
  );
}

// ── Lights ────────────────────────────────────────────────────────────────
const LIGHT_X = [158, 322];

function Candles() {
  return (
    <g>
      {LIGHT_X.map((x) => (
        <g>
          <Glow x={x} y={86} r={16} strength={0.45} />
          <path d={`M${x - 8} 104 L${x + 8} 104 L${x} 112 Z`} fill={METAL_D} {...S} />
          <path d={`M${x} 112 L${x} 118`} stroke={INK} stroke-width="2" />
          <rect
            x={x - 3.5}
            y={90}
            width="7"
            height="14"
            rx="1.5"
            fill="#f3e3bd"
            {...S}
            stroke-width={1.2}
          />
          <path d={`M${x - 3} 94 q-1 4 0 6`} stroke="#e6d2a4" stroke-width="1.4" fill="none" />
          <Flame x={x} y={90} size={0.2} />
        </g>
      ))}
    </g>
  );
}

function Lanterns() {
  return (
    <g>
      {LIGHT_X.map((x) => (
        <g>
          <path d={`M${x} 12 L${x} 40`} stroke={INK} stroke-width="1.4" stroke-dasharray="3 2" />
          <Glow x={x} y={60} r={24} strength={0.55} />
          <path d={`M${x - 10} 44 L${x + 10} 44 L${x + 6} 38 L${x - 6} 38 Z`} fill={BRASS} {...S} />
          <rect x={x - 9} y={44} width="18" height="24" rx="2" fill="#ffd978" {...S} />
          <path
            d={`M${x - 3} 44 L${x - 3} 68 M${x + 3} 44 L${x + 3} 68`}
            stroke={shade(BRASS, -0.3)}
            stroke-width="1.4"
          />
          <rect x={x - 11} y={67} width="22" height="5" rx="2" fill={BRASS} {...S} />
          <Flame x={x} y={62} size={0.22} />
        </g>
      ))}
    </g>
  );
}

function Chandelier() {
  return (
    <g>
      {LIGHT_X.map((x) => (
        <g>
          <path d={`M${x} 12 L${x} 36`} stroke={INK} stroke-width="1.4" stroke-dasharray="3 2" />
          <Glow x={x} y={44} r={30} strength={0.5} />
          <g fill="#efe3c4" {...S} stroke-width={1.2}>
            <path
              d={`M${x - 26} 48 C ${x - 34} 40, ${x - 32} 30, ${x - 26} 26 C ${x - 26} 34, ${x - 20} 40, ${x - 12} 44 Z`}
            />
            <path
              d={`M${x + 26} 48 C ${x + 34} 40, ${x + 32} 30, ${x + 26} 26 C ${x + 26} 34, ${x + 20} 40, ${x + 12} 44 Z`}
            />
          </g>
          <ellipse cx={x} cy={48} rx="26" ry="6" fill={WOOD} {...S} />
          {[-16, 0, 16].map((dx) => (
            <g>
              <rect
                x={x + dx - 2.5}
                y={36}
                width="5"
                height="10"
                fill="#f3e3bd"
                {...S}
                stroke-width={1}
              />
              <Flame x={x + dx} y={36} size={0.16} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

function Fireflies() {
  return (
    <g>
      {LIGHT_X.map((x, j) => (
        <g>
          <path d={`M${x} 12 L${x} 40`} stroke={INK} stroke-width="1.2" />
          <Glow x={x} y={58} r={26} color="#d6ff7a" strength={0.45} />
          <rect x={x - 8} y={36} width="16" height="6" rx="2" fill={WOOD_L} {...S} />
          <path
            d={`M${x - 10} 42 L${x + 10} 42 L${x + 11} 72 Q${x} 78 ${x - 11} 72 Z`}
            fill="rgba(200,240,255,0.25)"
            {...S}
          />
          <g class="fireflies" fill="#eaff8a">
            <circle cx={x - 4} cy={54 + j * 2} r="1.8" />
            <circle cx={x + 4} cy={62 - j * 2} r="1.6" />
            <circle cx={x} cy={68} r="1.4" />
            <circle cx={x + 2} cy={48} r="1.2" />
          </g>
        </g>
      ))}
    </g>
  );
}

function StarLanterns() {
  const star = (x: number, y: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.5;
      pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <g>
      {LIGHT_X.map((x) => (
        <g>
          <path d={`M${x} 12 L${x} 38`} stroke={INK} stroke-width="1.2" />
          <Glow x={x} y={54} r={28} color="#ffe9a8" strength={0.6} />
          <polygon
            class="twinkle"
            points={star(x, 54, 16)}
            fill="#ffe28a"
            stroke={INK}
            stroke-width="1.4"
            stroke-linejoin="round"
          />
          <polygon points={star(x, 54, 7)} fill="#fff8d6" />
        </g>
      ))}
    </g>
  );
}

// ── Right wall ────────────────────────────────────────────────────────────
function PaintingGoose() {
  return (
    <g>
      <Nail x={392} y={18} />
      <path d="M392 20 L366 30 M392 20 L418 30" stroke={INK} stroke-width="1" />
      <rect x="352" y="28" width="80" height="68" rx="3" fill={GOLD} {...S} />
      <rect x="359" y="35" width="66" height="54" fill="#8fc0d8" stroke={INK} stroke-width="1.2" />
      <path d="M359 76 Q392 66 425 78 L425 89 L359 89 Z" fill="#6f9f4f" />
      <g {...S} stroke-width={1.3}>
        <path
          d="M380 80 C 372 76, 374 64, 384 64 C 388 56, 390 50, 396 48 C 402 48, 402 54, 398 58 C 398 64, 410 64, 410 74 C 410 82, 392 84, 380 80 Z"
          fill="#fbfaf5"
        />
        <path d="M402 50 L410 52 L402 55 Z" fill="#f29a3c" />
        <path d="M392 48 C 392 42, 402 42, 402 48 Z" fill={METAL} />
        <path d="M404 64 L416 50" stroke={METAL_D} stroke-width="2" />
      </g>
      <circle cx="398" cy="51" r="1" fill={INK} />
    </g>
  );
}

function Tapestry() {
  return (
    <g>
      <rect x="346" y="20" width="92" height="6" rx="3" fill={WOOD_D} {...S} />
      <path
        d="M352 26 L432 26 L432 96 L422 90 L412 96 L402 90 L392 96 L382 90 L372 96 L362 90 L352 96 Z"
        fill="#8e2c3c"
        {...S}
      />
      <path
        d="M358 30 L426 30 L426 86 L358 86 Z"
        fill="none"
        stroke={GOLD}
        stroke-width="1.6"
        stroke-dasharray="4 2"
      />
      <text
        x="374"
        y="70"
        font-family="Georgia, serif"
        font-size="26"
        font-weight="700"
        fill={GOLD}
        stroke={INK}
        stroke-width="0.8"
      >
        A
      </text>
      <text
        x="396"
        y="70"
        font-family="Georgia, serif"
        font-size="26"
        font-weight="700"
        fill="#9fd0ff"
        stroke={INK}
        stroke-width="0.8"
      >
        Z
      </text>
      <path d="M384 40 L400 54 M400 40 L384 54" stroke={METAL} stroke-width="2" />
    </g>
  );
}

function ShipBottle() {
  return (
    <g>
      <rect x="346" y="90" width="96" height="7" rx="2" fill={WOOD} {...S} />
      <path d="M356 97 L360 106 M432 97 L428 106" stroke={WOOD_D} stroke-width="3" />
      <g {...S}>
        <path
          d="M358 88 C 358 66, 364 60, 396 60 L414 60 C 420 60, 420 66, 424 68 L432 68 L432 80 L424 80 C 420 82, 420 88, 414 88 Z"
          fill="rgba(150,210,190,0.35)"
        />
        <rect x="432" y="67" width="8" height="14" rx="2" fill={WOOD_H} />
      </g>
      <g {...S} stroke-width={1.1}>
        <path d="M368 80 L404 80 L398 86 L374 86 Z" fill={WOOD} />
        <path d="M386 80 L386 62" stroke={INK} />
        <path d="M386 64 L398 76 L386 76 Z" fill="#fbfaf5" />
        <path d="M384 66 L374 76 L384 76 Z" fill="#fbfaf5" />
        <path d="M386 62 L392 64 L386 66 Z" fill="#c0392b" />
      </g>
      <path d="M364 70 q8 -6 20 -6" stroke="#ffffff" stroke-width="2" opacity="0.5" fill="none" />
    </g>
  );
}

function HolyGrill() {
  return (
    <g>
      <g class="glow-pulse" opacity="0.8">
        <circle
          cx="392"
          cy="58"
          r="40"
          fill="#fff1b0"
          opacity="0.35"
          style={{ filter: 'blur(5px)' }}
        />
      </g>
      <g stroke="#ffe28a" stroke-width="2" opacity="0.8">
        {Array.from({ length: 10 }, (_, i) => (i * Math.PI) / 5).map((a) => (
          <line
            x1={392 + Math.cos(a) * 30}
            y1={58 + Math.sin(a) * 30}
            x2={392 + Math.cos(a) * 42}
            y2={58 + Math.sin(a) * 42}
          />
        ))}
      </g>
      <ellipse cx="392" cy="24" rx="16" ry="4" fill="none" stroke={GOLD} stroke-width="3" />
      <rect x="366" y="38" width="52" height="36" rx="4" fill="#2f2f33" {...S} />
      <g stroke="#6d767b" stroke-width="2">
        {[46, 54, 62, 70].map((y) => (
          <line x1="370" y1={y} x2="414" y2={y} />
        ))}
      </g>
      <path d="M372 74 L368 90 M412 74 L416 90" stroke={INK} stroke-width="3" />
      <path d="M418 50 L432 44" stroke={WOOD_L} stroke-width="4" stroke-linecap="round" />
    </g>
  );
}

function GoldenLute() {
  return (
    <g transform="rotate(-28 392 60)">
      <Nail x={392} y={20} />
      <path d="M392 24 L392 44" stroke={INK} stroke-width="1" />
      <rect x="388" y="16" width="8" height="12" rx="2" fill={WOOD_D} {...S} />
      <rect x="389.5" y="26" width="5" height="34" fill={WOOD} {...S} stroke-width={1.2} />
      <path
        d="M392 56 C 374 58, 370 78, 374 90 C 380 104, 404 104, 410 90 C 414 78, 410 58, 392 56 Z"
        fill={GOLD}
        {...S}
      />
      <circle cx="392" cy="78" r="6" fill={shade(GOLD, -0.5)} stroke={INK} stroke-width="1" />
      <path d="M390 28 L390 96 M394 28 L394 96" stroke="#fff8e8" stroke-width="0.6" />
      <g fill="#3a2a22" opacity="0.55">
        <ellipse cx="402" cy="92" rx="5" ry="3" />
        <ellipse cx="380" cy="70" rx="3" ry="4" />
      </g>
    </g>
  );
}

// ── Seating ───────────────────────────────────────────────────────────────
function Stool({ x, y }: { x: number; y: number }) {
  return (
    <g {...S}>
      <path
        d={`M${x - 8} ${y} L${x - 11} ${y + 22} M${x + 8} ${y} L${x + 11} ${y + 22}`}
        stroke={WOOD_D}
        stroke-width="3"
      />
      <ellipse cx={x} cy={y} rx="13" ry="4.5" fill={WOOD_L} />
    </g>
  );
}

function Mug({ x, y }: { x: number; y: number }) {
  return (
    <g {...S} stroke-width={1.1}>
      <path d={`M${x + 5} ${y - 7} q5 0 5 4 q0 4 -5 4`} fill="none" />
      <rect x={x - 5} y={y - 10} width="10" height="11" rx="1.5" fill={WOOD_L} />
      <path d={`M${x - 6} ${y - 10} q2 -4 6 -2 q4 -3 6 2 Z`} fill="#fff8e8" />
    </g>
  );
}

function TableWobbly() {
  return (
    <g>
      <Stool x={352} y={222} />
      <g {...S}>
        <path d="M398 206 L392 244 M402 206 L410 244" stroke={WOOD_D} stroke-width="4" />
        <ellipse cx="400" cy="204" rx="34" ry="8" fill={WOOD_L} transform="rotate(-4 400 204)" />
      </g>
      <Mug x={392} y={200} />
      <path d="M412 196 q4 -8 0 -12" stroke="#fff" stroke-width="1.4" opacity="0.4" fill="none" />
    </g>
  );
}

function TableOak() {
  return (
    <g>
      <g {...S}>
        <rect x="336" y="222" width="130" height="7" rx="3" fill={WOOD} />
        <path d="M344 229 L342 248 M458 229 L460 248" stroke={WOOD_D} stroke-width="4" />
        <path d="M352 200 L350 240 M450 200 L452 240" stroke={WOOD_D} stroke-width="5" />
        <rect x="330" y="192" width="142" height="11" rx="3" fill={WOOD_L} />
      </g>
      <Mug x={360} y={190} />
      <Mug x={440} y={190} />
      <g>
        <rect x="398" y="176" width="6" height="14" fill="#f3e3bd" {...S} stroke-width={1} />
        <Flame x={401} y={176} size={0.18} />
        <Glow x={401} y={172} r={12} strength={0.4} />
      </g>
    </g>
  );
}

function Armchair() {
  const velvet = '#8e2c3c';
  return (
    <g>
      <g {...S}>
        <path d="M356 246 L352 238 M436 246 L440 238" stroke={WOOD_D} stroke-width="4" />
        <path d="M358 166 C 358 146, 434 146, 434 166 L 436 214 L 356 214 Z" fill={velvet} />
        <path
          d="M344 196 C 336 176, 362 170, 364 190 L 366 240 L 348 240 Z"
          fill={shade(velvet, 0.1)}
        />
        <path
          d="M448 196 C 456 176, 430 170, 428 190 L 426 240 L 444 240 Z"
          fill={shade(velvet, 0.1)}
        />
        <path
          d="M362 212 C 362 202, 430 202, 430 212 L 430 238 L 362 238 Z"
          fill={shade(velvet, 0.18)}
        />
      </g>
      <g fill={GOLD}>
        <circle cx="380" cy="170" r="1.6" />
        <circle cx="396" cy="166" r="1.6" />
        <circle cx="412" cy="170" r="1.6" />
      </g>
      <g {...S} stroke-width={1.1}>
        <rect x="454" y="216" width="18" height="30" fill={WOOD} />
        <rect x="452" y="210" width="22" height="6" rx="1.5" fill={WOOD_L} />
        <rect x="456" y="203" width="16" height="7" rx="1" fill="#3f6fb0" />
      </g>
    </g>
  );
}

function BardStage() {
  return (
    <g>
      <g {...S}>
        <path d="M336 132 L468 132 L468 222 L336 222 Z" fill="#6b1f2c" />
        <path d="M336 132 C 350 170, 346 200, 352 222 L336 222 Z" fill="#8e2c3c" />
        <path d="M468 132 C 454 170, 458 200, 452 222 L468 222 Z" fill="#8e2c3c" />
        <path d="M336 132 L468 132 L468 142 C 446 150, 358 150, 336 142 Z" fill="#a8384a" />
        <path d="M326 222 L478 222 L474 246 L330 246 Z" fill={WOOD} />
        <path d="M326 222 L478 222" stroke={WOOD_H} stroke-width="2" />
      </g>
      <path d="M340 230 L474 230 M338 238 L476 238" stroke={WOOD_D} stroke-width="1" />
      <g {...S} stroke-width={1.2}>
        <path d="M404 220 L398 196 M404 220 L410 196" stroke={WOOD_D} stroke-width="2" />
        <path
          d="M404 170 C 392 172, 390 188, 394 196 C 398 204, 412 204, 414 196 C 418 188, 416 172, 404 170 Z"
          fill={WOOD_H}
        />
        <rect x="402" y="150" width="4" height="22" fill={WOOD} />
        <circle cx="404" cy="186" r="3.4" fill={WOOD_D} />
      </g>
      <g {...S} stroke-width={1.1}>
        <path d="M436 212 L452 212 L450 222 L438 222 Z" fill={METAL} />
        <circle cx="441" cy="211" r="2" fill={GOLD} />
        <circle cx="446" cy="210" r="2" fill={GOLD} />
      </g>
    </g>
  );
}

function ReadingNook() {
  const books = ['#8e2c3c', '#2c5f8e', '#2f7a4a', '#8e6a2c', '#6b3b8c', '#b8432f', '#3f6fb0'];
  return (
    <g>
      <g {...S}>
        <rect x="408" y="118" width="62" height="126" fill={WOOD} />
        <rect x="412" y="122" width="54" height="118" fill={WOOD_D} />
      </g>
      {[146, 176, 206, 236].map((y, row) => (
        <g>
          <rect x="410" y={y} width="58" height="4" fill={WOOD_L} stroke={INK} stroke-width="1" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              x={414 + i * 8.6}
              y={y - 22 + ((i + row) % 3) * 2}
              width="7"
              height={22 - ((i + row) % 3) * 2}
              fill={books[(i + row * 2) % books.length]}
              stroke={INK}
              stroke-width="0.8"
            />
          ))}
        </g>
      ))}
      <g {...S}>
        <path d="M340 196 C 336 172, 392 170, 394 196 L 396 240 L 338 240 Z" fill="#2f7a4a" />
        <path
          d="M344 214 C 344 206, 390 206, 390 214 L 390 238 L 344 238 Z"
          fill={shade('#2f7a4a', 0.2)}
        />
        <path d="M342 244 L340 250 M392 244 L394 250" stroke={WOOD_D} stroke-width="3" />
      </g>
      <path
        d="M360 210 L376 206 L378 214 L362 218 Z"
        fill="#f3e3bd"
        stroke={INK}
        stroke-width="1"
      />
    </g>
  );
}

// ── Fireside ──────────────────────────────────────────────────────────────
/** Fireside pieces sit just right of Barley's spot on the counter. */
function Fireside({ children }: { children: JSX.Element }) {
  return <g transform="translate(16 0)">{children}</g>;
}

function CatBasket() {
  return (
    <g>
      <ellipse cx="104" cy="246" rx="38" ry="10" fill="rgba(0,0,0,0.25)" />
      <path d="M68 232 Q104 262 140 232 L136 246 Q104 262 72 246 Z" fill="#c89a62" {...S} />
      <g class="cat-breathe">
        <path
          d="M78 234 C 78 216, 96 212, 110 214 C 126 216, 132 226, 128 236 Z"
          fill="#e8923c"
          {...S}
        />
        <path
          d="M116 222 C 124 218, 132 222, 132 230"
          stroke="#b86a24"
          stroke-width="2.4"
          fill="none"
        />
        <path
          d="M84 222 L82 212 L90 218 Z M96 218 L98 208 L102 217 Z"
          fill="#e8923c"
          {...S}
          stroke-width={1.2}
        />
        <path d="M84 226 q3 2 6 0 M94 225 q3 2 6 0" stroke={INK} stroke-width="1.2" fill="none" />
        <path
          d="M70 236 C 64 228, 70 220, 78 226"
          stroke="#e8923c"
          stroke-width="5"
          fill="none"
          stroke-linecap="round"
        />
      </g>
      <path d="M70 238 Q104 256 138 238" stroke="#a0763e" stroke-width="1.4" fill="none" />
      <path d="M74 242 Q104 258 134 242" stroke="#a0763e" stroke-width="1.4" fill="none" />
      <text class="zzz" x="118" y="206" font-size="10" font-family="var(--font-ui)" fill="#fff4dc">
        z
      </text>
    </g>
  );
}

function PottedFern() {
  const frond = (angle: number, len: number) => (
    <path
      d={`M0 0 C ${len * 0.2} ${-len * 0.4}, ${len * 0.5} ${-len * 0.8}, ${len * 0.9} ${-len}`}
      transform={`rotate(${angle})`}
      stroke="#3f7d3a"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
    />
  );
  return (
    <g>
      <g transform="translate(104 222)" class="sway">
        {[-70, -40, -12, 16, 44].map((a, i) => frond(a - 50, 30 + (i % 2) * 6))}
        {[-60, -25, 10].map((a) => (
          <path
            d={`M0 0 C 6 -12, 14 -22, 20 -30`}
            transform={`rotate(${a})`}
            stroke="#6fae4f"
            stroke-width="2.4"
            fill="none"
            stroke-linecap="round"
          />
        ))}
      </g>
      <path d="M88 220 L120 220 L116 250 L92 250 Z" fill="#c0643a" {...S} />
      <rect x="85" y="216" width="38" height="7" rx="2" fill="#d97a4a" {...S} />
    </g>
  );
}

function HatchlingNest() {
  return (
    <g>
      <ellipse cx="104" cy="248" rx="36" ry="8" fill="rgba(0,0,0,0.25)" />
      <g class="cat-breathe">
        <path
          d="M90 234 C 88 214, 100 204, 108 206 C 118 206, 124 218, 120 234 Z"
          fill="#d9542b"
          {...S}
        />
        <path
          d="M96 210 L92 200 L100 207 Z M112 208 L116 199 L110 207 Z"
          fill="#f1e2bf"
          {...S}
          stroke-width={1.1}
        />
        <ellipse cx="106" cy="222" rx="8" ry="6" fill="#e8784a" stroke={INK} stroke-width="1" />
        <g fill={INK}>
          <circle cx="100" cy="214" r="2" />
          <circle cx="112" cy="214" r="2" />
        </g>
        <g fill="#fff">
          <circle cx="100.6" cy="213.3" r="0.7" />
          <circle cx="112.6" cy="213.3" r="0.7" />
        </g>
        <path d="M103 225 q3 2 6 0" stroke={INK} stroke-width="1.1" fill="none" />
      </g>
      <path d="M70 234 Q104 256 138 234 L134 246 Q104 260 74 246 Z" fill="#c9a060" {...S} />
      <g stroke="#8a6a38" stroke-width="1.3" fill="none">
        <path d="M76 238 l10 6 M90 242 l8 -4 M110 244 l10 -6 M124 240 l8 2" />
      </g>
      <path d="M126 232 L132 224 L136 232 Z" fill="#fbf6ea" {...S} stroke-width={1} />
    </g>
  );
}

function OakleySapling() {
  return (
    <g>
      <g class="sway">
        <path
          d="M104 222 C 102 206, 106 196, 104 186"
          stroke="#7b5a3a"
          stroke-width="5"
          fill="none"
          stroke-linecap="round"
        />
        <circle cx="104" cy="178" r="20" fill="#5f8f3e" {...S} />
        <circle cx="92" cy="186" r="12" fill="#6fa64a" {...S} />
        <circle cx="116" cy="186" r="12" fill="#6fa64a" {...S} />
        <g fill={INK}>
          <circle cx="100" cy="206" r="1.4" />
          <circle cx="108" cy="206" r="1.4" />
        </g>
        <path d="M101 210 q3 2.4 6 0" stroke={INK} stroke-width="1.1" fill="none" />
      </g>
      <path d="M88 220 L120 220 L116 250 L92 250 Z" fill="#c0643a" {...S} />
      <rect x="85" y="216" width="38" height="7" rx="2" fill="#d97a4a" {...S} />
    </g>
  );
}

// ── Bar counter ───────────────────────────────────────────────────────────
function TipJar() {
  return (
    <g>
      <path
        d="M380 228 L408 228 L410 264 Q394 270 378 264 Z"
        fill="rgba(200,235,255,0.35)"
        {...S}
      />
      <g fill={GOLD} stroke={INK} stroke-width="0.8">
        <ellipse cx="388" cy="258" rx="5" ry="2" />
        <ellipse cx="398" cy="260" rx="5" ry="2" />
        <ellipse cx="394" cy="254" rx="5" ry="2" />
      </g>
      <rect x="378" y="224" width="32" height="6" rx="2" fill={WOOD_L} {...S} stroke-width={1.2} />
      <rect
        x="384"
        y="236"
        width="20"
        height="10"
        rx="1.5"
        fill={PARCH}
        stroke={INK}
        stroke-width="0.9"
      />
      <text
        x="394"
        y="244"
        text-anchor="middle"
        font-size="6.5"
        font-family="var(--font-ui)"
        font-weight="700"
        fill={INK}
      >
        TIPS
      </text>
    </g>
  );
}

function CrystalBall() {
  return (
    <g>
      <path d="M380 266 L386 250 L402 250 L408 266 Z" fill={BRASS} {...S} />
      <circle cx="394" cy="234" r="18" fill="url(#crystal)" {...S} />
      <g class="swirl" opacity="0.7">
        <path
          d="M384 236 C 386 226, 400 224, 402 232 C 404 240, 392 242, 390 236"
          stroke="#f0d9ff"
          stroke-width="1.6"
          fill="none"
        />
      </g>
      <ellipse
        cx="388"
        cy="226"
        rx="5"
        ry="3"
        fill="#fff"
        opacity="0.6"
        transform="rotate(-30 388 226)"
      />
      <Glow x={394} y={234} r={20} color="#c9a0ff" strength={0.35} />
    </g>
  );
}

function BrassRegister() {
  return (
    <g>
      <path d="M368 266 L372 236 L416 236 L420 266 Z" fill={BRASS} {...S} />
      <path d="M376 236 L380 214 L408 214 L412 236 Z" fill={shade(BRASS, 0.15)} {...S} />
      <rect
        x="384"
        y="218"
        width="20"
        height="9"
        rx="1.5"
        fill="#fff8e8"
        stroke={INK}
        stroke-width="1"
      />
      <text
        x="394"
        y="225.5"
        text-anchor="middle"
        font-size="7"
        font-family="var(--font-ui)"
        font-weight="700"
        fill={INK}
      >
        42
      </text>
      <g fill="#fff8e8" stroke={INK} stroke-width="0.8">
        {[0, 1, 2, 3].map((i) => (
          <circle cx={380 + i * 9} cy="246" r="2.6" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle cx={381 + i * 9} cy="255" r="2.6" />
        ))}
      </g>
      <path d="M420 244 L428 236" stroke={INK} stroke-width="2.4" stroke-linecap="round" />
      <circle cx="429" cy="235" r="3" fill="#c0392b" stroke={INK} stroke-width="1" />
    </g>
  );
}

function EnchantedQuill() {
  return (
    <g>
      <path
        d="M384 266 C 380 254, 386 248, 394 248 C 402 248, 408 254, 404 266 Z"
        fill="#2c2c44"
        {...S}
      />
      <rect x="388" y="244" width="12" height="6" rx="1.5" fill={BRASS} {...S} stroke-width={1.1} />
      <g class="float">
        <path
          d="M396 238 C 404 222, 418 206, 432 200 C 428 214, 414 228, 398 240 Z"
          fill="#fbfaf5"
          {...S}
        />
        <path d="M398 240 L420 212" stroke="#c9c1b0" stroke-width="1" />
        <path d="M396 238 L393 246" stroke={INK} stroke-width="1.6" />
      </g>
      <g class="sparkle" fill="#fde68a">
        <circle cx="416" cy="226" r="1.4" />
        <circle cx="386" cy="232" r="1.1" />
        <circle cx="428" cy="214" r="1.2" />
      </g>
    </g>
  );
}

function Grimoire() {
  return (
    <g>
      <path d="M384 266 L394 246 L404 266 Z" fill={WOOD} {...S} />
      <g transform="rotate(-6 394 236)">
        <path d="M366 246 L394 250 L422 246 L422 222 L394 226 L366 222 Z" fill="#4b2e7a" {...S} />
        <path
          d="M369 243 L394 247 L394 227 L369 224 Z"
          fill="#fff8e8"
          stroke={INK}
          stroke-width="1"
        />
        <path
          d="M419 243 L394 247 L394 227 L419 224 Z"
          fill="#fff8e8"
          stroke={INK}
          stroke-width="1"
        />
        <g stroke={INK} stroke-width="0.7" opacity="0.6">
          <path d="M373 230 l17 2 M373 235 l12 1.5 M373 240 l16 2" />
          <path d="M398 232 l17 -2 M398 237 l12 -1.5" />
        </g>
        <path d="M376 229 L388 231" stroke="#c0392b" stroke-width="1.2" />
      </g>
      <Glow x={394} y={232} r={16} color="#c9a0ff" strength={0.35} />
      <g class="sparkle" fill="#fde68a">
        <circle cx="380" cy="214" r="1.4" />
        <circle cx="410" cy="210" r="1.2" />
      </g>
    </g>
  );
}

function RoyalSeal() {
  return (
    <g>
      <path d="M380 266 L392 238 M408 266 L396 238" stroke={WOOD_D} stroke-width="3" />
      <rect x="370" y="206" width="48" height="40" rx="2" fill={GOLD} {...S} />
      <rect x="374" y="210" width="40" height="32" fill={PARCH} stroke={INK} stroke-width="1" />
      <g stroke={INK} stroke-width="0.7" opacity="0.6">
        <path d="M380 216 l28 0 M382 221 l24 0 M384 226 l20 0" />
      </g>
      <path
        d="M398 232 L394 250 L399 246 L403 251 L402 233 Z"
        fill="#2c5f8e"
        stroke={INK}
        stroke-width="0.9"
      />
      <circle cx="400" cy="233" r="6" fill="#b8432f" stroke={INK} stroke-width="1.1" />
      <path d="M397 233 l3 -3 l3 3 l-3 3 Z" fill="#e07a6a" />
    </g>
  );
}

export const FURNITURE_ART: Record<string, () => JSX.Element> = {
  'hearth-sooty': HearthSooty,
  'hearth-stone': HearthStone,
  'hearth-grand': HearthGrand,
  'hearth-dragon': HearthDragon,
  'wall-shield': WallShield,
  'notice-board': NoticeBoard,
  'mounted-antlers': MountedAntlers,
  'legendary-tankard': LegendaryTankard,
  'ships-wheel': ShipsWheel,
  'window-dusty': () => <WindowBase />,
  'window-flowers': WindowFlowers,
  'window-stained': WindowStained,
  'lights-candles': Candles,
  'lights-lanterns': Lanterns,
  'lights-chandelier': Chandelier,
  'lights-fireflies': Fireflies,
  'lights-stars': StarLanterns,
  'painting-goose': PaintingGoose,
  tapestry: Tapestry,
  'ship-bottle': ShipBottle,
  'holy-grill': HolyGrill,
  'golden-lute': GoldenLute,
  'table-wobbly': TableWobbly,
  'table-oak': TableOak,
  armchair: Armchair,
  'bard-stage': BardStage,
  'reading-nook': ReadingNook,
  'cat-basket': () => (
    <Fireside>
      <CatBasket />
    </Fireside>
  ),
  'potted-fern': () => (
    <Fireside>
      <PottedFern />
    </Fireside>
  ),
  'hatchling-nest': () => (
    <Fireside>
      <HatchlingNest />
    </Fireside>
  ),
  'oakley-sapling': () => (
    <Fireside>
      <OakleySapling />
    </Fireside>
  ),
  'tip-jar': TipJar,
  'crystal-ball': CrystalBall,
  'brass-register': BrassRegister,
  'enchanted-quill': EnchantedQuill,
  'fizzlewick-grimoire': Grimoire,
  'royal-seal': RoyalSeal,
};

/** Gradients and filters the furniture art refers to. Rendered once per SVG. */
export function SceneDefs() {
  return (
    <defs>
      <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a2446" />
        <stop offset="1" stop-color="#3b4f84" />
      </linearGradient>
      <radialGradient id="crystal" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#f4e8ff" />
        <stop offset="0.5" stop-color="#9f7ae0" />
        <stop offset="1" stop-color="#4b2e7a" />
      </radialGradient>
      <radialGradient id="room-light" cx="0.25" cy="0.62" r="0.7">
        <stop offset="0" stop-color="#ffb35c" stop-opacity="0.34" />
        <stop offset="0.55" stop-color="#ff9a3c" stop-opacity="0.08" />
        <stop offset="1" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.6" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity="0.45" />
      </radialGradient>
    </defs>
  );
}
