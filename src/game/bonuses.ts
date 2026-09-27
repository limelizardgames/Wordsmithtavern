import type { Bonuses, FurnitureDef, FurnitureId, FurnitureSlot } from './types';

export const NO_BONUSES: Bonuses = {
  tipPct: 0,
  patiencePct: 0,
  bonusWordCoins: 0,
  xpPct: 0,
  hintDiscount: 0,
  extraCustomers: 0,
  pricePct: 0,
};

/** Only furniture that's actually on display counts. */
export function totalBonuses(
  placed: Partial<Record<FurnitureSlot, FurnitureId>>,
  catalog: ReadonlyMap<FurnitureId, FurnitureDef>,
): Bonuses {
  const total: Bonuses = { ...NO_BONUSES };
  for (const id of Object.values(placed)) {
    const def = id ? catalog.get(id) : undefined;
    if (!def) continue;
    for (const key of Object.keys(def.bonus) as (keyof Bonuses)[]) {
      total[key] += def.bonus[key] ?? 0;
    }
  }
  return total;
}

const LABELS: Record<keyof Bonuses, (v: number) => string> = {
  tipPct: (v) => `+${v}% tips`,
  patiencePct: (v) => `+${v}% patience`,
  bonusWordCoins: (v) => `+${v} coin${v === 1 ? '' : 's'} per bonus word`,
  xpPct: (v) => `+${v}% renown`,
  hintDiscount: (v) => `Taste Tests ${v} coin${v === 1 ? '' : 's'} cheaper`,
  extraCustomers: (v) => `+${v} guest${v === 1 ? '' : 's'} per night`,
  pricePct: (v) => `+${v}% menu prices`,
};

export function describeBonuses(bonus: Partial<Bonuses>): string[] {
  return (Object.keys(bonus) as (keyof Bonuses)[])
    .filter((k) => (bonus[k] ?? 0) > 0)
    .map((k) => LABELS[k](bonus[k]!));
}
