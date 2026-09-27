import { levelFromXp } from './progression';
import type { SaveData } from './save';
import type { FurnitureDef, RecipeDef } from './types';

export type PurchaseBlock = 'owned' | 'locked' | 'not-for-sale' | 'funds';

export function recipePurchaseBlock(save: SaveData, recipe: RecipeDef): PurchaseBlock | null {
  if (save.recipes.includes(recipe.id)) return 'owned';
  if (recipe.special || recipe.cost <= 0) return 'not-for-sale';
  if (levelFromXp(save.xp) < recipe.unlockLevel) return 'locked';
  if (save.coins < recipe.cost) return 'funds';
  return null;
}

export function buyRecipe(save: SaveData, recipe: RecipeDef): SaveData {
  if (recipePurchaseBlock(save, recipe)) return save;
  return { ...save, coins: save.coins - recipe.cost, recipes: [...save.recipes, recipe.id] };
}

export function furniturePurchaseBlock(save: SaveData, item: FurnitureDef): PurchaseBlock | null {
  if (save.furniture.owned.includes(item.id)) return 'owned';
  if (item.special || item.default) return 'not-for-sale';
  if (levelFromXp(save.xp) < item.unlockLevel) return 'locked';
  if (save.coins < item.price) return 'funds';
  return null;
}

/** Buying a piece puts it straight on display; the old piece stays in storage. */
export function buyFurniture(save: SaveData, item: FurnitureDef): SaveData {
  if (furniturePurchaseBlock(save, item)) return save;
  return {
    ...save,
    coins: save.coins - item.price,
    furniture: {
      owned: [...save.furniture.owned, item.id],
      placed: { ...save.furniture.placed, [item.slot]: item.id },
    },
  };
}

export function placeFurniture(save: SaveData, item: FurnitureDef): SaveData {
  if (!save.furniture.owned.includes(item.id)) return save;
  return {
    ...save,
    furniture: { ...save.furniture, placed: { ...save.furniture.placed, [item.slot]: item.id } },
  };
}

/** Clears a slot (only for slots that don't come with a default piece). */
export function unplaceSlot(save: SaveData, slot: FurnitureDef['slot']): SaveData {
  const placed = { ...save.furniture.placed };
  delete placed[slot];
  return { ...save, furniture: { ...save.furniture, placed } };
}
