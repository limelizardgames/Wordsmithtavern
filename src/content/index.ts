import type { NewGameContent } from '../game/save';
import type { FurnitureDef, GuestDef, RecipeDef, TownsfolkDef } from '../game/types';
import { FURNITURE } from './furniture';
import { GUESTS } from './guests';
import { RECIPES } from './recipes';
import { TOWNSFOLK } from './townsfolk';

export interface GameContent {
  recipes: ReadonlyMap<string, RecipeDef>;
  furniture: ReadonlyMap<string, FurnitureDef>;
  guests: ReadonlyMap<string, GuestDef>;
  townsfolk: ReadonlyMap<string, TownsfolkDef>;
  recipeList: readonly RecipeDef[];
  furnitureList: readonly FurnitureDef[];
  guestList: readonly GuestDef[];
  townsfolkList: readonly TownsfolkDef[];
  newGame: NewGameContent;
}

export function buildContent(
  recipes: RecipeDef[] = RECIPES,
  furniture: FurnitureDef[] = FURNITURE,
  guests: GuestDef[] = GUESTS,
  townsfolk: TownsfolkDef[] = TOWNSFOLK,
): GameContent {
  return {
    recipes: new Map(recipes.map((r) => [r.id, r])),
    furniture: new Map(furniture.map((f) => [f.id, f])),
    guests: new Map(guests.map((g) => [g.id, g])),
    townsfolk: new Map(townsfolk.map((t) => [t.id, t])),
    recipeList: recipes,
    furnitureList: furniture,
    guestList: guests,
    townsfolkList: townsfolk,
    newGame: {
      starterRecipes: recipes.filter((r) => r.starter).map((r) => r.id),
      defaultFurniture: furniture.filter((f) => f.default).map((f) => ({ id: f.id, slot: f.slot })),
    },
  };
}

export const CONTENT = buildContent();
