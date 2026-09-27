import { learnRecipe } from '../../app/actions';
import { save, screen } from '../../app/state';
import { CONTENT } from '../../content';
import { recipePurchaseBlock } from '../../game/shop';
import type { RecipeDef } from '../../game/types';
import { Icon, IngredientIcon, RecipeIcon } from '../art/Icons';
import { Button, IconButton } from '../components/Button';
import { CoinPill } from '../components/Hud';
import './screens.css';

function RecipeAction({ recipe }: { recipe: RecipeDef }) {
  const block = recipePurchaseBlock(save.value, recipe);
  if (block === 'owned') {
    return (
      <span class="item-state is-placed">
        <Icon name="check" size={16} /> On the menu
      </span>
    );
  }
  if (block === 'not-for-sale') {
    return (
      <span class="item-state">
        <Icon name="heart" size={14} /> A story reward
      </span>
    );
  }
  if (block === 'locked') {
    return (
      <span class="item-state">
        <Icon name="lock" size={16} /> Renown {recipe.unlockLevel}
      </span>
    );
  }
  return (
    <Button
      size="sm"
      variant="gold"
      icon="coin"
      disabled={block === 'funds'}
      silent
      onClick={() => learnRecipe(recipe)}
    >
      {recipe.cost}
    </Button>
  );
}

export function RecipesScreen() {
  const known = save.value.recipes;
  const fans = (id: string) => CONTENT.guestList.filter((g) => g.favorites.includes(id));
  return (
    <div class="screen recipes">
      <header class="hud">
        <IconButton icon="back" label="Back to the tavern" onClick={() => (screen.value = 'hub')} />
        <div class="hud-title">
          <div class="hud-title-main">Recipe Book</div>
          <div class="hud-title-sub">
            {known.length} of {CONTENT.recipeList.length} dishes on the menu
          </div>
        </div>
        <CoinPill />
      </header>
      <div class="list">
        <p class="list-intro">
          Guests order anything on your menu. Fancier dishes hand you bigger letter sets and pay
          more. Guests pay extra for their favourites.
        </p>
        {CONTENT.recipeList.map((r) => {
          const isKnown = known.includes(r.id);
          const favouriteOf = fans(r.id).filter((g) => save.value.guests[g.id]?.visits);
          return (
            <div class={`item-card panel recipe-card ${isKnown ? 'is-known' : ''}`}>
              <div class="recipe-icon">
                <RecipeIcon id={r.icon} size={52} />
              </div>
              <div class="item-text">
                <div class="item-name">{r.name}</div>
                <div class="item-blurb muted">{r.blurb}</div>
                <div class="recipe-slots" aria-label="Ingredients">
                  {r.slots.map((sl) => (
                    <span class={`recipe-slot ${sl.all ? 'is-all' : ''}`}>
                      <IngredientIcon id={sl.ingredient} size={16} />
                      {sl.all ? 'all' : `${sl.min}+`}
                    </span>
                  ))}
                </div>
                <div class="item-tags">
                  <span class="tag">{r.letters} letters</span>
                  <span class="tag tag-gold">
                    <Icon name="coin" size={12} /> {r.price}
                  </span>
                  {favouriteOf.length > 0 && (
                    <span class="tag">
                      ♥ {favouriteOf.map((g) => g.name.split(' ')[0]).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div class="item-action">
                <RecipeAction recipe={r} />
              </div>
            </div>
          );
        })}
      </div>
      <div class="banner-spacer" />
    </div>
  );
}
