import { useEffect, useState } from 'preact/hooks';
import {
  closeUp,
  doubleTonight,
  finishedShift,
  levelUpNewsShown,
  pendingLevelUps,
} from '../../app/service';
import { openModal, renown, save } from '../../app/state';
import { CONTENT } from '../../content';
import { BARLEY } from '../../content/barley';
import { nightTotals } from '../../game/night';
import { ads } from '../../services/ads';
import { audio } from '../../services/audio';
import { Barley } from '../art/Barley';
import { Icon, RecipeIcon } from '../art/Icons';
import { Button } from '../components/Button';
import { Hud } from '../components/Hud';
import { Stars } from '../components/Stars';
import './screens.css';

export function SummaryScreen() {
  const shift = finishedShift.value ?? save.value.shift;
  const [line] = useState(
    () => BARLEY.closeNight[Math.floor(Math.random() * BARLEY.closeNight.length)]!,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    audio.play('serve');
    const news = pendingLevelUps.value;
    if (news.length === 0) return;
    levelUpNewsShown();
    void (async () => {
      for (const n of news) {
        audio.play('levelup');
        await openModal({ kind: 'levelUp', news: n });
      }
    })();
  }, []);

  if (!shift) return null;
  const totals = nightTotals(shift);
  const reviews = shift.results.filter((r) => r.review).slice(-3);
  const { level, fraction, current, needed } = renown.value;

  return (
    <div class="screen summary">
      <Hud title={`Night ${shift.day}`} subtitle="Closing time" />
      <div class="summary-scroll">
        <section class="summary-card panel">
          <div class="summary-head">
            <Barley mood="happy" class="summary-barley" />
            <div>
              <h2 class="panel-title summary-title">Closing Time</h2>
              <p class="muted summary-line">“{line}”</p>
            </div>
          </div>
          <div class="summary-totals">
            <div class="total">
              <Icon name="coin" size={26} />
              <span class="total-value">{totals.coins * (shift.doubled ? 2 : 1)}</span>
              <span class="total-label">coins{shift.doubled ? ' (doubled!)' : ''}</span>
            </div>
            <div class="total">
              <Icon name="star" size={26} />
              <span class="total-value">{totals.averageStars.toFixed(1)}</span>
              <span class="total-label">avg. review</span>
            </div>
            <div class="total">
              <Icon name="sparkle" size={26} />
              <span class="total-value">{totals.bonusWords}</span>
              <span class="total-label">bonus words</span>
            </div>
          </div>
          <ul class="summary-orders">
            {shift.results.map((r) => {
              const recipe = CONTENT.recipes.get(r.recipeId);
              return (
                <li>
                  {recipe && <RecipeIcon id={recipe.icon} size={30} />}
                  <div class="summary-order-text">
                    <strong>{r.who}</strong>
                    <span class="muted">{recipe?.name}</span>
                  </div>
                  <Stars value={r.stars} size={13} />
                  <span class="summary-coins">+{r.coins}</span>
                </li>
              );
            })}
          </ul>
          {reviews.length > 0 && (
            <div class="reviews">
              {reviews.map((r) => (
                <blockquote class="review">
                  “{r.review}”<cite>— {r.who}</cite>
                </blockquote>
              ))}
            </div>
          )}
          <div class="renown">
            <div class="renown-label">
              <Icon name="crown" size={18} /> Renown level {level}
              <span class="muted">
                {current}/{needed}
              </span>
            </div>
            <div class="bar">
              <div class="bar-fill" style={{ width: `${fraction * 100}%` }} />
            </div>
          </div>
        </section>
      </div>
      <div class="summary-actions">
        {ads.rewardedReady.value && !shift.doubled && totals.coins > 0 && (
          <Button
            variant="green"
            icon="ad"
            block
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await doubleTonight();
              setBusy(false);
            }}
          >
            Watch an ad: double tonight’s coins (+{totals.coins})
          </Button>
        )}
        <Button
          variant="gold"
          size="lg"
          block
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await closeUp();
          }}
        >
          Close up for the night
        </Button>
      </div>
    </div>
  );
}
