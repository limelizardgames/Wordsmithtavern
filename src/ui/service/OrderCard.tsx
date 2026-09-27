import { filledFlash, type ServiceState } from '../../app/service';
import { openModal, save } from '../../app/state';
import { filledSlots, patienceFraction, type SlotState } from '../../game/order';
import { Icon, IngredientIcon, INGREDIENT_NAMES, RecipeIcon } from '../art/Icons';
import './order.css';

function Slot({
  slot,
  index,
  letterCount,
}: {
  slot: SlotState;
  index: number;
  letterCount: number;
}) {
  const flash = filledFlash.value?.slot === index ? filledFlash.value.id : undefined;
  const boxes = slot.word
    ? slot.word.length
    : slot.hint
      ? slot.hint.length
      : slot.all
        ? letterCount
        : slot.min;
  const letters = Array.from({ length: boxes }, (_, i) => {
    if (slot.word) return slot.word[i]!;
    if (slot.hint && i < slot.revealed) return slot.hint[i]!;
    return '';
  });
  const label = slot.all ? 'Every letter' : `${slot.min}+ letters`;
  return (
    <div
      key={flash ? `${index}-${flash}` : index}
      class={[
        'slot',
        slot.word && 'is-filled',
        slot.all && 'is-all',
        slot.hint && !slot.word && 'is-hinted',
        flash && 'is-flash',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${INGREDIENT_NAMES[slot.ingredient]}: ${slot.word ? slot.word : label}`}
    >
      <div class="slot-icon">
        <IngredientIcon id={slot.ingredient} size={24} />
        {slot.word && (
          <span class="slot-check">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
      <div class="slot-main">
        <div class="slot-name">
          {INGREDIENT_NAMES[slot.ingredient]}
          {slot.all && <Icon name="sparkle" size={13} />}
        </div>
        <div class="slot-boxes">
          {letters.map((ch) => (
            <span class={`slot-box ${ch ? 'has-letter' : ''}`}>{ch.toUpperCase()}</span>
          ))}
          {!slot.word && !slot.all && !slot.hint && <span class="slot-plus">+</span>}
        </div>
      </div>
    </div>
  );
}

export function PatienceMeter({ fraction, relaxed }: { fraction: number; relaxed: boolean }) {
  if (relaxed) {
    return (
      <div class="patience is-relaxed" aria-label="Relaxed mode">
        <Icon name="leaf" size={16} /> Relaxed
      </div>
    );
  }
  const tone = fraction > 0.5 ? 'good' : fraction > 0.25 ? 'warn' : 'bad';
  return (
    <div
      class={`patience is-${tone}`}
      role="meter"
      aria-label="Guest patience"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <Icon name="hourglass" size={16} />
      <div class="patience-track">
        <div class="patience-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}

export function OrderCard({ s }: { s: ServiceState }) {
  const { order, recipe } = s;
  const cooking = s.phase === 'cooking';
  const filled = filledSlots(order);
  return (
    <section
      class={`order panel ${s.phase === 'served' ? 'is-served' : ''}`}
      aria-label={`Order: ${recipe.name}`}
    >
      <PatienceMeter fraction={patienceFraction(order)} relaxed={save.value.settings.relaxed} />
      <div class="order-head">
        <RecipeIcon id={recipe.icon} size={30} />
        <div class="order-name">{recipe.name}</div>
        {s.isFavorite && <span class="tag tag-gold">★ Favourite</span>}
        <span class="tag" aria-label={`${filled} of ${order.slots.length} ingredients in the pot`}>
          {filled}/{order.slots.length}
        </span>
        {order.bonus.length > 0 && (
          <span class="tag tag-good">
            <Icon name="coin" size={12} />+{order.bonus.length}
          </span>
        )}
      </div>
      <div class="order-slots">
        {order.slots.map((slot, i) => (
          <Slot slot={slot} index={i} letterCount={order.letters.length} />
        ))}
      </div>
      {cooking && (
        <button class="order-early" onClick={() => void openModal({ kind: 'serveEarly' })}>
          Serve early
        </button>
      )}
    </section>
  );
}
