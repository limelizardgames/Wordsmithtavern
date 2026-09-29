import { BarleyGraphic } from '../ui/art/Barley';
import { barleyPortrait } from '../ui/art/renders';
import { Sign } from '../ui/art/Sign';

/**
 * Dev-only compositions rendered to PNG by scripts/render-app-art.mjs, then turned into every
 * native icon and splash size by @capacitor/assets.
 */
function Background() {
  return (
    <>
      <defs>
        <radialGradient id="art-bg" cx="50%" cy="42%" r="72%">
          <stop offset="0" stop-color="#8a5a36" />
          <stop offset="0.55" stop-color="#4a2c18" />
          <stop offset="1" stop-color="#1d120b" />
        </radialGradient>
        <radialGradient id="art-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#ffcf6b" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffcf6b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#art-bg)" />
      <circle cx="512" cy="560" r="400" fill="url(#art-glow)" />
    </>
  );
}

function Mascot({ scale = 1 }: { scale?: number }) {
  const photo = barleyPortrait('happy');
  if (photo) {
    // The rendered portrait is square, with Barley filling most of it.
    const size = 820 * scale;
    return <image href={photo} x={512 - size / 2} y={530 - size / 2} width={size} height={size} />;
  }
  // Barley is drawn in a 64 x 72 box; centre him on the canvas.
  const s = 8.6 * scale;
  return (
    <g transform={`translate(${512 - 32 * s} ${520 - 38 * s}) scale(${s})`}>
      <BarleyGraphic mood="happy" />
    </g>
  );
}

function Tile({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-8)`}>
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        rx={size * 0.22}
        fill="#f7e8c4"
        stroke="#2a1a10"
        stroke-width={size * 0.07}
      />
      <rect
        x={-size / 2}
        y={size * 0.3}
        width={size}
        height={size * 0.2}
        rx={size * 0.1}
        fill="#dcc084"
        opacity="0.6"
      />
      <text
        x="0"
        y={size * 0.2}
        text-anchor="middle"
        font-family="Fredoka, sans-serif"
        font-weight="700"
        font-size={size * 0.62}
        fill="#2a1a10"
      >
        W
      </text>
    </g>
  );
}

export function AppArt({ kind }: { kind: string }) {
  const full = {
    position: 'fixed' as const,
    inset: 0,
    width: '100vw',
    height: '100vh',
    display: 'block',
  };
  if (kind === 'icon' || kind === 'icon-bg') {
    return (
      <svg viewBox="0 0 1024 1024" style={full}>
        <Background />
        {kind === 'icon' && (
          <>
            <Mascot />
            <Tile x={760} y={770} size={210} />
          </>
        )}
      </svg>
    );
  }
  if (kind === 'icon-fg') {
    // Adaptive icon foreground: Android insets this layer into the safe zone itself.
    return (
      <svg viewBox="0 0 1024 1024" style={{ ...full, background: 'transparent' }}>
        <Mascot scale={0.95} />
        <Tile x={745} y={755} size={200} />
      </svg>
    );
  }
  // Splash: the sign on a flat tavern-dark background (flat colour keeps the native files small).
  return (
    <svg viewBox="0 0 2732 2732" style={{ ...full, background: '#1d120b' }}>
      <rect width="2732" height="2732" fill="#1d120b" />
      <g transform="translate(766 1010) scale(3.75)">
        <Sign />
      </g>
    </svg>
  );
}
