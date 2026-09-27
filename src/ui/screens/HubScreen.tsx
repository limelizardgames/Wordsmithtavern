import { useMemo, useState } from 'preact/hooks';
import { openTavern } from '../../app/service';
import { level, openModal, renown, save, screen } from '../../app/state';
import { CONTENT } from '../../content';
import { BARLEY } from '../../content/barley';
import { customersPerDay } from '../../game/progression';
import { dueChapter, guestProgress, isGuestUnlocked } from '../../game/night';
import { furniturePurchaseBlock, recipePurchaseBlock } from '../../game/shop';
import { bonuses } from '../../app/state';
import { Barley } from '../art/Barley';
import { Icon } from '../art/Icons';
import { TavernScene } from '../art/TavernScene';
import { Button, IconButton } from '../components/Button';
import { Hud } from '../components/Hud';
import './screens.css';

/** Barley's advice on the hub: a nudge towards whatever would help most right now. */
function barleyAdvice(): string[] {
  const s = save.value;
  const lines: string[] = [];
  for (const g of CONTENT.guestList) {
    if (isGuestUnlocked(g, s, CONTENT)) continue;
    if (
      g.unlock.furniture &&
      level.value >= g.unlock.level &&
      !s.furniture.owned.includes(g.unlock.furniture)
    ) {
      lines.push(`Rumour has it: ${g.rumor}`);
    }
  }
  const recipe = CONTENT.recipeList.find((r) => recipePurchaseBlock(s, r) === null);
  if (recipe) lines.push(`We could afford to learn ${recipe.name}. Fancier food, fancier tips.`);
  const decor = CONTENT.furnitureList.find((f) => furniturePurchaseBlock(s, f) === null);
  if (decor) lines.push(`That ${decor.name} would look lovely in here. Just saying.`);
  lines.push(...BARLEY.openNight.slice(0, 3));
  return lines;
}

/** A hint of who might walk in tonight. */
function tonightTeaser(): string {
  const s = save.value;
  const unlocked = CONTENT.guestList.filter((g) => isGuestUnlocked(g, s, CONTENT));
  if (s.shift) return 'Guests are still waiting inside. Better get back to it!';
  if (unlocked.some((g) => guestProgress(s, g.id).visits === 0))
    return 'A new face is expected tonight…';
  const due = unlocked
    .filter(
      (g) => guestProgress(s, g.id).visits > 0 && dueChapter(g, s, CONTENT, s.day) !== undefined,
    )
    .sort((a, b) => guestProgress(s, a.id).lastChapterDay - guestProgress(s, b.id).lastChapterDay);
  if (due[0]) return `${due[0].name.split(' ')[0]} has news to share tonight.`;
  return 'Just the regulars tonight. Probably.';
}

export function HubScreen() {
  const s = save.value;
  const shift = s.shift;
  const advice = useMemo(barleyAdvice, [
    s.coins,
    s.furniture.owned.length,
    s.recipes.length,
    level.value,
  ]);
  const [tip, setTip] = useState(0);

  const shopBadge = CONTENT.furnitureList.filter(
    (f) => furniturePurchaseBlock(s, f) === null,
  ).length;
  const recipeBadge = CONTENT.recipeList.filter((r) => recipePurchaseBlock(s, r) === null).length;
  const guests = customersPerDay(level.value, bonuses.value.extraCustomers);

  return (
    <div class="screen hub">
      <Hud
        title="Wordsmith Tavern"
        subtitle={`Night ${s.day} · ${guests} guests expected`}
        right={
          <IconButton
            icon="gear"
            label="Settings"
            onClick={() => void openModal({ kind: 'settings' })}
          />
        }
      />
      <TavernScene class="hub-scene" placed={s.furniture.placed} barleyMood="happy" />
      <nav class="hub-menu">
        <div class="hub-board panel">
          <div class="hub-board-row">
            <Icon name="crown" size={20} />
            <strong>Renown {renown.value.level}</strong>
            <div class="bar hub-bar">
              <div class="bar-fill" style={{ width: `${renown.value.fraction * 100}%` }} />
            </div>
            <span class="muted small">
              {renown.value.current}/{renown.value.needed}
            </span>
          </div>
          <div class="hub-board-row">
            <Icon name="bell" size={20} />
            <span>{tonightTeaser()}</span>
          </div>
          <button
            class="hub-board-row hub-advice"
            key={tip}
            onClick={() => setTip((t) => t + 1)}
            aria-label="Barley's advice, tap for more"
          >
            <Barley mood="happy" class="hub-board-barley" />
            <span>{advice[tip % advice.length]}</span>
          </button>
        </div>
        <Button variant="gold" size="lg" block icon="door" onClick={openTavern}>
          {shift ? `Continue night ${shift.day}` : 'Open for the night'}
        </Button>
        <div class="hub-row">
          <Button icon="shop" onClick={() => (screen.value = 'shop')}>
            Decor
            {shopBadge > 0 && <span class="btn-badge">{shopBadge}</span>}
          </Button>
          <Button icon="book" onClick={() => (screen.value = 'recipes')}>
            Recipes
            {recipeBadge > 0 && <span class="btn-badge">{recipeBadge}</span>}
          </Button>
          <Button icon="scroll" onClick={() => (screen.value = 'guests')}>
            Guests
          </Button>
        </div>
        <div class="hub-stats">
          <span>
            <Icon name="star" size={14} /> {s.stats.ordersServed} orders served
          </span>
          <span>
            <Icon name="sparkle" size={14} /> {s.stats.wordsFound} words forged
          </span>
          {s.stats.longestWord && (
            <span>
              Longest: <strong>{s.stats.longestWord.toUpperCase()}</strong>
            </span>
          )}
        </div>
      </nav>
      <div class="banner-spacer" />
    </div>
  );
}
