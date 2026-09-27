import { useState } from 'preact/hooks';
import { displayFurniture, purchaseFurniture } from '../../app/actions';
import { level, save, screen } from '../../app/state';
import { CONTENT } from '../../content';
import { FURNITURE_SLOTS } from '../../content/furniture';
import { describeBonuses } from '../../game/bonuses';
import { isGuestUnlocked } from '../../game/night';
import { furniturePurchaseBlock } from '../../game/shop';
import type { FurnitureDef, FurnitureSlot } from '../../game/types';
import { FurnitureThumb } from '../art/FurnitureThumb';
import { Icon } from '../art/Icons';
import { TavernScene } from '../art/TavernScene';
import { Button, IconButton } from '../components/Button';
import { CoinPill } from '../components/Hud';
import './screens.css';

function ItemAction({ item, onDone }: { item: FurnitureDef; onDone: () => void }) {
  const s = save.value;
  const owned = s.furniture.owned.includes(item.id);
  const placed = s.furniture.placed[item.slot] === item.id;
  if (placed) {
    return (
      <span class="item-state is-placed">
        <Icon name="check" size={16} /> On display
      </span>
    );
  }
  if (owned) {
    return (
      <Button
        size="sm"
        onClick={() => {
          displayFurniture(item);
          onDone();
        }}
      >
        Display
      </Button>
    );
  }
  const block = furniturePurchaseBlock(s, item);
  if (block === 'not-for-sale') {
    return (
      <span class="item-state">
        <Icon name="heart" size={14} /> A story keepsake
      </span>
    );
  }
  if (block === 'locked') {
    return (
      <span class="item-state">
        <Icon name="lock" size={16} /> Renown {item.unlockLevel}
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
      onClick={() => {
        purchaseFurniture(item);
        onDone();
      }}
    >
      {item.price}
    </Button>
  );
}

export function ShopScreen() {
  const [slot, setSlot] = useState<FurnitureSlot>('hearth');
  const [preview, setPreview] = useState<string | null>(null);
  const s = save.value;
  const items = CONTENT.furnitureList.filter((f) => f.slot === slot);
  const previewItem = preview ? CONTENT.furniture.get(preview) : undefined;
  const placed = previewItem
    ? { ...s.furniture.placed, [previewItem.slot]: previewItem.id }
    : s.furniture.placed;

  return (
    <div class="screen shop">
      <header class="hud">
        <IconButton icon="back" label="Back to the tavern" onClick={() => (screen.value = 'hub')} />
        <div class="hud-title">
          <div class="hud-title-main">Decor</div>
          <div class="hud-title-sub">Tap an item to try it in the room</div>
        </div>
        <CoinPill />
      </header>
      <TavernScene
        class="shop-scene"
        placed={placed}
        barleyMood={previewItem ? 'surprised' : 'happy'}
      >
        {previewItem && !s.furniture.owned.includes(previewItem.id) && (
          <div class="preview-badge">Preview</div>
        )}
      </TavernScene>
      <div class="tabs" role="tablist">
        {FURNITURE_SLOTS.map((t) => {
          const buyable = CONTENT.furnitureList.some(
            (f) => f.slot === t.slot && furniturePurchaseBlock(s, f) === null,
          );
          return (
            <button
              role="tab"
              aria-selected={slot === t.slot}
              class={`tab ${slot === t.slot ? 'is-active' : ''}`}
              onClick={() => {
                setSlot(t.slot);
                setPreview(null);
              }}
            >
              {t.label}
              {buyable && <span class="tab-dot" />}
            </button>
          );
        })}
      </div>
      <div class="list">
        {items.map((item) => {
          const guest = item.attracts ? CONTENT.guests.get(item.attracts) : undefined;
          const lockedGuest = guest && !isGuestUnlocked(guest, s, CONTENT);
          return (
            <div
              class={`item-card panel ${preview === item.id ? 'is-previewing' : ''} ${level.value < item.unlockLevel && !item.special ? 'is-locked' : ''}`}
              onClick={() => setPreview(preview === item.id ? null : item.id)}
            >
              <FurnitureThumb id={item.id} class="item-thumb" />
              <div class="item-text">
                <div class="item-name">{item.name}</div>
                <div class="item-blurb muted">{item.blurb}</div>
                <div class="item-tags">
                  {describeBonuses(item.bonus).map((b) => (
                    <span class="tag tag-good">{b}</span>
                  ))}
                  {lockedGuest && <span class="tag tag-gold">Attracts a new guest…</span>}
                </div>
              </div>
              <div class="item-action" onClick={(e) => e.stopPropagation()}>
                <ItemAction item={item} onDone={() => setPreview(null)} />
              </div>
            </div>
          );
        })}
      </div>
      <div class="banner-spacer" />
    </div>
  );
}
