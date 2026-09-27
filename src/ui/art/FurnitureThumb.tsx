import { CONTENT } from '../../content';
import { FURNITURE_ART, SLOT_VIEW } from './FurnitureArt';

/** A furniture piece cropped out of the scene, on a little patch of wall. */
export function FurnitureThumb({ id, class: className }: { id: string; class?: string }) {
  const def = CONTENT.furniture.get(id);
  const Art = FURNITURE_ART[id];
  if (!def || !Art) return null;
  const [x, y, w, h] = SLOT_VIEW[def.slot];
  const floor = 212;
  return (
    <svg
      class={['furniture-thumb', className].filter(Boolean).join(' ')}
      viewBox={`${x} ${y} ${w} ${h}`}
      aria-hidden="true"
    >
      <rect x={x} y={y} width={w} height={Math.max(0, floor - y)} fill="#6b4225" />
      <rect x={x} y={floor} width={w} height={Math.max(0, y + h - floor)} fill="#3e2415" />
      {def.slot === 'counter' && <rect x={x} y={256} width={w} height={h} fill="#b27a45" />}
      <Art />
    </svg>
  );
}
