import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { adHint, buyHint, serve } from '../../app/service';
import { claimGift, resetProgress, setSetting } from '../../app/actions';
import { bonuses, closeModal, modal, openModal, save, type Modal } from '../../app/state';
import { BARLEY } from '../../content/barley';
import { describeBonuses } from '../../game/bonuses';
import { DAILY_GIFTS } from '../../game/daily';
import { hintCost } from '../../game/economy';
import { ads, openPrivacyOptions } from '../../services/ads';
import { Barley } from '../art/Barley';
import { FurnitureThumb } from '../art/FurnitureThumb';
import { Icon, RecipeIcon, type UiIconName } from '../art/Icons';
import { Portrait } from '../art/Portrait';
import { Button } from '../components/Button';
import { CONTENT } from '../../content';
import { APP_VERSION } from '../../config/version';

function Frame({
  title,
  children,
  onClose,
}: {
  title: ComponentChildren;
  children: ComponentChildren;
  onClose?: () => void;
}) {
  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="modal panel" role="dialog" aria-modal="true">
        {onClose && (
          <button class="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={22} />
          </button>
        )}
        <h2 class="panel-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: UiIconName;
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      class={`setting ${on ? 'is-on' : ''}`}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <Icon name={icon} size={22} />
      <span class="setting-text">
        <span class="setting-label">{label}</span>
        {hint && <span class="setting-hint">{hint}</span>}
      </span>
      <span class="switch" aria-hidden="true">
        <span class="switch-knob" />
      </span>
    </button>
  );
}

function SettingsModal() {
  const s = save.value.settings;
  return (
    <Frame title="Settings" onClose={closeModal}>
      <div class="modal-body">
        <Toggle
          icon="sound"
          label="Sound effects"
          on={s.sound}
          onChange={(v) => setSetting('sound', v)}
        />
        <Toggle icon="music" label="Music" on={s.music} onChange={(v) => setSetting('music', v)} />
        <Toggle
          icon="vibrate"
          label="Vibration"
          on={s.haptics}
          onChange={(v) => setSetting('haptics', v)}
        />
        <Toggle
          icon="leaf"
          label="Relaxed mode"
          hint="Guests never lose patience. Tips stay steady."
          on={s.relaxed}
          onChange={(v) => setSetting('relaxed', v)}
        />
      </div>
      <div class="modal-actions">
        {ads.privacyRequired.value && (
          <Button icon="shield" onClick={() => void openPrivacyOptions()}>
            Privacy choices
          </Button>
        )}
        <Button icon="scroll" onClick={() => void openModal({ kind: 'credits' })}>
          Credits
        </Button>
        <Button
          variant="ghost"
          icon="trash"
          onClick={() =>
            void openModal({
              kind: 'confirm',
              title: 'Start over?',
              body: 'This wipes your tavern, coins, recipes and every guest’s story. It can’t be undone.',
              confirm: 'Wipe my tavern',
              danger: true,
              onConfirm: () => void resetProgress(),
            })
          }
        >
          Reset progress
        </Button>
        <p class="modal-footnote">Wordsmith Tavern v{APP_VERSION}</p>
      </div>
    </Frame>
  );
}

function CreditsModal() {
  return (
    <Frame title="Credits" onClose={closeModal}>
      <div class="modal-body credits">
        <p>
          <strong>Wordsmith Tavern</strong> — a cosy word game about a tavern where cooking is word
          magic.
        </p>
        <p>
          Word lists from <strong>SCOWL</strong> © Kevin Atkinson and contributors, used under the
          SCOWL licence.
        </p>
        <p>
          Fonts: <strong>Fredoka</strong>, <strong>Almendra</strong> and{' '}
          <strong>Uncial Antiqua</strong>, SIL Open Font License.
        </p>
        <p>Built with Preact and Capacitor. All art and sound are generated in code.</p>
        <p class="muted">Barley would like it noted that he did most of the work.</p>
      </div>
      <div class="modal-actions">
        <Button variant="gold" onClick={closeModal}>
          Lovely
        </Button>
      </div>
    </Frame>
  );
}

function ConfirmModal({ m }: { m: Extract<Modal, { kind: 'confirm' }> }) {
  return (
    <Frame title={m.title} onClose={closeModal}>
      <p class="modal-text">{m.body}</p>
      <div class="modal-actions">
        <Button
          variant={m.danger ? 'red' : 'gold'}
          onClick={() => {
            closeModal();
            m.onConfirm();
          }}
        >
          {m.confirm}
        </Button>
        <Button variant="ghost" onClick={closeModal}>
          Never mind
        </Button>
      </div>
    </Frame>
  );
}

function LevelUpModal({ m }: { m: Extract<Modal, { kind: 'levelUp' }> }) {
  const n = m.news;
  const [line] = useState(() => BARLEY.levelUp[Math.floor(Math.random() * BARLEY.levelUp.length)]!);
  return (
    <Frame title={`Renown level ${n.level}!`}>
      <div class="modal-body">
        <div class="levelup-hero">
          <Icon name="crown" size={64} class="levelup-crown" />
          <div class="reward-coins">
            <Icon name="coin" size={28} /> +{n.coins}
          </div>
        </div>
        <p class="modal-text center muted">“{line}”</p>
        {n.moreGuestsPerNight && (
          <div class="unlock-row">
            <Icon name="door" size={26} />
            <span>One more guest visits every night</span>
          </div>
        )}
        {n.recipes.map((r) => (
          <div class="unlock-row">
            <RecipeIcon id={r.icon} size={30} />
            <span>
              New recipe to learn: <strong>{r.name}</strong>
            </span>
          </div>
        ))}
        {n.furniture.map((f) => (
          <div class="unlock-row">
            <FurnitureThumb id={f.id} class="unlock-thumb" />
            <span>
              New in the shop: <strong>{f.name}</strong>
            </span>
          </div>
        ))}
        {n.guests.map((g) => (
          <div class="unlock-row">
            <div class="unlock-portrait">
              <Portrait spec={g.portrait} silhouette />
            </div>
            <span class="muted">{g.rumor}</span>
          </div>
        ))}
      </div>
      <div class="modal-actions">
        <Button variant="gold" onClick={closeModal}>
          Huzzah!
        </Button>
      </div>
    </Frame>
  );
}

function RewardModal({ m }: { m: Extract<Modal, { kind: 'reward' }> }) {
  const guest = m.guestId ? CONTENT.guests.get(m.guestId) : undefined;
  const r = m.reward;
  return (
    <Frame title={m.title}>
      <div class="modal-body">
        {m.body && <p class="modal-text center muted">{m.body}</p>}
        <div class="reward-hero">
          {guest && (
            <div class="reward-portrait">
              <Portrait spec={guest.portrait} mood="happy" />
            </div>
          )}
          {r.furniture && <FurnitureThumb id={r.furniture.id} class="reward-thumb" />}
          {!r.furniture && r.recipe && <RecipeIcon id={r.recipe.icon} size={96} />}
        </div>
        {r.furniture && (
          <div class="reward-item">
            <strong>{r.furniture.name}</strong>
            <span class="muted">{r.furniture.blurb}</span>
            <span class="tag tag-good">{describeBonuses(r.furniture.bonus).join(' · ')}</span>
            <span class="muted small">It’s on display in your tavern now.</span>
          </div>
        )}
        {r.recipe && (
          <div class="reward-item">
            <strong>New recipe: {r.recipe.name}</strong>
            <span class="muted">{r.recipe.blurb}</span>
          </div>
        )}
        {r.coins > 0 && (
          <div class="reward-coins">
            <Icon name="coin" size={24} /> +{r.coins}
          </div>
        )}
      </div>
      <div class="modal-actions">
        <Button variant="gold" onClick={closeModal}>
          Wonderful!
        </Button>
      </div>
    </Frame>
  );
}

function DailyModal({ m }: { m: Extract<Modal, { kind: 'daily' }> }) {
  const [line] = useState(
    () => BARLEY.dailyGift[Math.floor(Math.random() * BARLEY.dailyGift.length)]!,
  );
  const day = ((m.streak - 1) % DAILY_GIFTS.length) + 1;
  return (
    <Frame title="Barley’s Tip Jar">
      <div class="modal-body">
        <div class="daily-hero">
          <Barley mood="happy" class="daily-barley" />
          <p class="modal-text">“{line}”</p>
        </div>
        <div class="daily-streak" aria-label={`Day ${day} of 7`}>
          {DAILY_GIFTS.map((amount, i) => (
            <div
              class={`daily-day ${i + 1 < day ? 'is-past' : ''} ${i + 1 === day ? 'is-today' : ''}`}
            >
              <span class="daily-day-n">Day {i + 1}</span>
              <Icon name="coin" size={18} />
              <span>{amount}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="modal-actions">
        {ads.rewardedReady.value && (
          <Button variant="green" icon="ad" onClick={() => void claimGift(true)}>
            Watch an ad: collect {m.amount * 2}
          </Button>
        )}
        <Button variant="gold" icon="coin" onClick={() => void claimGift(false)}>
          Collect {m.amount}
        </Button>
      </div>
    </Frame>
  );
}

function HintModal() {
  const cost = hintCost(bonuses.value);
  const afford = save.value.coins >= cost;
  return (
    <Frame title="Taste Test" onClose={closeModal}>
      <div class="modal-body">
        <p class="modal-text center">
          Have a little taste. Barley reveals one letter of a word for the trickiest ingredient.
        </p>
      </div>
      <div class="modal-actions">
        <Button
          variant="gold"
          icon="coin"
          disabled={!afford}
          silent
          onClick={() => {
            if (buyHint()) closeModal();
          }}
        >
          {afford ? `Taste for ${cost} coins` : `Needs ${cost} coins`}
        </Button>
        {ads.rewardedReady.value && (
          <Button
            variant="green"
            icon="ad"
            onClick={() => {
              closeModal();
              void adHint();
            }}
          >
            Free taste: watch an ad
          </Button>
        )}
        <Button variant="ghost" onClick={closeModal}>
          Keep trying
        </Button>
      </div>
    </Frame>
  );
}

function ServeEarlyModal() {
  return (
    <Frame title="Serve it now?" onClose={closeModal}>
      <p class="modal-text">
        The guest pays half price for whatever made it into the pot, with no tip. Story guests will
        want to come back for the full dish.
      </p>
      <div class="modal-actions">
        <Button
          variant="red"
          onClick={() => {
            closeModal();
            void serve();
          }}
        >
          Serve it as it is
        </Button>
        <Button variant="gold" onClick={closeModal}>
          Keep cooking
        </Button>
      </div>
    </Frame>
  );
}

const DISMISSABLE = new Set<Modal['kind']>([
  'settings',
  'credits',
  'hint',
  'serveEarly',
  'confirm',
]);

export function ModalHost() {
  const m = modal.value;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const current = modal.value;
      if (e.key === 'Escape' && current && DISMISSABLE.has(current.kind)) {
        e.stopImmediatePropagation();
        closeModal();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  if (!m) return null;
  switch (m.kind) {
    case 'settings':
      return <SettingsModal key={m.id} />;
    case 'credits':
      return <CreditsModal key={m.id} />;
    case 'confirm':
      return <ConfirmModal key={m.id} m={m} />;
    case 'levelUp':
      return <LevelUpModal key={m.id} m={m} />;
    case 'reward':
      return <RewardModal key={m.id} m={m} />;
    case 'daily':
      return <DailyModal key={m.id} m={m} />;
    case 'hint':
      return <HintModal key={m.id} />;
    case 'serveEarly':
      return <ServeEarlyModal key={m.id} />;
    default:
      return null;
  }
}
