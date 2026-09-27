/** Mixes a #rrggbb colour towards black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  const mix = (c: number) => Math.round((target - c) * p + c);
  const r = mix(n >> 16);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const INK = '#2a1a10';
