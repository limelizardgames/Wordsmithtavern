import { enterTavern } from '../../app/actions';
import { save } from '../../app/state';
import { APP_VERSION } from '../../config/version';
import { Sign } from '../art/Sign';
import { TavernScene } from '../art/TavernScene';
import './screens.css';

export function TitleScreen() {
  const returning = save.value.flags.introDone;
  return (
    <div
      class="screen title-screen"
      onClick={() => void enterTavern()}
      role="button"
      aria-label="Enter the tavern"
    >
      <Sign class="title-sign" />
      <TavernScene class="title-scene" placed={save.value.furniture.placed} barleyMood="happy" />
      <div class="title-bottom">
        <p class="title-tag">Forge words. Cook wonders. Meet very strange guests.</p>
        <div class="title-cta">{returning ? 'Tap to step inside' : 'Tap to open the doors'}</div>
      </div>
      <div class="title-version">v{APP_VERSION}</div>
    </div>
  );
}

export function LoadingScreen({ error }: { error?: string | null }) {
  return (
    <div class="screen loading-screen">
      <Sign class="loading-sign" />
      {error ? (
        <p class="loading-error">
          The fire won’t light: {error}
          <br />
          <button class="btn btn-wood btn-sm" onClick={() => location.reload()}>
            Try again
          </button>
        </p>
      ) : (
        <p class="loading-text">Stoking the fire…</p>
      )}
    </div>
  );
}
