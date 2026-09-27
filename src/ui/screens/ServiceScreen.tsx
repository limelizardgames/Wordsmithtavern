import { useEffect } from 'preact/hooks';
import {
  barleySays,
  calm,
  canCalm,
  coach,
  dismissCoach,
  hintAvailable,
  service,
  tick,
  type ServiceState,
} from '../../app/service';
import { bonuses, openModal, save } from '../../app/state';
import { hintCost } from '../../game/economy';
import { Barley } from '../art/Barley';
import { Icon } from '../art/Icons';
import { TavernScene } from '../art/TavernScene';
import { IconButton } from '../components/Button';
import { Hud } from '../components/Hud';
import { Stars } from '../components/Stars';
import { LetterWheel } from '../service/LetterWheel';
import { OrderCard } from '../service/OrderCard';
import { WordPreview } from '../service/WordPreview';
import './service.css';

function PayoutPop({ s }: { s: ServiceState }) {
  const p = s.payout;
  if (!p || s.phase !== 'served') return null;
  return (
    <div class="payout" aria-live="polite">
      <div class="payout-total">
        <Icon name="coin" size={30} /> +{p.total}
      </div>
      <div class="payout-detail">
        {p.tip > 0 && <span>tip {p.tip}</span>}
        {p.favorite > 0 && <span>favourite +{p.favorite}</span>}
        {p.bonusWords > 0 && <span>tip jar +{p.bonusWords}</span>}
        <span>renown +{p.xp}</span>
      </div>
      <Stars value={p.stars} size={18} />
    </div>
  );
}

function CoachTip() {
  const c = coach.value;
  if (!c) return null;
  return (
    <button class={`coach coach-${c.anchor}`} onClick={dismissCoach}>
      <Barley mood="happy" />
      <span>{c.text}</span>
    </button>
  );
}

export function ServiceScreen() {
  const s = service.value;
  const shift = save.value.shift;

  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      tick((now - last) / 1000);
      last = now;
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const cooking = s?.phase === 'cooking';
  const cost = hintCost(bonuses.value);
  const customer = s
    ? {
        key: s.key,
        spec: s.who.portrait,
        mood: s.mood,
        talking: s.talking,
        motion:
          s.phase === 'enter'
            ? ('enter' as const)
            : s.phase === 'leaving'
              ? ('leave' as const)
              : ('idle' as const),
      }
    : null;

  return (
    <div class="screen service">
      <Hud
        title={`Night ${shift?.day ?? save.value.day}`}
        subtitle={
          shift && s
            ? `Guest ${Math.min(shift.index + (s.payout ? 0 : 1), shift.customers.length)} of ${shift.customers.length}`
            : undefined
        }
        right={
          <IconButton
            icon="gear"
            label="Settings"
            onClick={() => void openModal({ kind: 'settings' })}
          />
        }
      />
      <TavernScene
        class="service-scene"
        placed={save.value.furniture.placed}
        customer={customer}
        barleyMood={s?.payout ? 'happy' : 'neutral'}
        barleyTalking={!!barleySays.value}
      >
        {s?.bubble && !coach.value && (
          <div class="bubble bubble-guest" key={s.bubble}>
            <strong class="bubble-name">{s.who.name}</strong>
            {s.bubble}
          </div>
        )}
        {barleySays.value && (
          <div class="bubble bubble-barley" key={barleySays.value}>
            {barleySays.value}
          </div>
        )}
        {s && <PayoutPop s={s} />}
        {canCalm.value && (
          <button class="calm-btn" onClick={() => void calm()}>
            <Icon name="ad" size={20} />
            <span>Barley hums a tune</span>
          </button>
        )}
      </TavernScene>
      {s ? <OrderCard s={s} /> : <div class="order-placeholder" />}
      <div class="cook">
        <WordPreview letters={s?.order.letters ?? []} disabled={!cooking} />
        <div class="wheel-wrap">
          {s ? (
            <LetterWheel letters={s.order.letters} disabled={!cooking} />
          ) : (
            <div class="wheel" />
          )}
          <button
            class="corner-btn is-left"
            disabled={!cooking || !hintAvailable()}
            onClick={() => void openModal({ kind: 'hint' })}
            aria-label={`Taste Test hint, ${cost} coins`}
          >
            <Icon name="spoon" size={28} />
            <span class="corner-btn-label">Taste</span>
            <span class="corner-btn-cost">
              <Icon name="coin" size={12} />
              {cost}
            </span>
          </button>
        </div>
      </div>
      <CoachTip />
    </div>
  );
}
