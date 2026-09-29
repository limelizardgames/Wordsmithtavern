import type { JSX } from 'preact';
import type { Mood, PortraitSpec } from '../../game/types';
import { INK, shade } from './color';
import { portraitImage } from './renders';
import './portrait.css';

interface PortraitProps {
  spec: PortraitSpec;
  mood?: Mood;
  talking?: boolean;
  /** Silhouette for guests you haven't met yet. */
  silhouette?: boolean;
  class?: string;
  title?: string;
}

const S = { stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' as const };
const WHITE = '#fffaf0';
const MOUTH = '#7a2a22';

type Parts = {
  spec: PortraitSpec;
  mood: Mood;
  skin: string;
  hair: string;
};

// ── Ears ───────────────────────────────────────────────────────────────────
function mirror(d: string): JSX.Element {
  return <path d={d} transform="translate(100 0) scale(-1 1)" />;
}

function Ears({ spec, skin }: Parts) {
  const fill = { fill: skin, ...S };
  const inner = shade(skin, -0.18);
  switch (spec.species) {
    case 'elf': {
      const d = 'M32 40 C 24 36, 18 30, 13 23 C 17 36, 23 48, 32 53 Z';
      return (
        <g {...fill}>
          <path d={d} />
          {mirror(d)}
        </g>
      );
    }
    case 'goblin': {
      const d = 'M32 38 C 20 36, 10 33, 1 28 C 9 42, 20 51, 32 53 Z';
      const i = 'M29 42 C 21 40, 14 37, 9 35 C 14 43, 21 48, 29 49 Z';
      return (
        <g>
          <g {...fill}>
            <path d={d} />
            {mirror(d)}
          </g>
          <g fill={inner}>
            <path d={i} />
            {mirror(i)}
          </g>
        </g>
      );
    }
    case 'orc': {
      const d = 'M31 40 C 25 38, 21 34, 17 29 C 20 40, 24 48, 31 52 Z';
      return (
        <g {...fill}>
          <path d={d} />
          {mirror(d)}
        </g>
      );
    }
    case 'gnome':
      return (
        <g {...fill}>
          <ellipse cx="30" cy="48" rx="6" ry="8" />
          <ellipse cx="70" cy="48" rx="6" ry="8" />
        </g>
      );
    case 'ent':
    case 'skeleton':
      return null;
    default:
      return (
        <g {...fill}>
          <ellipse cx="30.5" cy="46.5" rx="4.5" ry="6.5" />
          <ellipse cx="69.5" cy="46.5" rx="4.5" ry="6.5" />
        </g>
      );
  }
}

// ── Head ───────────────────────────────────────────────────────────────────
function Head({ spec, skin }: Parts) {
  const fill = { fill: skin, ...S };
  switch (spec.species) {
    case 'dwarf':
      return <ellipse cx="50" cy="44" rx="22" ry="21" {...fill} />;
    case 'halfling':
      return <ellipse cx="50" cy="44.5" rx="21" ry="21.5" {...fill} />;
    case 'gnome':
      return <ellipse cx="50" cy="46" rx="19.5" ry="19.5" {...fill} />;
    case 'goblin':
      return (
        <path
          d="M30 40 C 30 21, 70 21, 70 40 C 70 56, 60 66, 50 66 C 40 66, 30 56, 30 40 Z"
          {...fill}
        />
      );
    case 'orc':
      return (
        <path
          d="M28.5 42 C 28.5 21, 71.5 21, 71.5 42 C 71.5 57, 66 66.5, 50 66.5 C 34 66.5, 28.5 57, 28.5 42 Z"
          {...fill}
        />
      );
    case 'ent': {
      const bark = shade(skin, -0.28);
      return (
        <g>
          <path d="M29 28 Q50 18 71 28 L73 55 Q50 71 27 55 Z" {...fill} />
          <g stroke={bark} stroke-width="1.4" fill="none" stroke-linecap="round">
            <path d="M35 28 q2 10 -1 20" />
            <path d="M65 28 q-2 10 1 20" />
            <path d="M44 23 q1 5 -1 9" />
            <path d="M57 23 q-1 5 1 9" />
            <path d="M33 54 q4 5 9 7" />
          </g>
        </g>
      );
    }
    case 'skeleton':
      return (
        <path
          d="M30 42 C 30 20, 70 20, 70 42 C 70 52, 64 56, 62 60 L 60 66 L 40 66 L 38 60 C 36 56, 30 52, 30 42 Z"
          {...fill}
        />
      );
    default:
      return (
        <g>
          <ellipse cx="50" cy="44" rx="20" ry="22" {...fill} />
          {(spec.hairStyle ?? 'none') === 'none' && (spec.hat ?? 'none') === 'none' && (
            <ellipse
              cx="42"
              cy="29"
              rx="5"
              ry="2.6"
              fill="#fff"
              opacity="0.3"
              transform="rotate(-20 42 29)"
            />
          )}
        </g>
      );
  }
}

// ── Body & outfit ──────────────────────────────────────────────────────────
function Body({ spec, skin }: Parts) {
  const outfit = spec.outfit;
  const accent = spec.outfitAccent ?? shade(outfit, 0.35);
  const style = spec.outfitStyle ?? 'tunic';
  const base = 'M10 111 C 10 90, 24 79, 50 79 C 76 79, 90 90, 90 111 Z';
  const detail: JSX.Element[] = [];
  let bodyFill = outfit;

  switch (style) {
    case 'tunic':
      detail.push(
        <path
          key="v"
          d="M41 80 L50 93 L59 80 Z"
          fill={shade(outfit, 0.5)}
          {...S}
          stroke-width={1.2}
        />,
        <path
          key="t"
          d="M40 80 L50 94 L60 80"
          fill="none"
          stroke={accent}
          stroke-width="2.6"
          stroke-linecap="round"
        />,
      );
      break;
    case 'robe':
      detail.push(
        <path
          key="c"
          d="M35 80 Q50 104 65 80"
          fill="none"
          stroke={accent}
          stroke-width="4"
          stroke-linecap="round"
        />,
        <path key="c2" d="M35 80 Q50 104 65 80" fill="none" stroke={INK} stroke-width="1" />,
        <g key="s" fill={accent} opacity="0.85">
          <circle cx="24" cy="98" r="1.4" />
          <circle cx="31" cy="106" r="1.1" />
          <circle cx="72" cy="96" r="1.3" />
          <circle cx="79" cy="105" r="1.1" />
        </g>,
      );
      break;
    case 'armor': {
      const steel = outfit;
      detail.push(
        <path key="tab" d="M40 86 L60 86 L62 111 L38 111 Z" fill={accent} {...S} />,
        <path
          key="cross"
          d="M50 92 L50 106 M44 98 L56 98"
          stroke={shade(accent, 0.6)}
          stroke-width="2.2"
        />,
        <ellipse
          key="mail"
          cx="50"
          cy="81"
          rx="12"
          ry="4"
          fill={shade(steel, -0.2)}
          {...S}
          stroke-width={1.2}
        />,
        <path
          key="pl"
          d="M11 104 C 10 88, 22 80, 36 83 C 38 92, 30 100, 20 104 Z"
          fill={steel}
          {...S}
        />,
        <path
          key="pr"
          d="M89 104 C 90 88, 78 80, 64 83 C 62 92, 70 100, 80 104 Z"
          fill={steel}
          {...S}
        />,
        <circle key="r1" cx="22" cy="92" r="1.3" fill={shade(steel, 0.5)} />,
        <circle key="r2" cx="78" cy="92" r="1.3" fill={shade(steel, 0.5)} />,
      );
      break;
    }
    case 'apron':
      detail.push(
        <path key="bib" d="M37 89 L63 89 L66 111 L34 111 Z" fill={accent} {...S} />,
        <path
          key="straps"
          d="M38 89 L35 80 M62 89 L65 80"
          stroke={shade(accent, -0.3)}
          stroke-width="2.4"
        />,
        <rect
          key="pocket"
          x="44"
          y="97"
          width="12"
          height="8"
          rx="1.5"
          fill={shade(accent, -0.12)}
          {...S}
          stroke-width={1}
        />,
      );
      break;
    case 'vest':
      bodyFill = '#efe2c4';
      detail.push(
        <path key="l" d="M10 111 C 10 90, 24 79, 42 80 L 46 111 Z" fill={outfit} {...S} />,
        <path key="r" d="M90 111 C 90 90, 76 79, 58 80 L 54 111 Z" fill={outfit} {...S} />,
        <circle key="b1" cx="44" cy="94" r="1.4" fill={accent} />,
        <circle key="b2" cx="44.6" cy="102" r="1.4" fill={accent} />,
      );
      break;
    case 'coat':
      detail.push(
        <path key="shirt" d="M42 80 L50 96 L58 80 Z" fill="#f2ead8" {...S} stroke-width={1.2} />,
        <path key="ll" d="M42 80 L50 96 L37 99 L33 86 Z" fill={accent} {...S} />,
        <path key="lr" d="M58 80 L50 96 L63 99 L67 86 Z" fill={accent} {...S} />,
        <circle key="b1" cx="50" cy="102" r="1.8" fill="#f2c14e" stroke={INK} stroke-width="0.8" />,
        <circle key="b2" cx="50" cy="108" r="1.8" fill="#f2c14e" stroke={INK} stroke-width="0.8" />,
      );
      break;
    case 'suit':
      detail.push(
        <path key="shirt" d="M41 80 L50 101 L59 80 Z" fill="#f6f2ea" {...S} stroke-width={1.2} />,
        <path
          key="tie"
          d="M48.3 84 L51.7 84 L53 99 L50 103 L47 99 Z"
          fill={accent}
          {...S}
          stroke-width={1}
        />,
        <path
          key="ll"
          d="M41 80 L50 101 L39 98 Z"
          fill={shade(outfit, -0.15)}
          {...S}
          stroke-width={1.1}
        />,
        <path
          key="lr"
          d="M59 80 L50 101 L61 98 Z"
          fill={shade(outfit, -0.15)}
          {...S}
          stroke-width={1.1}
        />,
      );
      break;
    case 'shawl':
      detail.push(
        <path
          key="shawl"
          d="M10 99 C 20 85, 36 83, 50 91 C 64 83, 80 85, 90 99 L 90 106 C 76 96, 62 98, 50 106 C 38 98, 24 96, 10 106 Z"
          fill={accent}
          {...S}
        />,
        <g key="fringe" fill={shade(accent, -0.2)}>
          {[16, 24, 32, 40, 60, 68, 76, 84].map((x) => (
            <circle cx={x} cy={x < 50 ? 106 - (x - 10) * 0.18 : 106 - (90 - x) * 0.18} r="1.2" />
          ))}
        </g>,
      );
      break;
    case 'bark':
      detail.push(
        <g
          key="bark"
          stroke={shade(outfit, -0.3)}
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
        >
          <path d="M26 92 q3 8 1 18" />
          <path d="M40 86 q-2 12 1 24" />
          <path d="M60 86 q2 12 -1 24" />
          <path d="M74 92 q-3 8 -1 18" />
        </g>,
        <path
          key="moss"
          d="M30 84 q6 -4 12 0 q6 -3 10 1"
          stroke={spec.outfitAccent ?? '#5f8f3e'}
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />,
      );
      break;
  }

  return (
    <g>
      <path d="M43 58 L43 83 L57 83 L57 58 Z" fill={skin} {...S} />
      <path d={base} fill={bodyFill} {...S} />
      {detail}
    </g>
  );
}

// ── Hair ───────────────────────────────────────────────────────────────────
const HAIR_TOP = 'M29.5 44 C 28 19, 72 19, 70.5 44 C 68 34, 60 29, 50 30 C 40 29, 32 34, 29.5 44 Z';

function HairBack({ spec, hair }: Parts) {
  return (
    <g>
      {spec.hat === 'hood' && (
        <path
          d="M21 62 C 17 30, 32 13, 50 13 C 68 13, 83 30, 79 62 L 82 90 L 18 90 Z"
          fill={spec.hatColor ?? '#333'}
          {...S}
        />
      )}
      {spec.hairStyle === 'long' && (
        <path d="M29 34 C 21 52, 23 80, 30 87 L70 87 C 77 80, 79 52, 71 34 Z" fill={hair} {...S} />
      )}
    </g>
  );
}

function HairFront({ spec, hair }: Parts) {
  const fill = { fill: hair, ...S };
  switch (spec.hairStyle) {
    case 'short':
    case 'long':
      return <path d={HAIR_TOP} {...fill} />;
    case 'curly':
      return (
        <g {...fill}>
          {[
            [31, 38, 6],
            [34, 29, 7],
            [42, 23, 7.5],
            [51, 21, 7.5],
            [60, 23, 7.5],
            [67, 30, 7],
            [70, 39, 6],
          ].map(([cx, cy, r]) => (
            <circle cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case 'bun':
      return (
        <g {...fill}>
          <circle cx="50" cy="19" r="7.5" />
          <path d={HAIR_TOP} />
        </g>
      );
    case 'spiky':
      return (
        <path
          d="M29 44 L27 29 L34 32 L35 19 L43 27 L50 14 L57 26 L65 19 L66 31 L73 29 L71 44 C 67 34, 59 30, 50 31 C 41 30, 33 34, 29 44 Z"
          {...fill}
        />
      );
    case 'braids':
      return (
        <g {...fill}>
          <path d={HAIR_TOP} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g>
              <ellipse cx={29 - i * 0.4} cy={52 + i * 7} rx="3.6" ry="4.4" />
              <ellipse cx={71 + i * 0.4} cy={52 + i * 7} rx="3.6" ry="4.4" />
            </g>
          ))}
        </g>
      );
    case 'wild':
      return (
        <path
          d="M27 47 C 17 37, 25 30, 23 21 C 31 23, 33 13, 42 15 C 46 6, 57 8, 59 15 C 67 11, 73 19, 75 23 C 82 30, 77 39, 73 47 C 68 34, 58 30, 50 31 C 42 30, 32 34, 27 47 Z"
          {...fill}
        />
      );
    default:
      return null;
  }
}

// ── Beard ──────────────────────────────────────────────────────────────────
function Beard({ spec, hair }: Parts) {
  const fill = { fill: hair, ...S };
  const stache =
    'M39.5 56.5 C 43 52.5, 47 53, 50 55.5 C 53 53, 57 52.5, 60.5 56.5 C 56 57.5, 53 58, 50 57.5 C 47 58, 44 57.5, 39.5 56.5 Z';
  switch (spec.beard) {
    case 'stubble':
      return (
        <g fill={shade(spec.skin, -0.35)} opacity="0.5">
          {[36, 40, 44, 48, 52, 56, 60, 64].map((x, i) => (
            <circle cx={x} cy={60 + Math.abs(50 - x) * -0.1 + (i % 2)} r="0.7" />
          ))}
        </g>
      );
    case 'short':
      return (
        <g {...fill}>
          <path d="M30.5 48 C 31 68, 41 75, 50 75 C 59 75, 69 68, 69.5 48 C 64 57, 58 61, 50 61 C 42 61, 36 57, 30.5 48 Z" />
          <path d={stache} />
        </g>
      );
    case 'long':
    case 'braided':
      return (
        <g {...fill}>
          <path d="M29.5 48 C 29 74, 40 96, 50 99 C 60 96, 71 74, 70.5 48 C 64 58, 58 62, 50 62 C 42 62, 36 58, 29.5 48 Z" />
          <path d={stache} />
          {spec.beard === 'braided' && (
            <g stroke={shade(hair, -0.35)} stroke-width="1.2" fill="none">
              <path d="M44 78 L56 78" />
              <path d="M45 86 L55 86" />
              <circle cx="50" cy="93" r="2.2" fill="#d9b44a" stroke={INK} stroke-width="0.8" />
            </g>
          )}
        </g>
      );
    case 'mustache':
      return (
        <path
          d="M37 55 C 41 50.5, 46.5 51.5, 50 54.5 C 53.5 51.5, 59 50.5, 63 55 C 65 57, 66 54, 67.5 52.5 C 67 58.5, 62 60, 58 58.5 C 55 57.8, 52 57.5, 50 57.5 C 48 57.5, 45 57.8, 42 58.5 C 38 60, 33 58.5, 32.5 52.5 C 34 54, 35 57, 37 55 Z"
          {...fill}
        />
      );
    case 'goatee':
      return (
        <path d="M45.5 62.5 C 47 71, 53 71, 54.5 62.5 C 52 64, 48 64, 45.5 62.5 Z" {...fill} />
      );
    default:
      return null;
  }
}

// ── Face ───────────────────────────────────────────────────────────────────
function Eyes({ spec, mood, skin }: Parts) {
  if (mood === 'happy') {
    return (
      <g stroke={INK} stroke-width="2.2" fill="none" stroke-linecap="round">
        <path d="M38.5 45.5 Q42 41 45.5 45.5" />
        <path d="M54.5 45.5 Q58 41 61.5 45.5" />
      </g>
    );
  }
  const type = spec.eyes ?? 'dot';
  const wide = type === 'wide' || mood === 'surprised';
  let eyes: JSX.Element;
  if (type === 'glow' && !wide) {
    eyes = (
      <g fill="#ffe27a" stroke={INK} stroke-width="1">
        <ellipse cx="42" cy="44.5" rx="3.2" ry="2.4" />
        <ellipse cx="58" cy="44.5" rx="3.2" ry="2.4" />
      </g>
    );
  } else if (wide) {
    eyes = (
      <g>
        <g fill={WHITE} stroke={INK} stroke-width="1.2">
          <ellipse cx="42" cy="44.5" rx="4.2" ry="4.8" />
          <ellipse cx="58" cy="44.5" rx="4.2" ry="4.8" />
        </g>
        <g fill={INK}>
          <circle cx="42.5" cy="45" r="2.3" />
          <circle cx="58.5" cy="45" r="2.3" />
        </g>
        <g fill={WHITE}>
          <circle cx="43.3" cy="44" r="0.8" />
          <circle cx="59.3" cy="44" r="0.8" />
        </g>
      </g>
    );
  } else {
    eyes = (
      <g>
        <g fill={INK}>
          <ellipse cx="42" cy="44.8" rx="2.3" ry="2.9" />
          <ellipse cx="58" cy="44.8" rx="2.3" ry="2.9" />
        </g>
        <g fill={WHITE}>
          <circle cx="42.8" cy="43.8" r="0.75" />
          <circle cx="58.8" cy="43.8" r="0.75" />
        </g>
      </g>
    );
  }
  const lids =
    type === 'sleepy' && !wide ? (
      <g fill={skin} stroke={INK} stroke-width="1.1">
        <path d="M38.8 44.6 Q42 40.6 45.2 44.6 Z" />
        <path d="M54.8 44.6 Q58 40.6 61.2 44.6 Z" />
      </g>
    ) : null;
  return (
    <g class="portrait-eyes">
      {eyes}
      {lids}
    </g>
  );
}

const BROWS: Record<Mood, [string, string]> = {
  neutral: ['M38 38.5 Q42 37 46 38', 'M54 38 Q58 37 62 38.5'],
  happy: ['M38 37 Q42 34.8 46 36.6', 'M54 36.6 Q58 34.8 62 37'],
  grumpy: ['M38 36 L46 39.6', 'M54 39.6 L62 36'],
  sad: ['M38 39.6 L46 36.2', 'M54 36.2 L62 39.6'],
  surprised: ['M38 35 Q42 32.2 46 34.4', 'M54 34.4 Q58 32.2 62 35'],
};

function Brows({ spec, mood, hair }: Parts) {
  const bushy = spec.species === 'dwarf' || spec.accessories?.includes('wrinkles');
  const color =
    spec.hairStyle === 'none' && !spec.beard ? shade(spec.skin, -0.45) : shade(hair, -0.2);
  const [l, r] = BROWS[mood];
  return (
    <g stroke={color} stroke-width={bushy ? 3.2 : 2.1} fill="none" stroke-linecap="round">
      <path d={l} />
      <path d={r} />
    </g>
  );
}

function Nose({ spec, skin }: Parts) {
  const fill = { fill: shade(skin, -0.1), stroke: INK, 'stroke-width': 1.1 };
  const kind =
    spec.nose ??
    (spec.species === 'dwarf' || spec.species === 'gnome' || spec.species === 'orc'
      ? 'big'
      : spec.species === 'goblin'
        ? 'long'
        : 'button');
  switch (kind) {
    case 'big':
      return <ellipse cx="50" cy="51.5" rx="5" ry="4.2" {...fill} />;
    case 'long':
      return <path d="M48.5 45 C 49 50, 56 53, 55 56.5 C 53 58, 48 57, 47.5 54" {...fill} />;
    case 'pointy':
      return <path d="M50 45.5 L54 54 L47.8 54 Z" {...fill} />;
    default:
      return <ellipse cx="50" cy="51.5" rx="2.8" ry="2.3" {...fill} />;
  }
}

function Mouth({ mood }: Parts) {
  const line = {
    stroke: INK,
    'stroke-width': 1.8,
    fill: 'none',
    'stroke-linecap': 'round' as const,
  };
  let rest: JSX.Element;
  switch (mood) {
    case 'happy':
      rest = (
        <g>
          <path
            d="M43.5 58 Q50 66.5 56.5 58 Z"
            fill={MOUTH}
            stroke={INK}
            stroke-width="1.4"
            stroke-linejoin="round"
          />
          <ellipse cx="50" cy="62.3" rx="2.6" ry="1.3" fill="#d9695a" />
        </g>
      );
      break;
    case 'grumpy':
      rest = <path d="M45 62 Q50 57.8 55 62" {...line} />;
      break;
    case 'sad':
      rest = <path d="M46 62 Q50 59.2 54 62" {...line} />;
      break;
    case 'surprised':
      rest = (
        <ellipse cx="50" cy="61" rx="3" ry="3.8" fill={MOUTH} stroke={INK} stroke-width="1.3" />
      );
      break;
    default:
      rest = <path d="M45 60 Q50 62.5 55 60" {...line} />;
  }
  return (
    <g>
      <g class="portrait-mouth-rest">{rest}</g>
      <ellipse
        class="portrait-mouth-open"
        cx="50"
        cy="61"
        rx="3.6"
        ry="2.8"
        fill={MOUTH}
        stroke={INK}
        stroke-width="1.3"
      />
    </g>
  );
}

function Cheeks({ spec }: Parts) {
  const acc = spec.accessories ?? [];
  return (
    <g>
      {acc.includes('blush') && (
        <g fill="#e8746a" opacity="0.38">
          <ellipse cx="37.5" cy="53.5" rx="3.8" ry="2.3" />
          <ellipse cx="62.5" cy="53.5" rx="3.8" ry="2.3" />
        </g>
      )}
      {acc.includes('freckles') && (
        <g fill={shade(spec.skin, -0.35)}>
          <circle cx="38.5" cy="51" r="0.7" />
          <circle cx="41" cy="52.6" r="0.7" />
          <circle cx="37" cy="53.2" r="0.6" />
          <circle cx="61.5" cy="51" r="0.7" />
          <circle cx="59" cy="52.6" r="0.7" />
          <circle cx="63" cy="53.2" r="0.6" />
        </g>
      )}
      {acc.includes('wrinkles') && (
        <g stroke={shade(spec.skin, -0.35)} stroke-width="0.9" fill="none" stroke-linecap="round">
          <path d="M34 43 l-2.6 -1.4 M34 46 l-2.8 0.4" />
          <path d="M66 43 l2.6 -1.4 M66 46 l2.8 0.4" />
          <path d="M44 31.5 Q50 30.2 56 31.5" />
        </g>
      )}
      {acc.includes('scar') && (
        <g stroke="#b5655a" stroke-width="1.3" stroke-linecap="round">
          <path d="M61 47.5 L66.5 55" />
          <path d="M62.5 51 l2.2 -1 M64 53.2 l2.2 -1" stroke-width="0.9" />
        </g>
      )}
    </g>
  );
}

// ── Hats ───────────────────────────────────────────────────────────────────
function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(2)},${(y + Math.sin(a) * rr).toFixed(2)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} />;
}

function Hat({ spec }: Parts) {
  const hat = spec.hatColor ?? '#5b3a24';
  const accent = spec.hatAccent ?? shade(hat, 0.4);
  const fill = { fill: hat, ...S };
  switch (spec.hat) {
    case 'wizard':
      return (
        <g>
          <ellipse cx="50" cy="29" rx="31" ry="6.5" {...fill} />
          <path d="M30 28 C 34 13, 43 -1, 61 -12 C 58 -1, 64 12, 70 28 Z" {...fill} />
          <path d="M19 29 C 30 36.5, 70 36.5, 81 29 C 70 33.5, 30 33.5, 19 29 Z" {...fill} />
          <path
            d="M31.5 24.5 Q50 20.5 68.5 24.5 L69.4 27.8 Q50 24 30.6 27.8 Z"
            fill={accent}
            stroke={INK}
            stroke-width="1"
          />
          <Star x={46} y={11} r={3.2} fill={accent} />
          <Star x={58} y={17} r={2.2} fill={accent} />
          <Star x={53} y={2} r={1.8} fill={accent} />
        </g>
      );
    case 'bard':
      return (
        <g>
          <path d="M67 21 C 74 7, 86 -4, 96 -9 C 92 2, 82 14, 71 24 Z" fill={accent} {...S} />
          <path
            d="M71 22 C 78 12, 86 3, 94 -6"
            stroke={shade(accent, -0.35)}
            stroke-width="1"
            fill="none"
          />
          <path
            d="M26.5 34.5 C 21 18, 48 7, 70 15 C 81 19, 81 30, 73.5 34.5 C 60 30.5, 40 30.5, 26.5 34.5 Z"
            {...fill}
          />
          <path
            d="M27 34 C 40 30, 60 30, 73.5 34"
            stroke={shade(hat, -0.3)}
            stroke-width="2"
            fill="none"
          />
        </g>
      );
    case 'helmet':
      return (
        <g>
          {spec.hatAccent && (
            <path d="M50 17 C 54 5, 66 -5, 83 -8 C 79 1, 71 9, 61 19 Z" fill={accent} {...S} />
          )}
          <path d="M27 41 C 26 14, 74 14, 73 41 Z" {...fill} />
          <path d="M50 16 L50 36" stroke={shade(hat, -0.25)} stroke-width="1.6" />
          <rect x="25.5" y="35" width="49" height="7.5" rx="3" fill={shade(hat, -0.15)} {...S} />
          <g fill={shade(hat, 0.5)}>
            <circle cx="32" cy="38.8" r="1.1" />
            <circle cx="50" cy="38.8" r="1.1" />
            <circle cx="68" cy="38.8" r="1.1" />
          </g>
        </g>
      );
    case 'tricorn':
      return (
        <g>
          <path
            d="M15 33 C 26 24, 36 21, 50 11 C 64 21, 74 24, 85 33 C 71 30.5, 61 35, 50 30.5 C 39 35, 29 30.5, 15 33 Z"
            {...fill}
          />
          <path
            d="M15.5 32.5 C 29 30.5, 39 34.5, 50 30 C 61 34.5, 71 30.5, 84.5 32.5"
            fill="none"
            stroke={accent}
            stroke-width="1.8"
          />
          <circle cx="50" cy="22" r="2.2" fill={accent} stroke={INK} stroke-width="0.8" />
        </g>
      );
    case 'hood':
      return (
        <path
          d="M25 62 C 20 31, 34 15, 50 15 C 66 15, 80 31, 75 62 L 69.5 58 C 71 36, 62 24, 50 24 C 38 24, 29 36, 30.5 58 Z"
          fill={shade(hat, 0.06)}
          {...S}
        />
      );
    case 'scarf':
      return (
        <g>
          <path d="M27.5 39 C 25 17, 75 17, 72.5 39 C 66 32.5, 34 32.5, 27.5 39 Z" {...fill} />
          <circle cx="74" cy="35" r="4.2" {...fill} />
          <path d="M75 38 C 80 44, 80 52, 77 58 C 75 51, 73 45, 72 40 Z" {...fill} />
          <g fill={accent} stroke={INK} stroke-width="0.6">
            {[32, 38, 44, 50, 56, 62, 68].map((x) => (
              <circle cx={x} cy={36.5 + Math.abs(50 - x) * 0.06} r="1.7" />
            ))}
          </g>
        </g>
      );
    case 'tophat':
      return (
        <g>
          <ellipse cx="50" cy="27" rx="25" ry="5.2" {...fill} />
          <path d="M36 26 L37 -3 Q50 -6.5 63 -3 L64 26 Q50 29 36 26 Z" {...fill} />
          <path
            d="M36.5 17.5 Q50 20 63.5 17.5 L63.8 23.5 Q50 26 36.2 23.5 Z"
            fill={accent}
            stroke={INK}
            stroke-width="1"
          />
          <ellipse
            cx="50"
            cy="-3"
            rx="13"
            ry="2.6"
            fill={shade(hat, 0.15)}
            {...S}
            stroke-width={1.2}
          />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M33 30 L32 13 L41 21 L50 8 L59 21 L68 13 L67 30 Z" fill="#f2c14e" {...S} />
          <circle cx="50" cy="24" r="2.4" fill={accent} stroke={INK} stroke-width="0.8" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path
            d="M27.5 37 C 26 19, 68 15, 72.5 30 C 77 31, 83 33, 84 36.5 C 76 38.5, 70 37.5, 64 35.5 C 52 32.5, 40 33.5, 27.5 37 Z"
            {...fill}
          />
          <path
            d="M30 34 C 38 30, 52 29.5, 64 32"
            stroke={shade(hat, -0.3)}
            stroke-width="1"
            stroke-dasharray="2 2"
            fill="none"
          />
          <circle cx="50" cy="20.5" r="2" fill={accent} stroke={INK} stroke-width="0.8" />
        </g>
      );
    case 'strawhat':
      return (
        <g>
          <ellipse cx="50" cy="31" rx="36" ry="8" {...fill} />
          <path d="M33 31 C 33 11, 67 11, 67 31 Z" {...fill} />
          <path
            d="M33.3 25.5 Q50 22.5 66.7 25.5 L67 30 Q50 27 33 30 Z"
            fill={accent}
            stroke={INK}
            stroke-width="1"
          />
          <g stroke={shade(hat, -0.25)} stroke-width="0.8" fill="none">
            <path d="M20 31 q6 3 12 3.6 M68 34.6 q6 -0.6 12 -3.6" />
            <path d="M40 16 q2 3 1 6 M56 15.5 q-1 3 0 6" />
          </g>
        </g>
      );
    case 'horns': {
      const d = 'M33 30 C 26 22, 24 13, 28 4 C 32 14, 36 20, 39 26 Z';
      return (
        <g fill="#efe3c4" {...S}>
          <path d={d} />
          {mirror(d)}
        </g>
      );
    }
    default:
      return null;
  }
}

// ── Accessories ────────────────────────────────────────────────────────────
function Accessories({ spec }: Parts) {
  const acc = spec.accessories ?? [];
  const out: JSX.Element[] = [];
  if (acc.includes('tusks')) {
    out.push(
      <g key="tusks" fill={WHITE} stroke={INK} stroke-width="0.9">
        <path d="M43.5 62 L42.2 55.4 L46.4 61 Z" />
        <path d="M56.5 62 L57.8 55.4 L53.6 61 Z" />
      </g>,
    );
  }
  if (acc.includes('glasses')) {
    out.push(
      <g key="glasses" fill="rgba(255,255,255,0.18)" stroke={INK} stroke-width="1.4">
        <circle cx="42" cy="44.8" r="5.4" />
        <circle cx="58" cy="44.8" r="5.4" />
        <path d="M47.4 44.3 Q50 42.8 52.6 44.3 M36.6 44 L31 42 M63.4 44 L69 42" fill="none" />
      </g>,
    );
  }
  if (acc.includes('monocle')) {
    out.push(
      <g key="monocle" fill="none">
        <circle
          cx="58"
          cy="44.8"
          r="5.8"
          fill="rgba(255,255,255,0.2)"
          stroke="#c9a227"
          stroke-width="1.7"
        />
        <path d="M63.4 47.5 Q71 60 66 78" stroke="#c9a227" stroke-width="0.9" />
      </g>,
    );
  }
  if (acc.includes('eyepatch')) {
    out.push(
      <g key="patch">
        <path d="M28.5 39 L71.5 31.5" stroke={INK} stroke-width="1.8" />
        <ellipse cx="42" cy="44.8" rx="5.4" ry="5" fill={INK} />
      </g>,
    );
  }
  if (acc.includes('earring')) {
    out.push(
      <g key="earrings" fill="#f2c14e" stroke={INK} stroke-width="0.8">
        <circle cx="30.5" cy="54" r="2" />
        <circle cx="69.5" cy="54" r="2" />
      </g>,
    );
  }
  if (acc.includes('necklace')) {
    out.push(
      <g key="necklace">
        <path d="M38 81.5 Q50 93 62 81.5" stroke="#d9b44a" stroke-width="1.4" fill="none" />
        <circle
          cx="50"
          cy="90.5"
          r="2.8"
          fill={spec.outfitAccent ?? '#b34a6a'}
          stroke={INK}
          stroke-width="0.9"
        />
      </g>,
    );
  }
  if (acc.includes('leaves')) {
    out.push(
      <g key="leaves" fill={spec.hair ?? '#5f8f3e'} stroke={INK} stroke-width="1">
        <path d="M35 25 q2 -9 10 -8 q-2 8 -10 8 Z" />
        <path d="M47 19 q4 -9 11 -5 q-4 7 -11 5 Z" />
        <path d="M58 22 q7 -6 12 0 q-6 5 -12 0 Z" />
        <path d="M27 33 q-1 -8 7 -10 q0 8 -7 10 Z" />
        <path d="M66 29 q8 -3 10 4 q-7 2 -10 -4 Z" />
      </g>,
    );
  }
  if (acc.includes('rat')) {
    out.push(
      <g key="rat" class="portrait-rat">
        <path
          d="M88 86 C 97 90, 97 101, 88 104"
          stroke="#c99aa4"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
        />
        <ellipse cx="80" cy="84" rx="9.5" ry="6.5" fill="#9b9aa3" stroke={INK} stroke-width="1.3" />
        <ellipse
          cx="72.5"
          cy="79"
          rx="5.2"
          ry="4.3"
          fill="#a6a5ad"
          stroke={INK}
          stroke-width="1.3"
        />
        <circle cx="75.5" cy="74.8" r="2.7" fill="#d9a9b3" stroke={INK} stroke-width="1" />
        <circle cx="71" cy="78" r="0.9" fill={INK} />
        <circle cx="67.6" cy="80.2" r="1" fill="#e07a8a" />
      </g>,
    );
  }
  return <g>{out}</g>;
}

// ── Dragon ─────────────────────────────────────────────────────────────────
const DRAGON_BROWS: Record<Mood, [string, string]> = {
  neutral: ['M33.5 32.5 Q40 29.5 46.5 32.5', 'M53.5 32.5 Q60 29.5 66.5 32.5'],
  happy: ['M33.5 31.5 Q40 27.5 46.5 31', 'M53.5 31 Q60 27.5 66.5 31.5'],
  grumpy: ['M33.5 30 L46.5 34.5', 'M53.5 34.5 L66.5 30'],
  sad: ['M33.5 34 L46.5 30', 'M53.5 30 L66.5 34'],
  surprised: ['M33.5 29.5 Q40 25.5 46.5 29', 'M53.5 29 Q60 25.5 66.5 29.5'],
};

function DragonPortrait({ spec, mood }: { spec: PortraitSpec; mood: Mood }) {
  const scale = spec.skin;
  const dark = shade(scale, -0.3);
  const belly = spec.outfitAccent ?? '#f2b36b';
  const fill = { fill: scale, ...S };
  const horn = 'M35 27 C 26 16, 23 5, 28 -8 C 33 4, 38 14, 43 22 Z';
  const frill = 'M31 36 L11 27 L20 40 L10 46 L30 47 Z';
  const brow = DRAGON_BROWS[mood];
  return (
    <g>
      <path d="M8 111 C 10 89, 27 80, 50 80 C 73 80, 90 89, 92 111 Z" fill={spec.outfit} {...S} />
      <path d="M36 57 L35 86 L65 86 L64 57 Z" {...fill} />
      <path d="M40 82 C 43 96, 57 96, 60 82 L 58 111 L 42 111 Z" fill={belly} {...S} />
      <g stroke={shade(belly, -0.3)} stroke-width="1.1">
        <path d="M43 94 L57 94 M44 101 L56 101 M44.5 107 L55.5 107" />
      </g>
      <g fill="#f1e2bf" {...S}>
        <path d={horn} />
        {mirror(horn)}
      </g>
      <g fill={dark} {...S}>
        <path d={frill} />
        {mirror(frill)}
      </g>
      <path
        d="M29 38 C 29 17, 71 17, 71 38 C 73 48, 70 54, 66 57 L 34 57 C 30 54, 27 48, 29 38 Z"
        {...fill}
      />
      <g fill={dark} stroke={INK} stroke-width="1">
        <path d="M45 21 L47.5 14 L50 21 Z" />
        <path d="M50 20 L52.5 13 L55 20 Z" />
      </g>
      <ellipse cx="50" cy="59" rx="17" ry="11.5" fill={shade(scale, 0.12)} {...S} />
      <g fill={INK}>
        <ellipse cx="44.5" cy="56" rx="1.6" ry="2.2" />
        <ellipse cx="55.5" cy="56" rx="1.6" ry="2.2" />
      </g>
      {mood === 'happy' ? (
        <g stroke={INK} stroke-width="2.4" fill="none" stroke-linecap="round">
          <path d="M34.5 41 Q40 35 45.5 41" />
          <path d="M54.5 41 Q60 35 65.5 41" />
        </g>
      ) : (
        <g class="portrait-eyes">
          <g fill={WHITE} stroke={INK} stroke-width="1.2">
            <ellipse cx="40" cy="40.5" rx="5.6" ry="6.2" />
            <ellipse cx="60" cy="40.5" rx="5.6" ry="6.2" />
          </g>
          <g fill="#ffcc33">
            <ellipse cx="40.5" cy="41" rx="3.6" ry="4.6" />
            <ellipse cx="59.5" cy="41" rx="3.6" ry="4.6" />
          </g>
          <g fill={INK}>
            <ellipse cx="40.5" cy="41" rx={mood === 'surprised' ? 2 : 1} ry="3.6" />
            <ellipse cx="59.5" cy="41" rx={mood === 'surprised' ? 2 : 1} ry="3.6" />
          </g>
          <g fill={WHITE}>
            <circle cx="42" cy="39" r="1" />
            <circle cx="61" cy="39" r="1" />
          </g>
        </g>
      )}
      <g stroke={dark} stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d={brow[0]} />
        <path d={brow[1]} />
      </g>
      <g class="portrait-mouth-rest">
        {mood === 'happy' || mood === 'neutral' ? (
          <g>
            <path
              d="M39 63.5 Q50 71 61 63.5"
              stroke={INK}
              stroke-width="1.8"
              fill="none"
              stroke-linecap="round"
            />
            <path
              d="M42 65.2 L43.4 68.6 L44.8 66.3 M55.2 66.3 L56.6 68.6 L58 65.2"
              fill={WHITE}
              stroke={INK}
              stroke-width="0.8"
            />
          </g>
        ) : mood === 'surprised' ? (
          <ellipse cx="50" cy="66" rx="4" ry="3.6" fill={MOUTH} stroke={INK} stroke-width="1.3" />
        ) : (
          <path
            d="M41 67 Q50 62 59 67"
            stroke={INK}
            stroke-width="1.8"
            fill="none"
            stroke-linecap="round"
          />
        )}
      </g>
      <ellipse
        class="portrait-mouth-open"
        cx="50"
        cy="66"
        rx="5"
        ry="3.4"
        fill={MOUTH}
        stroke={INK}
        stroke-width="1.3"
      />
      <g fill="#e8746a" opacity="0.35">
        <ellipse cx="33" cy="50" rx="4" ry="2.4" />
        <ellipse cx="67" cy="50" rx="4" ry="2.4" />
      </g>
      <g class="portrait-smoke" fill="#d9d2c8" opacity="0.8">
        <circle cx="43" cy="50" r="2.2" />
        <circle cx="57" cy="50" r="2.2" />
      </g>
    </g>
  );
}

interface GraphicProps {
  spec: PortraitSpec;
  mood?: Mood;
  talking?: boolean;
  silhouette?: boolean;
}

/** The portrait as a group in a 100 x 124 box (origin at y = -14), for embedding in other SVGs. */
export function PortraitGraphic({ spec, mood = 'neutral', talking, silhouette }: GraphicProps) {
  const parts: Parts = { spec, mood, skin: spec.skin, hair: spec.hair ?? '#4a3426' };
  const faceShift = spec.species === 'gnome' ? 1.5 : 0;
  const classes = ['portrait', talking && 'is-talking', silhouette && 'is-silhouette']
    .filter(Boolean)
    .join(' ');
  const photo = portraitImage(spec.art, mood);
  if (photo) {
    // Rendered portraits share the drawing's 100 x 124 box, bottom-aligned.
    return (
      <g class={`${classes} is-photo`}>
        <g class="portrait-bob">
          <image
            href={photo}
            x="0"
            y="-14"
            width="100"
            height="124"
            preserveAspectRatio="xMidYMax meet"
          />
        </g>
      </g>
    );
  }
  return (
    <g class={classes}>
      <g class="portrait-bob">
        {spec.species === 'dragon' ? (
          <DragonPortrait spec={spec} mood={mood} />
        ) : (
          <>
            <HairBack {...parts} />
            <Body {...parts} />
            <Ears {...parts} />
            <Head {...parts} />
            <g transform={`translate(0 ${faceShift})`}>
              <Cheeks {...parts} />
              <Eyes {...parts} />
              <Brows {...parts} />
              <Beard {...parts} />
              <Nose {...parts} />
              <Mouth {...parts} />
            </g>
            <HairFront {...parts} />
            <Hat {...parts} />
            <Accessories {...parts} />
          </>
        )}
      </g>
    </g>
  );
}

export function Portrait({
  spec,
  mood,
  talking,
  silhouette,
  class: className,
  title,
}: PortraitProps) {
  return (
    <svg
      class={['portrait-svg', className].filter(Boolean).join(' ')}
      viewBox="0 -14 100 124"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <PortraitGraphic spec={spec} mood={mood} talking={talking} silhouette={silhouette} />
    </svg>
  );
}
