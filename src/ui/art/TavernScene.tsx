import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { FurnitureId, FurnitureSlot, Mood, PortraitSpec } from '../../game/types';
import { BarleyGraphic } from './Barley';
import { INK } from './color';
import { FURNITURE_ART } from './FurnitureArt';
import { PortraitGraphic } from './Portrait';
import './scene.css';

/** Back-to-front drawing order for the room. The counter piece is drawn with the foreground. */
const BACK_SLOTS: FurnitureSlot[] = [
  'window',
  'wallLeft',
  'wallRight',
  'lights',
  'hearth',
  'floorRight',
  'hearthside',
];

export interface SceneCustomer {
  key: string;
  spec: PortraitSpec;
  mood: Mood;
  talking: boolean;
  motion: 'enter' | 'idle' | 'leave';
}

interface TavernSceneProps {
  placed: Partial<Record<FurnitureSlot, FurnitureId>>;
  customer?: SceneCustomer | null;
  barleyMood?: Mood;
  barleyTalking?: boolean;
  class?: string;
  children?: ComponentChildren;
}

const BASE_W = 480;
const BASE_H = 320;
const MAX_W = 760;
const MAX_H = 540;
const FIT = 'xMidYMax slice';

/**
 * The room is drawn larger than its 480 x 320 core. Wider screens reveal more wall at the sides,
 * taller ones more wall and rafters above, so the scene fills any phone or tablet without
 * cropping the guest or the counter.
 */
function viewBoxFor(width: number, height: number): string {
  if (!width || !height) return `0 0 ${BASE_W} ${BASE_H}`;
  const aspect = width / height;
  if (aspect >= BASE_W / BASE_H) {
    const w = Math.min(BASE_H * aspect, MAX_W);
    return `${(BASE_W - w) / 2} 0 ${w} ${BASE_H}`;
  }
  const h = Math.min(BASE_W / aspect, MAX_H);
  return `0 ${BASE_H - h} ${BASE_W} ${h}`;
}

const EXT_X0 = (BASE_W - MAX_W) / 2;
const EXT_Y0 = BASE_H - MAX_H;

function Backdrop() {
  const planks = [];
  for (let x = EXT_X0 - (EXT_X0 % 30) - 30; x < BASE_W - EXT_X0; x += 30) {
    planks.push(
      <rect
        x={x}
        y={EXT_Y0}
        width="30"
        height={214 - EXT_Y0}
        fill={Math.round(x / 30) & 1 ? '#734829' : '#6b4225'}
        stroke="#4a2c18"
        stroke-width="1"
      />,
    );
  }
  return (
    <g>
      {planks}
      <g fill="#4a2c18" stroke="#2b1a10" stroke-width="1">
        <rect x={EXT_X0} y="-104" width={MAX_W} height="12" />
        <rect x={EXT_X0} y="-200" width={MAX_W} height="10" />
      </g>
      <g stroke="#5a3820" stroke-width="3" stroke-linecap="round" fill="none">
        <path
          d="M60 -92 q10 30 0 60 M120 -92 q-8 26 0 52 M360 -92 q10 30 0 60 M420 -92 q-8 26 0 52"
          opacity="0.7"
        />
      </g>
      <g fill="#6f8f3e" stroke="#2a1a10" stroke-width="1">
        <ellipse cx="60" cy="-30" rx="9" ry="6" />
        <ellipse cx="120" cy="-40" rx="8" ry="5" />
        <ellipse cx="360" cy="-30" rx="9" ry="6" />
        <ellipse cx="420" cy="-40" rx="8" ry="5" />
      </g>
      <g fill="#4a2c18" opacity="0.55">
        <ellipse cx="44" cy="96" rx="3" ry="2" />
        <ellipse cx="312" cy="128" rx="2.5" ry="1.8" />
        <ellipse cx="418" cy="112" rx="3" ry="2" />
        <ellipse cx="170" cy="30" rx="2.5" ry="1.6" />
      </g>
      <rect x={EXT_X0} y="150" width={MAX_W} height="64" fill="#553219" />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect
          x={10 + i * 80}
          y="160"
          width="64"
          height="44"
          rx="3"
          fill="#4d2d17"
          stroke="#3a2212"
          stroke-width="1.4"
        />
      ))}
      <rect
        x={EXT_X0}
        y="146"
        width={MAX_W}
        height="8"
        fill="#8a5a36"
        stroke={INK}
        stroke-width="1"
      />
      <rect
        x={EXT_X0}
        y="0"
        width={MAX_W}
        height="14"
        fill="#4a2c18"
        stroke={INK}
        stroke-width="1"
      />
      <rect x={EXT_X0} y="212" width={MAX_W} height="108" fill="#3e2415" />
      <g stroke="#2e1a0f" stroke-width="1.2">
        <line x1={EXT_X0} y1="226" x2={BASE_W - EXT_X0} y2="226" />
        <line x1={EXT_X0} y1="244" x2={BASE_W - EXT_X0} y2="244" />
        <line x1="60" y1="212" x2="40" y2="226" />
        <line x1="180" y1="212" x2="172" y2="226" />
        <line x1="300" y1="212" x2="306" y2="226" />
        <line x1="420" y1="212" x2="438" y2="226" />
        <line x1="110" y1="226" x2="96" y2="244" />
        <line x1="250" y1="226" x2="252" y2="244" />
        <line x1="380" y1="226" x2="394" y2="244" />
      </g>
      <rect
        x="0"
        y={EXT_Y0}
        width="14"
        height={BASE_H - EXT_Y0}
        fill="#4a2c18"
        stroke={INK}
        stroke-width="1"
      />
      <rect
        x="466"
        y={EXT_Y0}
        width="14"
        height={BASE_H - EXT_Y0}
        fill="#4a2c18"
        stroke={INK}
        stroke-width="1"
      />
    </g>
  );
}

function Counter() {
  return (
    <g>
      <rect
        x={EXT_X0 - 10}
        y="270"
        width={MAX_W + 20}
        height="60"
        fill="#6a3f22"
        stroke={INK}
        stroke-width="1.6"
      />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect
          x={6 + i * 80}
          y="280"
          width="68"
          height="30"
          rx="3"
          fill="#5a331b"
          stroke="#40240f"
          stroke-width="1.4"
        />
      ))}
      <rect
        x={EXT_X0 - 10}
        y="256"
        width={MAX_W + 20}
        height="16"
        rx="3"
        fill="#b27a45"
        stroke={INK}
        stroke-width="1.6"
      />
      <path
        d={`M${EXT_X0 - 10} 260 L${BASE_W - EXT_X0 + 10} 260`}
        stroke="#d19a5f"
        stroke-width="2"
        opacity="0.8"
      />
    </g>
  );
}

function Piece({ id }: { id?: FurnitureId }) {
  const Art = id ? FURNITURE_ART[id] : undefined;
  return Art ? <Art /> : null;
}

/** The tavern: back room, the guest at the bar, and the counter with Barley on it. */
export function TavernScene({
  placed,
  customer,
  barleyMood = 'neutral',
  barleyTalking,
  class: className,
  children,
}: TavernSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(`0 0 ${BASE_W} ${BASE_H}`);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setView(viewBoxFor(el.clientWidth, el.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const VIEW = view;
  const [vx, vy, vw, vh] = view.split(' ').map(Number) as [number, number, number, number];
  return (
    <div ref={ref} class={['scene', className].filter(Boolean).join(' ')}>
      <svg class="scene-layer" viewBox={VIEW} preserveAspectRatio={FIT} aria-hidden="true">
        <Backdrop />
        {BACK_SLOTS.map((slot) => (
          <Piece key={slot} id={placed[slot]} />
        ))}
        <rect x={vx} y={vy} width={vw} height={vh} fill="url(#room-light)" />
      </svg>
      {customer && (
        <svg class="scene-layer" viewBox={VIEW} preserveAspectRatio={FIT} aria-hidden="true">
          <g key={customer.key} class={`scene-customer is-${customer.motion}`}>
            <ellipse cx="240" cy="262" rx="70" ry="8" fill="rgba(0,0,0,0.25)" />
            <g transform="translate(150 71.2) scale(1.8)">
              <PortraitGraphic
                spec={customer.spec}
                mood={customer.mood}
                talking={customer.talking}
              />
            </g>
          </g>
        </svg>
      )}
      <svg class="scene-layer" viewBox={VIEW} preserveAspectRatio={FIT} aria-hidden="true">
        <Counter />
        <g transform="translate(14 196) scale(0.98)">
          <BarleyGraphic mood={barleyMood} talking={barleyTalking} />
        </g>
        <Piece id={placed.counter} />
        <rect x={vx} y={vy} width={vw} height={vh} fill="url(#vignette)" pointer-events="none" />
      </svg>
      {children}
    </div>
  );
}
