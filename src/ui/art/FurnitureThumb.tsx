import { CONTENT } from '../../content';
import { layer, type Layer } from './renders';
import { LayerImage } from './TavernScene';

/** Frame a piece for a thumbnail: roughly 6:5, around the part of it worth looking at. */
function frame(l: Layer, slot: string): string {
  let { x, y, w, h } = l;
  if (slot === 'hearth') {
    // A chimney breast runs to the ceiling; the fireplace itself is the interesting part.
    const keep = h * 0.58;
    y += h - keep;
    h = keep;
  }
  const aspect = 1.2;
  let fw = Math.max(w, h * aspect);
  let fh = fw / aspect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  fw *= 1.04;
  fh *= 1.04;
  return `${cx - fw / 2} ${cy - fh / 2} ${fw} ${fh}`;
}

/** A furniture piece cut from the tavern render, standing in its own patch of room. */
export function FurnitureThumb({ id, class: className }: { id: string; class?: string }) {
  const def = CONTENT.furniture.get(id);
  const l = layer(`item:${id}`);
  if (!def || !l) return null;
  return (
    <svg
      class={['furniture-thumb', className].filter(Boolean).join(' ')}
      viewBox={frame(l, def.slot)}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <LayerImage l={layer('base')} />
      {def.slot === 'counter' && <LayerImage l={layer('counter')} />}
      <LayerImage l={l} />
    </svg>
  );
}
