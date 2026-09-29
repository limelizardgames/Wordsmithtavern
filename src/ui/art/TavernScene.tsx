import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { FurnitureId, FurnitureSlot, Mood, PortraitSpec } from '../../game/types';
import { PortraitGraphic } from './Portrait';
import { layer, SCENE_FX, type Layer } from './renders';
import './scene.css';

/**
 * Back-to-front order of the furniture behind the guest. The counter piece and Barley are
 * drawn in front of the guest with the bar itself.
 */
const BACK_SLOTS: FurnitureSlot[] = [
  'window',
  'wallRight',
  'hearth',
  'wallLeft',
  'floorRight',
  'hearthside',
  'lights',
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

// Scene units (see art/blender/tavern/core.py): a 480 x 320 core that wider or taller boxes
// extend up to 760 x 540, revealing more of the room without cropping the guest or the bar.
const BASE_W = 480;
const BASE_H = 320;
const MAX_W = 760;
const MAX_H = 540;
const FIT = 'xMidYMax slice';

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

export function LayerImage({ l, class: className }: { l?: Layer; class?: string }) {
  if (!l) return null;
  return (
    <image
      href={l.url}
      x={l.x}
      y={l.y}
      width={l.w}
      height={l.h}
      preserveAspectRatio="none"
      class={className}
    />
  );
}

function piece(id: FurnitureId | undefined) {
  return id ? layer(`item:${id}`) : undefined;
}

/** Firelight and lamp glow that breathe gently over the still render. */
function LightPlay() {
  const [fx, fy] = SCENE_FX.fire;
  return (
    <g class="light-play" pointer-events="none">
      <circle class="fire-flicker" cx={fx} cy={fy} r="120" fill="url(#fire-light)" />
      <circle class="fire-flicker is-slow" cx={fx + 6} cy={fy - 8} r="70" fill="url(#fire-light)" />
      {SCENE_FX.lamps.map(([x, y], i) => (
        <circle
          class={`lamp-flicker ${i % 2 ? 'is-offset' : ''}`}
          cx={x}
          cy={y}
          r="46"
          fill="url(#lamp-light)"
        />
      ))}
    </g>
  );
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
  const [vx, vy, vw, vh] = view.split(' ').map(Number) as [number, number, number, number];
  const barley = layer(`barley:${barleyMood}`) ?? layer('barley:neutral');
  return (
    <div ref={ref} class={['scene', className].filter(Boolean).join(' ')}>
      <svg class="scene-layer" viewBox={view} preserveAspectRatio={FIT} aria-hidden="true">
        <LayerImage l={layer('base')} />
        {BACK_SLOTS.map((slot) => (
          <LayerImage key={slot} l={piece(placed[slot])} />
        ))}
        <LightPlay />
      </svg>
      {customer && (
        <svg class="scene-layer" viewBox={view} preserveAspectRatio={FIT} aria-hidden="true">
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
      <svg class="scene-layer" viewBox={view} preserveAspectRatio={FIT} aria-hidden="true">
        <LayerImage l={layer('counter')} />
        <LayerImage l={piece(placed.counter)} />
        <g class={`scene-barley ${barleyTalking ? 'is-talking' : ''}`}>
          <LayerImage l={barley} />
        </g>
        <rect x={vx} y={vy} width={vw} height={vh} fill="url(#vignette)" pointer-events="none" />
      </svg>
      {children}
    </div>
  );
}
